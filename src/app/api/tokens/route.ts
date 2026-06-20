import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeTokenCost } from "@/lib/tokens";

const bodySchema = z.object({
  text: z.string().default(""),
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

  const cost = analyzeTokenCost(parsed.data.text);
  return NextResponse.json(cost);
}
