import { useState, useEffect } from "react";
import {
  Dialog, Tabs, Select, Slider, TextField, Button,
  Flex, Text, Heading, IconButton,
} from "@radix-ui/themes";
import { Heart, X } from "lucide-react";

const ANTHROPIC_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
  "claude-haiku-4-20250514",
];

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];

function getModels(provider: string) {
  if (provider === "anthropic") return ANTHROPIC_MODELS;
  if (provider === "openai") return OPENAI_MODELS;
  return [];
}

function isCustomModelProvider(provider: string) {
  return provider === "openai-compatible" || provider === "ollama";
}

// ---- 角色卡编辑的标签选项 ----
const TEMPERAMENT_TAGS = ["温柔", "活泼", "傲娇", "高冷", "粘人", "腹黑", "天然呆", "毒舌", "元气", "慵懒"];
const HOBBY_TAGS = ["游戏", "动漫", "音乐", "电影", "阅读", "运动", "美食", "旅行", "摄影", "画画", "写作", "编程"];
const DAILY_TAGS = ["上班族朝九晚五", "学生党上课泡图书馆", "自由职业宅家", "夜猫子晚上活动", "早起型早上活跃"];
const QUIRK_TAGS = ["路痴", "怕黑", "吃货", "起床困难户", "丢三落四", "爱干净", "拖延症", "脸盲"];

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiMaxTokens, setAiMaxTokens] = useState([2048]);
  const [aiTemperature, setAiTemperature] = useState([0.85]);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // 角色卡编辑状态
  const [profileAge, setProfileAge] = useState(0);
  const [profileCity, setProfileCity] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [profileEducation, setProfileEducation] = useState("");
  const [profileMajor, setProfileMajor] = useState("");
  const [profileTemperament, setProfileTemperament] = useState("");
  const [profileHobbies, setProfileHobbies] = useState<string[]>([]);
  const [profileDailyLife, setProfileDailyLife] = useState("");
  const [profileQuirks, setProfileQuirks] = useState<string[]>([]);
  const [profileSpeakingStyle, setProfileSpeakingStyle] = useState("");
  const [profileMemeStyle, setProfileMemeStyle] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const toggleTag = (list: string[], set: (v: string[]) => void, item: string) => {
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  useEffect(() => {
    window.api.getVersion().then((v: string) => setAppVersion(v));
  }, []);

  useEffect(() => {
    window.api.getConfig().then((c: unknown) => {
      const cfg = c as Record<string, unknown>;
      const ai = cfg.ai as Record<string, unknown> | undefined;
      if (ai) {
        setAiProvider((ai.provider as string) || "anthropic");
        setAiModel((ai.model as string) || "");
        setAiApiKey((ai.apiKey as string) || "");
        setAiBaseUrl((ai.baseUrl as string) || "");
        setAiMaxTokens([(ai.maxTokens as number) || 2048]);
        setAiTemperature([(ai.temperature as number) || 0.85]);
      }
    });
  }, []);

  // 加载角色卡
  useEffect(() => {
    window.api.getState().then((s: unknown) => {
      const state = s as { profile: Record<string, unknown> | null };
      const p = state?.profile;
      if (p) {
        setProfileAge((p.age as number) || 0);
        setProfileCity((p.city as string) || "");
        setProfileOccupation((p.occupation as string) || "");
        setProfileEducation((p.education as string) || "");
        setProfileMajor((p.major as string) || "");
        setProfileTemperament((p.temperament as string) || "");
        setProfileHobbies(Array.isArray(p.hobbies) ? p.hobbies as string[] : []);
        setProfileDailyLife((p.daily_life as string) || "");
        setProfileQuirks(Array.isArray(p.quirks) ? p.quirks as string[] : []);
        setProfileSpeakingStyle((p.speaking_style as string) || "");
        setProfileMemeStyle((p.meme_style as string) || "");
      }
    });
  }, []);

  const handleAiSave = async () => {
    setAiSaving(true);
    setAiSaved(false);
    await window.api.updateConfig({
      ai: {
        provider: aiProvider,
        model: aiModel,
        apiKey: aiApiKey,
        baseUrl: aiBaseUrl || undefined,
        maxTokens: aiMaxTokens[0],
        temperature: aiTemperature[0],
      },
    });
    setAiSaving(false);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  const handleReset = async () => {
    if (resetStep === 0) {
      setResetStep(1);
      return;
    }
    if (resetStep === 1 && resetInput === "RESET") {
      setResetLoading(true);
      const result = await window.api.resetAllData();
      if ((result as { success: boolean }).success) {
        window.location.hash = "#/setup";
        window.location.reload();
      }
      setResetLoading(false);
    }
  };

  const handleResetCancel = () => {
    setResetStep(0);
    setResetInput("");
    setResetLoading(false);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    const result = await window.api.updateProfile({
      age: profileAge,
      city: profileCity,
      occupation: profileOccupation,
      education: profileEducation,
      major: profileMajor,
      temperament: profileTemperament,
      hobbies: profileHobbies,
      daily_life: profileDailyLife,
      quirks: profileQuirks,
      speaking_style: profileSpeakingStyle,
      meme_style: profileMemeStyle,
    });
    setProfileSaving(false);
    const r = result as { success: boolean; error?: string };
    if (r.success) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } else {
      setProfileError(r.error || "保存失败");
    }
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content maxWidth="420px" style={{ padding: 0 }}>
        <Flex direction="column" height="520px">
          <Flex align="center" justify="between" px="5" py="4" style={{ borderBottom: "1px solid var(--gray-4)" }}>
            <Heading size="3">设置</Heading>
            <IconButton variant="ghost" size="2" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </Flex>

          <Tabs.Root defaultValue="ai" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Tabs.List mx="5" mt="3">
              <Tabs.Trigger value="ai" px="4" py="2">AI 配置</Tabs.Trigger>
              <Tabs.Trigger value="character" px="4" py="2">角色卡</Tabs.Trigger>
              <Tabs.Trigger value="data" px="4" py="2">数据</Tabs.Trigger>
              <Tabs.Trigger value="about" px="4" py="2">关于</Tabs.Trigger>
            </Tabs.List>

            <Flex direction="column" p="5" gap="4" flexGrow="1" overflowY="auto" style={{ flex: 1 }}>
              <Tabs.Content value="ai">
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">服务商</Text>
                    <Select.Root value={aiProvider} onValueChange={(v) => { setAiProvider(v); setAiModel(""); }}>
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="anthropic">Claude (Anthropic)</Select.Item>
                        <Select.Item value="openai">OpenAI (GPT 系列)</Select.Item>
                        <Select.Item value="openai-compatible">其他兼容接口</Select.Item>
                        <Select.Item value="ollama">Ollama (本地)</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  {aiProvider !== "openai-compatible" && aiProvider !== "ollama" && getModels(aiProvider).length > 0 && (
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray">模型</Text>
                      <Select.Root value={aiModel} onValueChange={setAiModel}>
                        <Select.Trigger placeholder="选择模型..." />
                        <Select.Content>
                          {getModels(aiProvider).map((m) => (
                            <Select.Item key={m} value={m}>{m}</Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  )}

                  {isCustomModelProvider(aiProvider) && (
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray">模型名称</Text>
                      <TextField.Root
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder={aiProvider === "ollama" ? "llama3 / qwen2.5" : "deepseek-chat / gpt-4o-mini"}
                      />
                    </Flex>
                  )}

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">
                      API Key{aiProvider === "ollama" ? " (本地可留空)" : ""}
                    </Text>
                    <TextField.Root
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={aiProvider === "ollama" ? "ollama 本地无需密钥" : "sk-..."}
                    />
                  </Flex>

                  {isCustomModelProvider(aiProvider) && (
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray">API 地址</Text>
                      <TextField.Root
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                        placeholder={aiProvider === "ollama" ? "http://localhost:11434/v1" : "https://api.deepseek.com"}
                      />
                    </Flex>
                  )}

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">最大输出 Token: {aiMaxTokens[0]}</Text>
                    <Slider value={aiMaxTokens} onValueChange={setAiMaxTokens} min={256} max={8192} step={256} />
                    <Flex justify="between">
                      <Text size="1" color="gray">256</Text>
                      <Text size="1" color="gray">8192</Text>
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">温度: {aiTemperature[0].toFixed(2)}</Text>
                    <Slider value={aiTemperature} onValueChange={setAiTemperature} min={0} max={2} step={0.05} />
                    <Flex justify="between">
                      <Text size="1" color="gray">0 (精确)</Text>
                      <Text size="1" color="gray">2 (创意)</Text>
                    </Flex>
                  </Flex>

                  <Button onClick={handleAiSave} disabled={aiSaving || (aiProvider !== "ollama" && !aiApiKey.trim())}>
                    {aiSaved ? "已保存" : "保存 AI 配置"}
                  </Button>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="character">
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="3">
                    <Flex gap="2">
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">年龄</Text>
                        <TextField.Root
                          type="number" value={profileAge ? String(profileAge) : ""}
                          onChange={(e) => setProfileAge(Number(e.target.value) || 0)}
                        />
                      </Flex>
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">城市</Text>
                        <TextField.Root value={profileCity} onChange={(e) => setProfileCity(e.target.value)} />
                      </Flex>
                    </Flex>
                    <Flex gap="2">
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">职业</Text>
                        <TextField.Root value={profileOccupation} onChange={(e) => setProfileOccupation(e.target.value)} />
                      </Flex>
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Text size="1" color="gray">学历</Text>
                        <TextField.Root value={profileEducation} onChange={(e) => setProfileEducation(e.target.value)} />
                      </Flex>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">专业</Text>
                      <TextField.Root value={profileMajor} onChange={(e) => setProfileMajor(e.target.value)} />
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">性格标签</Text>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPERAMENT_TAGS.map((t) => (
                        <button key={t} onClick={() => toggleTag(
                          profileTemperament ? profileTemperament.split("、") : [],
                          (v) => setProfileTemperament(v.join("、")),
                          t,
                        )} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: profileTemperament.includes(t) ? "var(--primary)" : "var(--secondary)",
                            color: profileTemperament.includes(t) ? "white" : "var(--muted-foreground)",
                          }}
                        >{t}</button>
                      ))}
                    </div>
                    <TextField.Root
                      value={profileTemperament}
                      onChange={(e) => setProfileTemperament(e.target.value)}
                      placeholder="或自定义输入性格..."
                    />
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">爱好</Text>
                    <div className="flex flex-wrap gap-1.5">
                      {HOBBY_TAGS.map((h) => (
                        <button key={h} onClick={() => toggleTag(profileHobbies, setProfileHobbies, h)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: profileHobbies.includes(h) ? "var(--primary)" : "var(--secondary)",
                            color: profileHobbies.includes(h) ? "white" : "var(--muted-foreground)",
                          }}
                        >{h}</button>
                      ))}
                    </div>
                    <Flex direction="column" gap="1">
                      {profileHobbies.filter((h) => !HOBBY_TAGS.includes(h)).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {profileHobbies.filter((h) => !HOBBY_TAGS.includes(h)).map((h) => (
                            <span key={h} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "var(--primary)", color: "white" }}>
                              {h}
                              <button onClick={() => setProfileHobbies(profileHobbies.filter((i) => i !== h))}
                                style={{ marginLeft: 4, opacity: 0.7 }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <TextField.Root
                        placeholder="输入自定义爱好后回车添加..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !profileHobbies.includes(val)) {
                              setProfileHobbies([...profileHobbies, val]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">日常节奏</Text>
                    <div className="flex flex-wrap gap-1.5">
                      {DAILY_TAGS.map((d) => (
                        <button key={d} onClick={() => setProfileDailyLife(profileDailyLife === d ? "" : d)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: profileDailyLife === d ? "var(--primary)" : "var(--secondary)",
                            color: profileDailyLife === d ? "white" : "var(--muted-foreground)",
                          }}
                        >{d}</button>
                      ))}
                    </div>
                    <TextField.Root
                      value={profileDailyLife}
                      onChange={(e) => setProfileDailyLife(e.target.value)}
                      placeholder="或自定义输入..."
                    />
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">小特点</Text>
                    <div className="flex flex-wrap gap-1.5">
                      {QUIRK_TAGS.map((q) => (
                        <button key={q} onClick={() => toggleTag(profileQuirks, setProfileQuirks, q)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: profileQuirks.includes(q) ? "var(--primary)" : "var(--secondary)",
                            color: profileQuirks.includes(q) ? "white" : "var(--muted-foreground)",
                          }}
                        >{q}</button>
                      ))}
                    </div>
                    <Flex direction="column" gap="1">
                      {profileQuirks.filter((q) => !QUIRK_TAGS.includes(q)).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {profileQuirks.filter((q) => !QUIRK_TAGS.includes(q)).map((q) => (
                            <span key={q} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "var(--primary)", color: "white" }}>
                              {q}
                              <button onClick={() => setProfileQuirks(profileQuirks.filter((i) => i !== q))}
                                style={{ marginLeft: 4, opacity: 0.7 }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <TextField.Root
                        placeholder="输入自定义特点后回车添加..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !profileQuirks.includes(val)) {
                              setProfileQuirks([...profileQuirks, val]);
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </Flex>
                  </Flex>

                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray">说话风格</Text>
                    <TextField.Root value={profileSpeakingStyle} onChange={(e) => setProfileSpeakingStyle(e.target.value)} />
                  </Flex>

                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray">梗风格</Text>
                    <TextField.Root value={profileMemeStyle} onChange={(e) => setProfileMemeStyle(e.target.value)}
                      placeholder="如：贴吧老哥、微博吃瓜、小红书体..." />
                  </Flex>

                  {profileError && (
                    <Text size="1" style={{ color: "var(--red-9)" }}>{profileError}</Text>
                  )}

                  <Button onClick={handleProfileSave} disabled={profileSaving}>
                    {profileSaved ? "已保存" : "保存角色卡"}
                  </Button>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="data">
                <Flex direction="column" gap="4">
                  <Text size="2" weight="medium">数据管理</Text>

                  <Flex direction="column" gap="2">
                    <Button variant="soft" size="2" onClick={async () => {
                      const r = await window.api.exportProfile() as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出角色卡</Button>
                    <Button variant="soft" size="2" onClick={async () => {
                      const r = await window.api.importProfile() as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                      else { alert("导入成功，请重启应用"); onClose(); }
                    }}>导入角色卡</Button>
                  </Flex>

                  <Flex gap="2">
                    <Button variant="soft" size="2" style={{ flex: 1 }} onClick={async () => {
                      const r = await window.api.exportChat("json") as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出聊天 (JSON)</Button>
                    <Button variant="soft" size="2" style={{ flex: 1 }} onClick={async () => {
                      const r = await window.api.exportChat("txt") as { success: boolean; error?: string };
                      if (!r.success) alert(r.error);
                    }}>导出聊天 (TXT)</Button>
                  </Flex>

                  <Flex direction="column" gap="4" mt="3">
                    <Text size="1" color="gray">
                      重置将删除所有数据，包括角色卡、AI 配置、聊天记录和记忆数据。操作后需要重新进行初始化设置。
                    </Text>

                    {resetStep === 0 && (
                      <Button color="red" variant="outline" size="2" onClick={handleReset}>
                        重置所有数据...
                      </Button>
                    )}

                    {resetStep === 1 && (
                      <Flex direction="column" gap="3" style={{
                        padding: 14,
                        border: "1px solid var(--red-8)",
                        borderRadius: "var(--radius-3)",
                        background: "var(--red-3)",
                      }}>
                        <Text size="1" weight="medium" style={{ color: "var(--red-9)" }}>
                          此操作不可撤销！所有数据将被永久删除。
                        </Text>
                        <Text size="1" color="gray">
                          请输入 "RESET" 确认删除：
                        </Text>
                        <TextField.Root
                          value={resetInput}
                          onChange={(e) => setResetInput(e.target.value)}
                          placeholder="输入 RESET"
                        />
                        <Flex gap="2">
                          <Button
                            color="red"
                            size="2"
                            disabled={resetInput !== "RESET" || resetLoading}
                            onClick={handleReset}
                          >
                            {resetLoading ? "删除中..." : "确认删除"}
                          </Button>
                          <Button variant="ghost" size="2" onClick={handleResetCancel}>
                            取消
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="about">
                <Flex direction="column" align="center" gap="4" py="6">
                  <Flex
                    width="56px" height="56px" align="center" justify="center"
                    style={{ borderRadius: "var(--radius-4)", background: "var(--accent-3)" }}
                  >
                    <Heart size={24} color="var(--accent-9)" fill="var(--accent-9)" />
                  </Flex>
                  <Flex direction="column" align="center" gap="1">
                    <Heading size="4">梦间 / Yumema</Heading>
                    <Text size="1" color="gray">{appVersion || "v0.0.1"}</Text>
                  </Flex>
                </Flex>

                <Flex direction="column" gap="3" style={{ borderTop: "1px solid var(--gray-4)", paddingTop: 16 }}>
                  <Text size="1" color="gray" align="center">
                    AI 伴侣桌面应用 — 基于 Electron + React 构建
                  </Text>
                  <Flex direction="column" gap="1" align="center" style={{ borderTop: "1px solid var(--gray-4)", paddingTop: 12 }}>
                    <Text size="1" color="gray">作者：梦夜十六</Text>
                    <Text size="1" color="gray">协议：GPL-3.0</Text>
                    <Text size="1" color="gray">仓库：github.com/sixtdreanight/Yumema</Text>
                    <Text size="1" color="gray">反馈：erk163@163.com</Text>
                  </Flex>
                  <Text size="1" color="gray" align="center" style={{ borderTop: "1px solid var(--gray-4)", paddingTop: 12 }}>
                    Copyright (c) 2026 DreamNight<br />
                    AI 生成内容不代表作者立场
                  </Text>
                </Flex>
              </Tabs.Content>
            </Flex>
          </Tabs.Root>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
