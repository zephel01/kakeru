import OpenAI from "openai";
import type {
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProvider,
} from "../types";

/**
 * LM Studio プロバイダ（ローカルLLM / プライベートモード）。
 * LM Studio は OpenAI 互換 API を提供するため OpenAI SDK を流用する。
 */
export class LMStudioProvider implements LLMProvider {
  readonly name = "lmstudio" as const;
  private client: OpenAI;

  constructor(opts?: { baseURL?: string }) {
    this.client = new OpenAI({
      apiKey: "lm-studio", // ローカルなので任意の非空文字列でよい
      baseURL:
        opts?.baseURL ??
        process.env.LMSTUDIO_BASE_URL ??
        "http://127.0.0.1:1234/v1",
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

    return {
      text: res.choices[0]?.message?.content ?? "",
      usage: {
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
      },
    };
  }
}
