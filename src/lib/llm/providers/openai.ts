import OpenAI from "openai";
import type {
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProvider,
} from "../types";

/**
 * OpenAI プロバイダ。OPENAI_BASE_URL を差し替えれば OpenAI 互換 API にも利用可能。
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  private client: OpenAI;

  constructor(opts?: { apiKey?: string; baseURL?: string }) {
    this.client = new OpenAI({
      apiKey: opts?.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: opts?.baseURL ?? process.env.OPENAI_BASE_URL,
    });
  }

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const res = await this.client.chat.completions.create({
      model: input.model,
      temperature: input.temperature ?? 0.7,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    });

    const text = res.choices[0]?.message?.content ?? "";
    return {
      text,
      usage: {
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
      },
    };
  }

  async *generateStream(input: LLMGenerateInput): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: input.model,
      temperature: input.temperature ?? 0.7,
      stream: true,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
