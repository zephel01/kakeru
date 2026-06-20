import { NextResponse } from "next/server";
import { loadPromptIndex } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const index = await loadPromptIndex();
    return NextResponse.json(index);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
