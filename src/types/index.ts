import type { ProviderName, LLMUsage } from "@/lib/llm/types";

export type Media = "zenn" | "note" | "x";

export interface DraftRequest {
  templateId: string;
  media: Media;
  variables: Record<string, string>;
  provider?: ProviderName;
  model?: string;
  temperature?: number;
}

export interface TokenCostInfo {
  tokens: number;
  chars: number;
  tokensPerChar: number;
  englishCostMultiplier: number;
}

export interface DraftResponse {
  markdown: string;
  usage: LLMUsage;
  cost: TokenCostInfo;
  provider: ProviderName;
  model: string;
  private: boolean;
}

export interface ThumbnailRequest {
  prompt: string;
  media: Media;
  variations?: number;
}

export interface ThumbnailResponse {
  images: { url: string; prompt: string }[];
  provider: string;
}

export interface XPostDraft {
  singles: string[];
  thread: string[];
  hashtags: string[];
}
