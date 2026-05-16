import { describe, it, expect } from "vitest";
import {
  createRelationshipState,
  calculateAffectionDelta,
  updateAffection,
  STAGE_LABELS,
  checkBoundaryViolation,
} from "../relationship.js";

describe("createRelationshipState", () => {
  it("creates lover state for direct mode", () => {
    const state = createRelationshipState("direct");
    expect(state.stage).toBe("lover");
    expect(state.mode).toBe("direct");
    expect(state.affection).toBe(80);
  });

  it("creates stranger state for slow_burn mode", () => {
    const state = createRelationshipState("slow_burn");
    expect(state.stage).toBe("stranger");
    expect(state.mode).toBe("slow_burn");
    expect(state.affection).toBe(0);
  });
});

describe("STAGE_LABELS", () => {
  it("has entries for all stages", () => {
    const stages = ["stranger", "friend", "close_friend", "crush", "lover"];
    for (const stage of stages) {
      expect(STAGE_LABELS[stage as keyof typeof STAGE_LABELS]).toBeDefined();
      expect(STAGE_LABELS[stage as keyof typeof STAGE_LABELS].length).toBeGreaterThan(0);
    }
  });
});

describe("calculateAffectionDelta", () => {
  it("returns positive delta for long, engaged messages", () => {
    const msg = "今天去了一家超棒的咖啡店！他们的手冲咖啡特别好喝，甜点也很精致。装修是日式简约风，超级适合拍照。下次我们一起去吧！";
    const delta = calculateAffectionDelta(msg, []);
    expect(delta).toBeGreaterThan(0);
  });

  it("returns more positive delta for very long messages", () => {
    const longMsg = "A".repeat(101);
    const shortMsg = "哈哈";
    expect(calculateAffectionDelta(longMsg, [])).toBeGreaterThan(calculateAffectionDelta(shortMsg, []));
  });

  it("returns negative delta for very short messages", () => {
    const delta = calculateAffectionDelta("嗯", []);
    expect(delta).toBeLessThan(0);
  });

  it("detects positive keywords", () => {
    const delta = calculateAffectionDelta("哈哈你好厉害！", []);
    expect(delta).toBeGreaterThan(0);
  });

  it("detects negative keywords", () => {
    const delta = calculateAffectionDelta("别烦我走开", []);
    expect(delta).toBeLessThan(0);
  });

  it("detects sharing personal info as trust signal", () => {
    const base = calculateAffectionDelta("嗯嗯", []);
    const withShare = calculateAffectionDelta("我觉得你说的对", []);
    expect(withShare).toBeGreaterThan(base);
  });
});

describe("updateAffection", () => {
  it("clamps affection to [0, 100]", () => {
    const state = createRelationshipState("slow_burn");
    updateAffection(state, -100);
    expect(state.affection).toBe(0);
    updateAffection(state, 200);
    expect(state.affection).toBe(100);
  });

  it("advances stages when affection thresholds are met", () => {
    const state = createRelationshipState("slow_burn");
    expect(state.stage).toBe("stranger");
    updateAffection(state, 20); // cross friend threshold (15)
    expect(state.stage).toBe("friend");
  });
});

describe("checkBoundaryViolation", () => {
  it("detects abusive language about family", () => {
    expect(checkBoundaryViolation("你妈真恶心")).toBe(true);
  });

  it("does not flag normal messages", () => {
    expect(checkBoundaryViolation("今天好累啊")).toBe(false);
    expect(checkBoundaryViolation("我觉得你说的有道理")).toBe(false);
  });
});
