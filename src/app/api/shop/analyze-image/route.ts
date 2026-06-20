import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider, getVisionModel } from "@/lib/llm";
import type { ProviderName } from "@/lib/llm/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  image: z.string().min(1), // データURL or base64
});

/**
 * 参考写真を画像認識モデル（既定: ローカルの qwen2.5vl）で解析し、
 * 雰囲気・色味・構図・要素を日本語で説明して返す。
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
      { error: "画像が読み取れませんでした" },
      { status: 400 },
    );
  }

  // データURLのプレフィックスを除去して raw base64 に
  const base64 = parsed.data.image.replace(/^data:image\/\w+;base64,/, "");

  const providerName: ProviderName =
    (process.env.LLM_PROVIDER as ProviderName) ?? "ollama";
  const provider = getProvider(providerName);

  const system =
    "あなたは画像の雰囲気を言葉で説明するアシスタントです。お店の広告画像づくりの参考にするため、写真の印象を日本語で説明します。";
  const prompt =
    "この写真の「雰囲気・色味・明るさ・構図・写っている主な要素」を、日本語で簡潔に説明してください。箇条書きで5項目以内。特定の商品名やブランド名は不要です。";

  try {
    const result = await provider.generate({
      system,
      prompt,
      model: getVisionModel(),
      images: [base64],
    });
    return NextResponse.json({ description: result.text.trim() });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "解析に失敗しました";
    return NextResponse.json(
      {
        error: `写真の解析に失敗しました。画像認識モデル（${getVisionModel()}）が使えるか確認してください。詳細: ${message}`,
      },
      { status: 500 },
    );
  }
}
