import { NextResponse } from "next/server";
import { z } from "zod";
import { generateThumbnail } from "@/features/image-gen/generateThumbnail";

const bodySchema = z.object({
  prompt: z.string().min(1),
  media: z.enum(["zenn", "note", "x"]),
  variations: z.number().int().min(1).max(6).optional(),
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
    const result = await generateThumbnail(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
