import type { LLMProvider, ProviderName } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { OllamaProvider } from "./providers/ollama";
import { LMStudioProvider } from "./providers/lmstudio";

export * from "./types";

/**
 * provider 切替ファクトリ。env または引数で選択する。
 */
export function getProvider(name?: ProviderName): LLMProvider {
  const resolved = (name ??
    (process.env.LLM_PROVIDER as ProviderName | undefined) ??
    "ollama") as ProviderName;

  switch (resolved) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "ollama":
      return new OllamaProvider();
    case "lmstudio":
      return new LMStudioProvider();
    default: {
      const _exhaustive: never = resolved;
      throw new Error(`Unknown LLM provider: ${String(_exhaustive)}`);
    }
  }
}

export function getDefaultModel(): string {
  return process.env.LLM_MODEL ?? "qwen2.5:7b";
}
