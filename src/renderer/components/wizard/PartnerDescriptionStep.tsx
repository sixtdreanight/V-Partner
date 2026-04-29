import type { WizardData } from "../../hooks/useSetupWizard";

const TEMPERAMENTS = ["温柔", "活泼", "沉稳", "傲娇", "阳光", "内敛", "毒舌", "天然呆"];
const ALL_HOBBIES = ["看剧", "游戏", "运动", "读书", "音乐", "旅行", "美食", "摄影", "绘画", "宅"];
const DAILY_LIFE_PRESETS = [
  { label: "早起党", text: "早上精神最好，晚上容易困。早睡早起型。" },
  { label: "夜猫子", text: "晚上最清醒，早晨起不来。夜猫子型。" },
  { label: "规律作息", text: "早睡早起，按时吃饭，生活有规律。" },
];
const ALL_QUIRKS = ["赖床", "路痴", "吃货", "强迫症", "选择困难", "社恐", "健忘"];

interface TagGroupProps {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  color?: "primary" | "violet" | "amber" | "rose";
}

function TagGroup({ options, selected, onToggle, color = "primary" }: TagGroupProps) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 data-[on=true]:bg-primary data-[on=true]:text-primary-foreground",
    violet: "bg-violet-100 border-violet-200 text-violet-700 hover:bg-violet-200 data-[on=true]:bg-violet-500 data-[on=true]:text-white dark:bg-violet-900/30 dark:border-violet-700",
    amber: "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200 data-[on=true]:bg-amber-500 data-[on=true]:text-white dark:bg-amber-900/30 dark:border-amber-700",
    rose: "bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200 data-[on=true]:bg-rose-500 data-[on=true]:text-white dark:bg-rose-900/30 dark:border-rose-700",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          data-on={selected.includes(o)}
          onClick={() => onToggle(o)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${colors[color] || colors.primary}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function PartnerDescriptionStep({
  data, update,
}: {
  data: WizardData;
  update: (d: Partial<WizardData>) => void;
}) {
  const toggleTemperament = (v: string) => {
    const current = data.partnerTemperament ? data.partnerTemperament.split("、") : [];
    const next = current.includes(v) ? current.filter((t) => t !== v) : [...current, v];
    update({ partnerTemperament: next.join("、") });
  };

  const toggleHobby = (v: string) => {
    update({ partnerHobbies: data.partnerHobbies.includes(v) ? data.partnerHobbies.filter((h) => h !== v) : [...data.partnerHobbies, v] });
  };

  const toggleQuirk = (v: string) => {
    update({ partnerQuirks: data.partnerQuirks.includes(v) ? data.partnerQuirks.filter((q) => q !== v) : [...data.partnerQuirks, v] });
  };

  const sectionLabel = "block text-xs font-medium text-muted-foreground mb-1.5";
  const inputClass = "w-full px-3 py-2 rounded-xl text-sm bg-background border border-input text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50";
  const customHint = "text-[11px] text-muted-foreground mt-1";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 className="text-lg font-semibold">创建角色卡</h2>
        <p className="text-sm text-muted-foreground">填写 TA 的基本信息，让 TA 更像一个真实的人</p>
      </div>

      {/* 基本信息 */}
      <div className="flex gap-2">
        <div style={{ flex: 1 }}>
          <label className={sectionLabel}>年龄</label>
          <input
            type="number" min={16} max={100}
            className={inputClass}
            value={data.partnerAge || ""}
            onChange={(e) => update({ partnerAge: parseInt(e.target.value) || 0 })}
            placeholder="25"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className={sectionLabel}>城市</label>
          <input
            type="text"
            className={inputClass}
            value={data.partnerCity}
            onChange={(e) => update({ partnerCity: e.target.value })}
            placeholder="上海"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div style={{ flex: 1 }}>
          <label className={sectionLabel}>职业</label>
          <input
            type="text"
            className={inputClass}
            value={data.partnerOccupation}
            onChange={(e) => update({ partnerOccupation: e.target.value })}
            placeholder="设计师"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className={sectionLabel}>专业</label>
          <input
            type="text"
            className={inputClass}
            value={data.partnerMajor}
            onChange={(e) => update({ partnerMajor: e.target.value })}
            placeholder="视觉传达"
          />
        </div>
      </div>

      <div>
        <label className={sectionLabel}>学历</label>
        <input
          type="text"
          className={inputClass}
          value={data.partnerEducation}
          onChange={(e) => update({ partnerEducation: e.target.value })}
          placeholder="本科"
        />
      </div>

      {/* 性格标签 + 自定义输入 */}
      <div>
        <label className={sectionLabel}>性格</label>
        <p className="text-[11px] text-muted-foreground mb-1.5">决定 TA 说话的语气、对你的态度、处理情绪的方式</p>
        <TagGroup options={TEMPERAMENTS} selected={data.partnerTemperament ? data.partnerTemperament.split("、") : []} onToggle={toggleTemperament} color="violet" />
        <p className={customHint}>用"、"分隔多个性格词，也可自由输入</p>
        <input
          type="text"
          className={inputClass + " mt-1"}
          value={data.partnerTemperament}
          onChange={(e) => update({ partnerTemperament: e.target.value })}
          placeholder="温柔、活泼，或输入你自己的描述"
        />
      </div>

      {/* 爱好标签 + 自定义输入 */}
      <div>
        <label className={sectionLabel}>爱好</label>
        <p className="text-[11px] text-muted-foreground mb-1.5">影响 TA 和你聊天的日常话题</p>
        <TagGroup options={ALL_HOBBIES} selected={data.partnerHobbies} onToggle={toggleHobby} color="primary" />
        <p className={customHint}>输入自定义爱好，用"、"分隔</p>
        <input
          type="text"
          className={inputClass + " mt-1"}
          value={data.partnerHobbies.join("、")}
          onChange={(e) => update({ partnerHobbies: e.target.value ? e.target.value.split(/[、,]/).filter(Boolean) : [] })}
          placeholder="撸猫、探店，或输入你自己的"
        />
      </div>

      {/* 作息节奏 */}
      <div>
        <label className={sectionLabel}>日常节奏</label>
        <p className="text-[11px] text-muted-foreground mb-1.5">影响 TA 在不同时间段的状态和心情</p>
        <div className="flex flex-col gap-1.5">
          {DAILY_LIFE_PRESETS.map((r) => (
            <button
              key={r.label}
              type="button"
              data-on={data.partnerDailyLife === r.text}
              onClick={() => update({ partnerDailyLife: data.partnerDailyLife === r.text ? "" : r.text })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors text-left
                data-[on=true]:bg-primary/10 data-[on=true]:border-primary/50 data-[on=true]:text-primary
                hover:bg-muted`}
            >
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.text}</span>
            </button>
          ))}
        </div>
        <p className={customHint}>或输入自定义描述</p>
        <input
          type="text"
          className={inputClass + " mt-1"}
          value={data.partnerDailyLife}
          onChange={(e) => update({ partnerDailyLife: e.target.value })}
          placeholder="凌晨4点睡下午2点起，混乱作息型"
        />
      </div>

      {/* 小特点 + 自定义输入 */}
      <div>
        <label className={sectionLabel}>小特点（选填）</label>
        <p className="text-[11px] text-muted-foreground mb-1.5">这些小细节让 TA 更像一个真实的人</p>
        <TagGroup options={ALL_QUIRKS} selected={data.partnerQuirks} onToggle={toggleQuirk} color="amber" />
        <p className={customHint}>输入自定义小特点，用"、"分隔</p>
        <input
          type="text"
          className={inputClass + " mt-1"}
          value={data.partnerQuirks.join("、")}
          onChange={(e) => update({ partnerQuirks: e.target.value ? e.target.value.split(/[、,]/).filter(Boolean) : [] })}
          placeholder="奶茶续命、外卖达人，或输入你自己的"
        />
      </div>
    </div>
  );
}
