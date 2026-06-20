import { analyzeTokenCost, type TokenCostBreakdown } from "@/lib/tokens";

/**
 * 日本語最適化レイヤー（language tax 対策）。
 *
 * 方針:
 *  - strategy "direct": ローカル日本語モデルで直接生成（トークン税は受容、外部送信なし）
 *  - strategy "via-english": 英語で高品質生成 → 日本語化（トークン効率重視）
 *
 * ここではコスト可視化と戦略推奨のみ実装。実際の英→日変換は
 * LLM プロバイダ呼び出しと組み合わせて拡張する想定（スタブ）。
 */
export type JaOptStrategy = "direct" | "via-english";

export interface JaOptAdvice {
  cost: TokenCostBreakdown;
  recommended: JaOptStrategy;
  reason: string;
}

export function adviseStrategy(text: string): JaOptAdvice {
  const cost = analyzeTokenCost(text);

  // 英語比 1.8 倍を超えると via-english の方がトークン効率が良くなりやすい目安。
  const recommended: JaOptStrategy =
    cost.englishCostMultiplier >= 1.8 ? "via-english" : "direct";

  const reason =
    recommended === "via-english"
      ? `英語比 ${cost.englishCostMultiplier}x とトークン消費が大きいため、英語生成→日本語化が効率的`
      : `英語比 ${cost.englishCostMultiplier}x と許容範囲のため、直接生成で十分`;

  return { cost, recommended, reason };
}
