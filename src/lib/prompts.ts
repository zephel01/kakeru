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

// ============================================================
// お店モード（かんたんモード）用テンプレート
// prompts/shop/ 配下を読み込む
// ============================================================

const SHOP_DIR = path.join(PROMPTS_DIR, "shop");

export interface ShopTemplateMeta {
  id: string;
  title: string;
  file: string;
  variables: string[];
  channels?: string[];
}

export async function loadShopIndex(): Promise<{
  templates: ShopTemplateMeta[];
}> {
  const raw = await fs.readFile(path.join(SHOP_DIR, "index.json"), "utf-8");
  return JSON.parse(raw) as { templates: ShopTemplateMeta[] };
}

export async function getShopTemplateMeta(
  id: string,
): Promise<ShopTemplateMeta | undefined> {
  const index = await loadShopIndex();
  return index.templates.find((t) => t.id === id);
}

async function loadShopTemplateBody(
  file: string,
): Promise<{ system: string; user: string }> {
  const raw = await fs.readFile(path.join(SHOP_DIR, file), "utf-8");
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  return {
    system: extractSection(body, "System"),
    user: extractSection(body, "User"),
  };
}

export async function renderShopPrompt(
  id: string,
  values: Record<string, string>,
): Promise<RenderedPrompt> {
  const meta = await getShopTemplateMeta(id);
  if (!meta) throw new Error(`Unknown shop template: ${id}`);

  const { system, user } = await loadShopTemplateBody(meta.file);
  return {
    system: renderVariables(system, values),
    user: renderVariables(user, values),
  };
}
