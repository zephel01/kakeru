export type ProviderName = "openai" | "anthropic" | "ollama" | "lmstudio";

export interface LLMGenerateInput {
  system: string;
  prompt: string;
  model: string;
  temperature?: number;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMGenerateResult {
  text: string;
  usage: LLMUsage;
}

export interface LLMProvider {
  readonly name: ProviderName;
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
}

/** プライベートモード（外部送信を行わない）対象のプロバイダ */
export const LOCAL_PROVIDERS: ReadonlySet<ProviderName> = new Set([
  "ollama",
  "lmstudio",
]);

export function isLocalProvider(name: ProviderName): boolean {
  return LOCAL_PROVIDERS.has(name);
}
