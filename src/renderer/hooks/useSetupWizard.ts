import { useState, useCallback, useMemo } from "react";

export interface WizardData {
  name: string;
  userGender: "male" | "female" | "other";
  partnerGender: "male" | "female" | "other";
  relationshipType: "girlfriend" | "boyfriend";
  relationshipMode: "direct" | "slow_burn";
  timezone: string;
  userCity: string;
  nickname: string;
  customStyle: string;
  memeStyle: string;
  aiProvider: "anthropic" | "openai" | "openai-compatible";
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
  aiMaxTokens: number;
  aiTemperature: number;
  qqEnabled: boolean;
  wechatEnabled: boolean;
  qqWsUrl: string;
  qqAccessToken: string;
  wechatBaseUrl: string;
  wechatFileUrl: string;
  // 角色卡字段
  partnerAge: number;
  partnerCity: string;
  partnerOccupation: string;
  partnerEducation: string;
  partnerMajor: string;
  partnerTemperament: string;
  partnerHobbies: string[];
  partnerDailyLife: string;
  partnerQuirks: string[];
}

const TOTAL_STEPS = 16;

const DEFAULTS: WizardData = {
  name: "",
  userGender: "male",
  partnerGender: "female",
  relationshipType: "girlfriend",
  relationshipMode: "direct",
  timezone: "Asia/Shanghai",
  userCity: "北京",
  nickname: "宝贝",
  customStyle: "",
  memeStyle: "1",
  aiProvider: "anthropic",
  aiModel: "",
  aiApiKey: "",
  aiBaseUrl: "",
  aiMaxTokens: 2048,
  aiTemperature: 0.85,
  qqEnabled: false,
  wechatEnabled: false,
  qqWsUrl: "ws://127.0.0.1:3001",
  qqAccessToken: "",
  wechatBaseUrl: "http://127.0.0.1:2531/v2/api",
  wechatFileUrl: "http://127.0.0.1:2532/download",
  partnerAge: 0,
  partnerCity: "",
  partnerOccupation: "",
  partnerEducation: "",
  partnerMajor: "",
  partnerTemperament: "",
  partnerHobbies: [],
  partnerDailyLife: "",
  partnerQuirks: [],
};

export function useSetupWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({ ...DEFAULTS });
  const [riskRead, setRiskRead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTimedOut, setTransitionTimedOut] = useState(false);

  const update = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return true;  // Welcome
      case 1: return true;  // QuickStart
      case 2: return data.name.trim().length > 0;  // PartnerName
      case 3: return true;  // PartnerDescription optional
      case 4: return true;  // UserGender
      case 5: return true;  // PartnerGender
      case 6: return true;  // RelationshipType
      case 7: return riskRead;  // RelationshipMode
      case 8: return true;  // Timezone
      case 9: return true;  // UserCity
      case 10: return true; // Nickname
      case 11: return true; // SpeakingStyle
      case 12: return true; // MemeStyle
      case 13: return data.aiApiKey.trim().length > 0;  // AIProvider
      case 14: return true; // PlatformSetup
      case 15: return !saving;  // Summary
      default: return true;
    }
  }, [step, data, riskRead, saving]);

  const progress = useMemo(() => Math.round((step / (TOTAL_STEPS - 1)) * 100), [step]);

  const saveProfile = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    setTransitionTimedOut(false);
    try {
      const profile = {
        name: data.name,
        age: data.partnerAge || 0,
        city: data.partnerCity || "",
        occupation: data.partnerOccupation || "",
        education: data.partnerEducation || "",
        major: data.partnerMajor || "",
        hobbies: data.partnerHobbies || [],
        temperament: data.partnerTemperament || "",
        speaking_style: "自然口语化，喜欢用语气词",
        user_nickname: data.nickname,
        user_gender: data.userGender,
        partner_gender: data.partnerGender,
        relationship_type: data.relationshipType,
        relationship_mode: data.relationshipMode,
        user_city: data.userCity,
        user_timezone: data.timezone,
        opinions: {},
        daily_life: data.partnerDailyLife || "",
        quirks: data.partnerQuirks || [],
        meme_style: memeStyleText(data.memeStyle),
        custom_style: parseCustomStyle(data.customStyle),
      };

      const result = await window.api.saveProfile({
        profile,
        ai: {
          provider: data.aiProvider,
          model: data.aiModel || undefined,
          apiKey: data.aiApiKey,
          baseUrl: data.aiBaseUrl || undefined,
          maxTokens: data.aiMaxTokens,
          temperature: data.aiTemperature,
        },
        qq: data.qqEnabled ? {
          wsUrl: data.qqWsUrl,
          accessToken: data.qqAccessToken,
        } : undefined,
        wechat: data.wechatEnabled ? {
          baseUrl: data.wechatBaseUrl,
          fileUrl: data.wechatFileUrl,
        } : undefined,
      });

      const res = result as { success: boolean; error?: string };
      if (!res.success) {
        setError(res.error || "保存失败，请检查配置后重试");
        return;
      }

      setTransitioning(true);

      // 10 秒超时：如果切换过程卡死，给用户一个退出路径
      const timeoutId = setTimeout(() => setTransitionTimedOut(true), 10000);

      await window.api.transitionToChat();
      await new Promise((r) => setTimeout(r, 400));

      clearTimeout(timeoutId);
      window.location.hash = "#/chat";
    } catch (err) {
      setError(`保存出错: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [data, saving]);

  return {
    step, data, riskRead, saving, error, transitioning, transitionTimedOut, progress,
    update, next, back, canNext, setRiskRead,
    saveProfile,
    totalSteps: TOTAL_STEPS,
  };
}

function memeStyleText(choice: string): string {
  const map: Record<string, string> = {
    "1": "会主动玩梗，但只在自己确定意思时用。偶尔来一句，不要太密。",
    "2": "理解网络梗和流行语，但自己不主动使用，保持在角色说话风格内。",
    "3": "不太懂网络梗和流行语。用户用了你可能会迷惑地问一下。",
  };
  return map[choice] || map["1"];
}

function parseCustomStyle(raw: string) {
  if (!raw.trim()) return undefined;
  const style: Record<string, unknown> = {};
  if (/颜文字/.test(raw) || /[\(（][^\)）]{2,}[\)）]/.test(raw)) {
    style.emoticons = raw;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}
