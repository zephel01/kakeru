import { NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultModel, getProvider } from "@/lib/llm";
import type { ProviderName } from "@/lib/llm/types";
import { renderShopPrompt } from "@/lib/prompts";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string()).default({}),
  provider: z.enum(["openai", "anthropic", "ollama", "lmstudio"]).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/**
 * お店モード（かんたんモード）の生成。ストリーミングでテキスト差分を返す。
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容を確認してください", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const providerName: ProviderName =
    body.provider ?? (process.env.LLM_PROVIDER as ProviderName) ?? "ollama";
  const model = body.model ?? getDefaultModel();

  let system: string;
  let user: string;
  try {
    const rendered = await renderShopPrompt(body.templateId, body.variables);
    system = rendered.system;
    user = rendered.user;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const provider = getProvider(providerName);
  const input = { system, prompt: user, model, temperature: body.temperature };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (provider.generateStream) {
          for await (const chunk of provider.generateStream(input)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } else {
          const result = await provider.generate(input);
          controller.enqueue(encoder.encode(result.text));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
