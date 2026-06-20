import Anthropic from "@anthropic-ai/sdk";
import type {
  LLMGenerateInput,
  LLMGenerateResult,
  LLMProvider,
} from "../types";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  private client: Anthropic;

  constructor(opts?: { apiKey?: string; baseURL?: string }) {
    this.client = new Anthropic({
      apiKey: opts?.apiKey ?? process.env.ANTHROPIC_API_KEY,
      baseURL: opts?.baseURL ?? process.env.ANTHROPIC_BASE_URL,
    });
  }

  async generate(input: LLMGenerateInput): Promise<LLMGenerateResult> {
    const res = await this.client.messages.create({
      model: input.model,
      max_tokens: 4096,
      temperature: input.temperature ?? 0.7,
      system: input.system,
      messages: [{ role: "user", content: input.prompt }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return {
      text,
      usage: {
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
      },
    };
  }

  async *generateStream(input: LLMGenerateInput): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: input.model,
      max_tokens: 4096,
      temperature: input.temperature ?? 0.7,
      system: input.system,
      messages: [{ role: "user", content: input.prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
