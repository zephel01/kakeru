/**
 * ローカルLLM（Ollama / LM Studio）接続状態の確認ユーティリティ。
 * 別マシンのサーバへ疎通確認を行う。プライベートモードの可用性判定に使う。
 */
export interface LocalLLMStatus {
  provider: "ollama" | "lmstudio";
  reachable: boolean;
  baseURL: string;
  models?: string[];
}

export async function checkOllama(
  baseURL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
): Promise<LocalLLMStatus> {
  try {
    const res = await fetch(`${baseURL}/api/tags`, { method: "GET" });
    if (!res.ok) return { provider: "ollama", reachable: false, baseURL };
    const data = (await res.json()) as { models?: { name: string }[] };
    return {
      provider: "ollama",
      reachable: true,
      baseURL,
      models: data.models?.map((m) => m.name) ?? [],
    };
  } catch {
    return { provider: "ollama", reachable: false, baseURL };
  }
}

export async function checkLMStudio(
  baseURL = process.env.LMSTUDIO_BASE_URL ?? "http://127.0.0.1:1234/v1",
): Promise<LocalLLMStatus> {
  try {
    const res = await fetch(`${baseURL}/models`, { method: "GET" });
    if (!res.ok) return { provider: "lmstudio", reachable: false, baseURL };
    const data = (await res.json()) as { data?: { id: string }[] };
    return {
      provider: "lmstudio",
      reachable: true,
      baseURL,
      models: data.data?.map((m) => m.id) ?? [],
    };
  } catch {
    return { provider: "lmstudio", reachable: false, baseURL };
  }
}
