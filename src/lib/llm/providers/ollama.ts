import type {
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProvider,
} from "../types";

interface OllamaChatResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Ollama プロバイダ（ローカルLLM / プライベートモード）。
 * 別マシンの Ollama サーバへ HTTP 接続する。外部クラウドへは送信しない。
 */
export class OllamaProvider implements LLMProvider {
  readonly name = "ollama" as const;
  private baseURL: string;

  constructor(opts?: { baseURL?: string }) {
    this.baseURL =
      opts?.baseURL ??
      process.env.OLLAMA_BASE_URL ??
      "http://127.0.0.1:11434";
  }

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const res = await fetch(`${this.baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        stream: false,
        options: { temperature: input.temperature ?? 0.7 },
        messages: [
          { role: "system", content: input.system },
          {
            role: "user",
            content: input.prompt,
            ...(input.images?.length ? { images: input.images } : {}),
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    return {
      text: data.message?.content ?? "",
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      },
    };
  }

  async *generateStream(input: LLMGenerateInput): AsyncIterable<string> {
    const res = await fetch(`${this.baseURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        stream: true,
        options: { temperature: input.temperature ?? 0.7 },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line) as OllamaChatResponse;
          if (obj.message?.content) yield obj.message.content;
        } catch {
          // 不完全なJSON行はスキップ
        }
      }
    }
  }
}
