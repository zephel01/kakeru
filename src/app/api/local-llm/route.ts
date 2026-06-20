import { NextResponse } from "next/server";
import { checkLMStudio, checkOllama } from "@/features/local-llm/status";

export const dynamic = "force-dynamic";

/**
 * ローカルLLM（Ollama / LM Studio）の疎通状態を返す。
 * プライベートモードの可用性をUIに表示するために使う。
 */
export async function GET() {
  const [ollama, lmstudio] = await Promise.all([
    checkOllama(),
    checkLMStudio(),
  ]);
  return NextResponse.json({ ollama, lmstudio });
}
