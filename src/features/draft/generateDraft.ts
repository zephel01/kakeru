import { getDefaultModel, getProvider, isLocalProvider } from "@/lib/llm";
import type { ProviderName } from "@/lib/llm/types";
import { renderPrompt } from "@/lib/prompts";
import { analyzeTokenCost } from "@/lib/tokens";
import type { DraftRequest, DraftResponse } from "@/types";

/**
 * ドラフト生成のコアロジック。
 * プロンプトテンプレート適用 → provider 切替で生成 → トークンコスト計測。
 */
export async function generateDraft(req: DraftRequest): Promise<DraftResponse> {
  const providerName: ProviderName =
    req.provider ?? (process.env.LLM_PROVIDER as ProviderName) ?? "ollama";
  const model = req.model ?? getDefaultModel();

  const { system, user } = await renderPrompt(req.templateId, req.variables);
  const provider = getProvider(providerName);

  const result = await provider.generate({
    system,
    prompt: user,
    model,
    temperature: req.temperature,
  });

  const cost = analyzeTokenCost(result.text);

  return {
    markdown: result.text,
    usage: result.usage,
    cost,
    provider: providerName,
    model,
    private: isLocalProvider(providerName),
  };
}
