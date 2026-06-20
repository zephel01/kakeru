import type { Media, TokenCostInfo } from "@/types";

export interface DraftHistoryItem {
  id: string;
  createdAt: number; // epoch ms
  templateId: string;
  templateTitle: string;
  media: Media;
  provider: string;
  model: string;
  variables: Record<string, string>;
  markdown: string;
  chars: number;
  elapsedSec: number;
  cost?: TokenCostInfo;
}

export const DRAFT_HISTORY_KEY = "kakeru:draft-history:v1";
export const SHOP_HISTORY_KEY = "kakeru:shop-history:v1";
const MAX = 50;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadHistory(key: string = DRAFT_HISTORY_KEY): DraftHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DraftHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: DraftHistoryItem[], key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // 保存失敗（容量超過など）は無視
  }
}

export function addHistory(
  item: DraftHistoryItem,
  key: string = DRAFT_HISTORY_KEY,
): DraftHistoryItem[] {
  const items = [item, ...loadHistory(key)].slice(0, MAX);
  persist(items, key);
  return items;
}

export function removeHistory(
  id: string,
  key: string = DRAFT_HISTORY_KEY,
): DraftHistoryItem[] {
  const items = loadHistory(key).filter((i) => i.id !== id);
  persist(items, key);
  return items;
}

export function clearHistory(key: string = DRAFT_HISTORY_KEY): DraftHistoryItem[] {
  persist([], key);
  return [];
}

/** 表示用：相対時刻（例: 3分前 / 2時間前 / 6/20 09:30） */
export function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const d = new Date(ms);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}
