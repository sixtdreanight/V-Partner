/**
 * 语义提示 — 教 AI 理解人类日常语言习惯
 *
 * 参考 SillyTavern 的 World Info + Author's Note 模式
 * 在系统 prompt 中注入人类社交约定，减少"字面理解"错误
 */

export function buildSemanticHints(hour: number): string {
  const hints: string[] = [];

  hints.push("<semantic_hints>");

  // 1. 时间习惯
  if (hour < 6) {
    hints.push("- 现在是凌晨。人类说的'今天'指天亮之后，'昨天'指昨天白天，'明天'指今天天亮之后。用户说'明天见'意思是睡醒之后见，不是日期+1。");
  }

  // 2. 模糊表达的潜台词
  hints.push("- 人类常说话含蓄：'还好''随便'≈不太满意；'没事''算了'≈失望或不想聊；'嗯''哦'≈不想聊了；'我没事'(情绪低落时)≈有事需要关心；'你开心就好'≈可能是反话");

  // 3. 结束对话的信号
  hints.push("- 用户说'我去睡了''先忙了''回头聊''晚安''先这样吧'→想结束对话。回复简短温馨，不开启新话题，不追问。");

  // 4. 话题过渡
  hints.push("- 用户开启新话题时跟上即可。旧话题聊干了可自然过渡到相关话题，但不要突然跳到完全不相关的话题。");

  // 5. 情绪理解
  hints.push("- 理解情绪比理解文字重要：用户抱怨→先共情再回应再转移；用户开心→一起开心追问；用户沉默→不追问，换轻松话题");

  hints.push("</semantic_hints>");

  return hints.join("\n");
}
