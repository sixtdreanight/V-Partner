import { useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button";

const STORAGE_KEY = "yumema_survey";
const TRIGGER_COUNT = 20;
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export function shouldShowSurvey(): boolean {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (data.dismissed) {
      const dismissedAt = data.dismissedAt || 0;
      if (Date.now() - dismissedAt < DISMISS_DURATION) return false;
      // Reset after 30 days
      data.dismissed = false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    const count = data.msgCount || 0;
    return count >= TRIGGER_COUNT && !data.submitted;
  } catch {
    return false;
  }
}

export function incrementMsgCount() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data.msgCount = (data.msgCount || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const EMOJI_RATINGS = [
  { value: 1, emoji: "😞", label: "很差" },
  { value: 2, emoji: "😕", label: "不太好" },
  { value: 3, emoji: "😐", label: "一般" },
  { value: 4, emoji: "😊", label: "不错" },
  { value: 5, emoji: "😍", label: "很棒" },
];

const FEATURES = ["应用内聊天", "QQ 机器人", "微信机器人"];
const PROBLEMS = [
  "QQ 无法连接",
  "回复答非所问",
  "回复太慢",
  "软件闪退/卡死",
  "安装失败",
  "设置太复杂",
  "界面不好看",
];

export default function SurveyDialog({ onClose }: { onClose: () => void }) {
  const [satisfaction, setSatisfaction] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [otherProblem, setOtherProblem] = useState("");
  const [missing, setMissing] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    try {
      await window.api.submitSurvey({
        satisfaction,
        features,
        problems: otherProblem ? [...problems, otherProblem] : problems,
        missing,
        notes,
      });
    } catch {
      // ignore — data saved locally even if IPC fails
    }
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data.submitted = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    setSubmitted(true);
  };

  const handleDismiss = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      data.dismissed = true;
      data.dismissedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
    onClose();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm fade-in">
        <div className="w-[480px] rounded-2xl glass border border-border shadow-xl scale-in p-8 text-center space-y-4">
          <div style={{ fontSize: 48 }}>😍</div>
          <h3 className="text-lg font-semibold">感谢你的反馈！</h3>
          <p className="text-sm text-muted-foreground">
            你的意见会帮助我们让 Yumema 变得更好
          </p>
          <Button variant="primary" onClick={onClose}>完成</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm fade-in">
      <div className="w-[480px] max-h-[85vh] rounded-2xl overflow-y-auto flex flex-col glass border border-border shadow-xl scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h3 className="text-base font-semibold">帮助我们改进</h3>
            <p className="text-xs text-muted-foreground mt-0.5">你的反馈对 Yumema 很重要</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Satisfaction */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <label className="text-sm font-medium">你对 Yumema 的整体感受？</label>
            <div className="flex items-center justify-center gap-3">
              {EMOJI_RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSatisfaction(r.value)}
                  className="flex flex-col items-center gap-1 transition-all"
                  style={{
                    transform: satisfaction === r.value ? "scale(1.25)" : "scale(1)",
                    opacity: satisfaction === 0 || satisfaction === r.value ? 1 : 0.5,
                    filter: satisfaction === 0 || satisfaction === r.value ? "none" : "grayscale(0.5)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{r.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium">你主要使用哪些功能？（多选）</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f}
                  onClick={() => toggle(features, setFeatures, f)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: features.includes(f) ? "var(--primary)" : "var(--background)",
                    color: features.includes(f) ? "white" : "var(--muted-foreground)",
                    border: features.includes(f) ? "1px solid var(--primary)" : "1px solid var(--border)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Problems */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium">遇到了哪些问题？（多选）</label>
            <div className="flex flex-wrap gap-2">
              {PROBLEMS.map((p) => (
                <button
                  key={p}
                  onClick={() => toggle(problems, setProblems, p)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: problems.includes(p) ? "var(--destructive)" : "var(--background)",
                    color: problems.includes(p) ? "white" : "var(--muted-foreground)",
                    border: problems.includes(p) ? "1px solid var(--destructive)" : "1px solid var(--border)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={otherProblem}
              onChange={(e) => setOtherProblem(e.target.value)}
              placeholder="其他问题..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-background border border-input text-foreground outline-none placeholder:text-muted-foreground mt-1"
            />
          </div>

          {/* Missing features */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium">缺少什么功能？（选填）</label>
            <input
              type="text"
              value={missing}
              onChange={(e) => setMissing(e.target.value)}
              placeholder="例如：语音消息、多语言..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-background border border-input text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Notes */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
            <label className="text-sm font-medium">还有什么想说的？（选填）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="任何想法都可以告诉我们..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm bg-background border border-input text-foreground outline-none resize-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center gap-3">
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            提交反馈
          </Button>
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            不再提示
          </button>
        </div>
      </div>
    </div>
  );
}
