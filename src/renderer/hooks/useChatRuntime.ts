import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocalRuntime } from "@assistant-ui/react";
import type { ChatModelAdapter, ChatModelRunOptions, ChatModelRunUpdate, ThreadMessageLike } from "@assistant-ui/react";
import { incrementMsgCount } from "../components/shared/SurveyDialog";

const BURST_WINDOW = 2000;
const BURST_WAIT = 500;
const NORMAL_WAIT = 800;
const TYPING_WAIT = 1200;
const RUN_TIMEOUT = 30000;

function loadHistory(): Promise<ThreadMessageLike[]> {
  return window.api.loadHistory().then((raw: unknown) => {
    const turns = raw as Array<{ role: string; content: string; timestamp: string }>;
    if (!Array.isArray(turns)) return [];
    return turns.map((t) => ({
      role: (t.role === "assistant" || t.role === "partner") ? "assistant" as const : "user" as const,
      content: [{ type: "text" as const, text: t.content }],
    }));
  }).catch(() => [] as ThreadMessageLike[]);
}

function loadProfile(): Promise<Record<string, unknown> | null> {
  return window.api.getState().then((s: unknown) => {
    return (s as { profile: Record<string, unknown> | null }).profile ?? null;
  }).catch(() => null);
}

export function useChatRuntime(initialMessages: readonly ThreadMessageLike[]) {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [composing, setComposing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const queueRef = useRef<string[]>([]);
  const pendingRef = useRef<string[]>([]);
  const enterHistoryRef = useRef<number[]>([]);
  const lastKeystrokeRef = useRef(0);
  const isRunningRef = useRef(false);
  const runtimeRef = useRef<any>(null);

  useEffect(() => { loadProfile().then(setProfile); }, []);

  const calcWait = useCallback((): number => {
    const typingNow = Date.now() - lastKeystrokeRef.current < 1500;
    const h = enterHistoryRef.current;
    const burst = h.length >= 2 && h[h.length - 1] - h[h.length - 2] < BURST_WINDOW;
    if (typingNow) return TYPING_WAIT;
    if (burst) return BURST_WAIT;
    return NORMAL_WAIT;
  }, []);

  const chatAdapter: ChatModelAdapter = useMemo(() => ({
    async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunUpdate, void> {
      const { messages, abortSignal } = options;
      const userMsg = [...messages].reverse().find((m) => m.role === "user");
      if (!userMsg) return;
      const userText = userMsg.content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
      if (!userText.trim()) return;

      // adaptive delay
      setComposing(true);
      const wait = calcWait();
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, wait);
        abortSignal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
      });
      if (abortSignal.aborted) { setComposing(false); return; }

      const batch = pendingRef.current.length > 0 ? [...pendingRef.current] : [userText];
      pendingRef.current = [];

      const text = batch.join("\n");
      incrementMsgCount();
      const startTime = Date.now();
      let errorOccurred = false;
      let chunkCount = 0;

      const unsub = window.api.on("chat:reply-chunk", (data: unknown) => {
        const d = data as { text: string; index: number; total: number };
        setComposing(false);
        // each chunk = separate assistant bubble
        runtimeRef.current?.thread?.append({
          role: "assistant",
          content: [{ type: "text", text: d.text }],
          startRun: false,
        });
        chunkCount++;
      });

      window.api.sendMessage(text).catch(() => { errorOccurred = true; });

      // wait for all chunks or timeout
      try {
        const totalChunks = 99; // unknown, wait for timeout
        let waited = 0;
        while (chunkCount === 0 && waited < 5000 && !abortSignal.aborted && !errorOccurred) {
          await new Promise(r => setTimeout(r, 200));
          waited += 200;
        }
        // wait a bit more for remaining chunks
        let idleCount = 0;
        let lastChunkCount = chunkCount;
        while (idleCount < 5 && Date.now() - startTime < RUN_TIMEOUT && !abortSignal.aborted) {
          await new Promise(r => setTimeout(r, 500));
          if (chunkCount === lastChunkCount) { idleCount++; }
          else { idleCount = 0; lastChunkCount = chunkCount; }
          if (idleCount >= 3) break;
        }
      } finally { unsub(); setComposing(false); isRunningRef.current = false; }

      // drain queued messages
      if (queueRef.current.length > 0) {
        setTimeout(() => {
          const qbatch = [...queueRef.current];
          queueRef.current = [];
          setQueueSize(0);
          for (const msg of qbatch) runtimeRef.current?.thread?.append(msg);
        }, 300);
      }

      // return empty — actual content already added as separate bubbles
      return { status: { type: "complete", reason: "stop" } as const };
    },
  }), [calcWait]);

  const runtime = useLocalRuntime(chatAdapter, { initialMessages });
  runtimeRef.current = runtime;

  const onTypingActivity = useCallback(() => {
    lastKeystrokeRef.current = Date.now();
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    enterHistoryRef.current.push(Date.now());
    if (enterHistoryRef.current.length > 5) enterHistoryRef.current.shift();
    incrementMsgCount();
    pendingRef.current.push(content.trim());
    isRunningRef.current = true;
    // always show bubble via thread.append — aborts previous adaptive wait, restarts timer
    runtime.thread.append(content.trim());
  }, [runtime]);

  const regenerate = useCallback(async () => {
    try { await window.api.regenerateLast(); } catch (err) { console.error("Regenerate failed:", err); }
  }, []);

  const placeholder = queueSize > 0
    ? `还有 ${queueSize} 条排队中...`
    : "输入消息... (Enter 发送)";

  return { runtime, profile, queueSize, composing, sendMessage, regenerate, onTypingActivity, placeholder };
}

export function useAppInit() {
  const [state, setState] = useState<{ initialMessages: ThreadMessageLike[]; ready: boolean }>({ initialMessages: [], ready: false });
  useEffect(() => { Promise.all([loadHistory(), loadProfile()]).then(([msgs]) => { setState({ initialMessages: msgs, ready: true }); }); }, []);
  return state;
}
