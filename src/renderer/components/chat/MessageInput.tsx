import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

export default function MessageInput({
  onSend, disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div style={{ padding: "12px 16px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center",
        background: "var(--gray-3)",
        borderRadius: 18,
        border: "1px solid var(--gray-5)",
        padding: "8px 4px 8px 14px",
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送)"
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: "22px",
            minHeight: 22,
            maxHeight: 96,
            color: "var(--gray-12)",
            padding: "4px 0",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: canSend ? "pointer" : "default",
            background: canSend ? "var(--accent-9)" : "transparent",
            transition: "transform 150ms, background 150ms",
            marginLeft: 6,
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Send size={15} color={canSend ? "white" : "var(--gray-9)"} />
        </button>
      </div>
    </div>
  );
}
