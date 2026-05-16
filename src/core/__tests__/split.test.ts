import { describe, it, expect } from "vitest";
import { splitForChat } from "../split.js";

describe("splitForChat", () => {
  it("returns empty string array for empty input", () => {
    expect(splitForChat("")).toEqual([""]);
  });

  it("returns single bubble for short text", () => {
    const result = splitForChat("今天天气真好。");
    expect(result).toEqual(["今天天气真好。"]);
  });

  it("splits on Chinese punctuation", () => {
    const result = splitForChat("今天天气真好！我们去散步吧？好呀。");
    expect(result).toEqual(["今天天气真好！", "我们去散步吧？", "好呀。"]);
  });

  it("removes full-width bracket content (action/meta descriptions)", () => {
    const result = splitForChat("（笑着）今天天气真好。");
    expect(result).toEqual(["今天天气真好。"]);
  });

  it("removes *action* markers", () => {
    const result = splitForChat("*笑着摇头*今天天气真好。");
    expect(result).toEqual(["今天天气真好。"]);
  });

  it("removes _thought_ markers", () => {
    const result = splitForChat("_心里想_今天天气真好。");
    expect(result).toEqual(["今天天气真好。"]);
  });

  it("splits long sentences exceeding 50 chars on commas", () => {
    const long = "这是一句非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的话，需要被拆分。";
    const result = splitForChat(long);
    expect(result.length).toBeGreaterThan(1);
    for (const bubble of result) {
      expect(bubble.length).toBeLessThanOrEqual(50);
    }
  });

  it("merges trailing punctuation-only segments into previous segment", () => {
    const result = splitForChat("你好。！");
    expect(result).toEqual(["你好。！"]);
  });

  it("handles text with only punctuation", () => {
    const result = splitForChat("...");
    expect(result.length).toBe(1);
  });

  it("keeps ASCII art / kaomoji intact", () => {
    const result = splitForChat("今天很开心(´▽｀)。");
    expect(result).toEqual(["今天很开心(´▽｀)。"]);
  });
});
