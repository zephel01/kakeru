import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDraft } from "@/features/draft/generateDraft";

const bodySchema = z.object({
  templateId: z.string().min(1),
  media: z.enum(["zenn", "note", "x"]),
  variables: z.record(z.string()).default({}),
  provider: z.enum(["openai", "anthropic", "ollama", "lmstudio"]).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

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
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await generateDraft(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
