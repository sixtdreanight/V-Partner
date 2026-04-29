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

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiMaxTokens, setAiMaxTokens] = useState([2048]);
  const [aiTemperature, setAiTemperature] = useState([0.85]);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

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
              <Tabs.Trigger value="ai">AI 配置</Tabs.Trigger>
              <Tabs.Trigger value="data">数据</Tabs.Trigger>
              <Tabs.Trigger value="about">关于</Tabs.Trigger>
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
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  {aiProvider !== "openai-compatible" && getModels(aiProvider).length > 0 && (
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

                  {aiProvider === "openai-compatible" && (
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray">模型名称</Text>
                      <TextField.Root
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="deepseek-chat / gpt-4o-mini"
                      />
                    </Flex>
                  )}

                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray">API Key</Text>
                    <TextField.Root
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                  </Flex>

                  {aiProvider === "openai-compatible" && (
                    <Flex direction="column" gap="2">
                      <Text size="1" color="gray">API 地址</Text>
                      <TextField.Root
                        value={aiBaseUrl}
                        onChange={(e) => setAiBaseUrl(e.target.value)}
                        placeholder="https://api.deepseek.com"
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

                  <Button onClick={handleAiSave} disabled={aiSaving || !aiApiKey.trim()}>
                    {aiSaved ? "已保存" : "保存 AI 配置"}
                  </Button>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="data">
                <Flex direction="column" gap="4">
                  <Text size="2" weight="medium">数据管理</Text>
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
                    <Heading size="4">V-Partner</Heading>
                    <Text size="1" color="gray">v1.0.0-beta.6</Text>
                  </Flex>
                </Flex>

                <Flex direction="column" gap="3" style={{ borderTop: "1px solid var(--gray-4)", paddingTop: 16 }}>
                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray" align="center">
                      作者：梦夜十六
                    </Text>
                    <Text size="1" color="gray" align="center">
                      AI 伴侣桌面应用 — 基于 Electron + React 构建。<br />
                      支持 QQ、微信及应用内聊天，内置性格设定与长期记忆。
                    </Text>
                  </Flex>
                  <Text size="1" color="gray" align="center">
                    仅供学习娱乐，AI 生成内容不代表作者立场。<br />
                    因使用本软件产生的任何后果由用户自担。
                  </Text>
                  <Text size="1" color="gray" align="center" mt="1">
                    Made by DreamNight
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
