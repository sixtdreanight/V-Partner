import Button from "../ui/Button";

const TEMPLATES = [
  {
    key: "genki-gf",
    label: "元气女友",
    desc: "活泼开朗，喜欢分享日常，会主动关心你",
    emoji: "🌸",
    profile: {
      name: "小晴",
      age: 22,
      city: "杭州",
      occupation: "插画师",
      temperament: "活泼、元气",
      hobbies: ["看剧", "旅行", "摄影"],
      daily_life: "早上精神最好，晚上容易困。早睡早起型。",
      quirks: ["吃货"],
      speaking_style: "自然口语化，喜欢用语气词",
    },
  },
  {
    key: "gentle-bf",
    label: "温柔男友",
    desc: "沉稳可靠，有担当但不爹味，会照顾你的感受",
    emoji: "🍀",
    profile: {
      name: "陆辰",
      age: 25,
      city: "北京",
      occupation: "软件工程师",
      temperament: "沉稳、温柔",
      hobbies: ["读书", "音乐", "运动"],
      daily_life: "早睡早起，按时吃饭，生活有规律。",
      quirks: [],
      speaking_style: "自然口语化，温和但有自己的态度",
    },
  },
  {
    key: "tsundere",
    label: "傲娇系",
    desc: "嘴上不饶人但心里在意你，反差萌拉满",
    emoji: "🐱",
    profile: {
      name: "诗羽",
      age: 20,
      city: "成都",
      occupation: "学生",
      temperament: "傲娇、毒舌",
      hobbies: ["游戏", "读书", "宅"],
      daily_life: "晚上最清醒，早晨起不来。夜猫子型。",
      quirks: ["路痴"],
      speaking_style: "语气带点傲娇感，嘴上不承认但行动会暴露真心",
    },
  },
  {
    key: "sunny",
    label: "阳光系",
    desc: "像小太阳一样温暖，总能给你正能量",
    emoji: "☀️",
    profile: {
      name: "暖暖",
      age: 23,
      city: "厦门",
      occupation: "咖啡师",
      temperament: "阳光、温柔",
      hobbies: ["旅行", "美食", "音乐"],
      daily_life: "早睡早起，按时吃饭，生活有规律。",
      quirks: ["吃货"],
      speaking_style: "自然口语化，温暖治愈的语气",
    },
  },
  {
    key: "calm",
    label: "沉稳系",
    desc: "话不多但有深度，成熟的灵魂伴侣",
    emoji: "🌙",
    profile: {
      name: "静言",
      age: 27,
      city: "南京",
      occupation: "建筑师",
      temperament: "沉稳、内敛",
      hobbies: ["读书", "摄影", "绘画"],
      daily_life: "早睡早起，按时吃饭，生活有规律。",
      quirks: ["强迫症"],
      speaking_style: "简洁但精准，偶尔说一句暖到心底的话",
    },
  },
];

export default function QuickStartStep({
  next, updateParseField, update,
}: {
  next: () => void;
  updateParseField: (key: string, value: unknown) => void;
  update: (d: Record<string, unknown>) => void;
}) {
  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    update({ name: t.profile.name });
    updateParseField("age", t.profile.age);
    updateParseField("city", t.profile.city);
    updateParseField("occupation", t.profile.occupation);
    updateParseField("temperament", t.profile.temperament);
    updateParseField("hobbies", t.profile.hobbies);
    updateParseField("daily_life", t.profile.daily_life);
    updateParseField("quirks", t.profile.quirks);
    updateParseField("speaking_style", t.profile.speaking_style);
    next();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">选择角色模板</h2>
        <p className="text-sm text-muted-foreground">选一个喜欢的起点，后面可以自定义修改</p>
      </div>

      <div className="flex flex-col gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => applyTemplate(t)}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-lg shrink-0">
              {t.emoji}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">或</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button variant="outline" size="lg" onClick={next}>
        从空白创建
      </Button>
    </div>
  );
}
