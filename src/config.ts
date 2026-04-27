import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { logger } from "./utils.js";

// ---- 类型定义 ----

/** 用户的性别 */
export type UserGender = "male" | "female" | "other";

/** 关系类型: 女友还是男友 */
export type RelationshipType = "girlfriend" | "boyfriend";

/** 关系模式 */
export type RelationshipMode = "direct" | "slow_burn";

/** 养成模式的关系阶段 */
export type RelationshipStage =
  | "stranger"      // 刚认识
  | "friend"        // 朋友
  | "close_friend"  // 好朋友
  | "crush"         // 暧昧期
  | "lover";        // 恋人

export interface Profile {
  name: string;
  age: number;
  city: string;
  occupation: string;
  education: string;
  major: string;
  hobbies: string[];
  temperament: string;
  speaking_style: string;
  /** 用户怎么被称呼 */
  user_nickname: string;
  /** 用户的性别 */
  user_gender: UserGender;
  /** 伴侣是女友还是男友 */
  relationship_type: RelationshipType;
  /** 关系模式: 直接情侣 / 养成模式 */
  relationship_mode: RelationshipMode;
  /** 用户所在城市（用于地区相关话题） */
  user_city: string;
  user_timezone: string;
  opinions: Record<string, string>;
  daily_life: string;
  quirks: string[];
  meme_style: string;
  custom_style?: CustomStyle;
}

export interface CustomStyle {
  emoticons?: string;
  verbal_tics?: string[];
  catchphrases?: string[];
  typing_quirks?: string;
}

export interface AIConfig {
  provider: "anthropic" | "openai" | "openai-compatible";
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface QQConfig {
  wsUrl: string;
  accessToken: string;
  reconnectIntervalMs: number;
}

export interface AppConfig {
  ai: AIConfig;
  qq: QQConfig;
  memory: {
    maxHistoryTurns: number;
    longTermExtractInterval: number;
    maxFactsInContext: number;
  };
}

const ROOT = resolve(import.meta.dirname, "..");

/** 默认配置，提供所有 fallback 值 */
const DEFAULTS: Partial<AppConfig> = {
  memory: {
    maxHistoryTurns: 24,
    longTermExtractInterval: 20,
    maxFactsInContext: 5,
  },
};

// ---- 加载函数 ----

/** 从 .env 加载 AI 和 QQ 配置 */
function loadEnvConfig(): { ai: AIConfig; qq: QQConfig } {
  const provider = (process.env.AI_PROVIDER || "anthropic") as AIConfig["provider"];
  const model = process.env.AI_MODEL || "claude-sonnet-4-20250514";
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";

  if (!apiKey) {
    logger.warn("未设置 AI_API_KEY，AI 功能将不可用");
  }

  return {
    ai: {
      provider,
      model,
      apiKey,
      baseUrl: process.env.AI_BASE_URL,
      maxTokens: 2048,
      temperature: 0.85,
    },
    qq: {
      wsUrl: process.env.QQ_WS_URL || "ws://127.0.0.1:3001",
      accessToken: process.env.QQ_ACCESS_TOKEN || "",
      reconnectIntervalMs: 5000,
    },
  };
}

/** 从 data/profile.json 加载女友角色卡 */
export function loadProfile(): Profile | null {
  const profilePath = resolve(ROOT, "data", "profile.json");
  if (!existsSync(profilePath)) {
    logger.warn("未找到 data/profile.json，请先运行 npm run setup");
    return null;
  }
  const raw = readFileSync(profilePath, "utf-8");
  return JSON.parse(raw) as Profile;
}

/** 加载完整应用配置 */
export function loadConfig(): AppConfig {
  const env = loadEnvConfig();
  return {
    ai: env.ai,
    qq: env.qq,
    memory: DEFAULTS.memory!,
  };
}

/** 项目根目录路径 */
export { ROOT };
