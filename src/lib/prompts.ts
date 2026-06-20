import { promises as fs } from "node:fs";
import path from "node:path";

export interface PromptTemplateMeta {
  id: string;
  title: string;
  file: string;
  media: string[];
  variables: string[];
}

export interface PromptIndex {
  templates: PromptTemplateMeta[];
}

export interface RenderedPrompt {
  system: string;
  user: string;
}

const PROMPTS_DIR = path.join(process.cwd(), "prompts");

export async function loadPromptIndex(): Promise<PromptIndex> {
  const raw = await fs.readFile(path.join(PROMPTS_DIR, "index.json"), "utf-8");
  return JSON.parse(raw) as PromptIndex;
}

export async function getTemplateMeta(
  id: string,
): Promise<PromptTemplateMeta | undefined> {
  const index = await loadPromptIndex();
  return index.templates.find((t) => t.id === id);
}

/**
 * テンプレートMarkdownを読み込み、frontmatter を除いて
 * `# System` / `# User` セクションに分割する。
 */
export async function loadTemplateBody(
  file: string,
): Promise<{ system: string; user: string }> {
  const raw = await fs.readFile(path.join(PROMPTS_DIR, file), "utf-8");
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();

  const system = extractSection(body, "System");
  const user = extractSection(body, "User");
  return { system, user };
}

function extractSection(body: string, heading: string): string {
  const re = new RegExp(`^#\\s+${heading}\\s*$`, "m");
  const match = re.exec(body);
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const next = /^#\s+\S/m.exec(rest);
  const section = next ? rest.slice(0, next.index) : rest;
  return section.trim();
}

/** `{{var}}` を values で差し込む。未指定変数は空文字に。 */
export function renderVariables(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    values[key] !== undefined ? values[key] : "",
  );
}

export async function renderPrompt(
  id: string,
  values: Record<string, string>,
): Promise<RenderedPrompt> {
  const meta = await getTemplateMeta(id);
  if (!meta) throw new Error(`Unknown prompt template: ${id}`);

  const { system, user } = await loadTemplateBody(meta.file);
  return {
    system: renderVariables(system, values),
    user: renderVariables(user, values),
  };
}
