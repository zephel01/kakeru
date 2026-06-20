import { encode } from "gpt-tokenizer";

/**
 * テキストのトークン数を数える（cl100k_base 基準）。
 * ローカルモデルのトークナイザとは厳密には一致しないが、
 * コスト感を可視化する目安として用いる。
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

export interface TokenCostBreakdown {
  /** 入力テキストのトークン数 */
  tokens: number;
  /** 文字数 */
  chars: number;
  /** 1文字あたりのトークン数 */
  tokensPerChar: number;
  /**
   * 英語比のコスト倍率。英語はおおむね 0.25 token/char。
   * 日本語など多バイト言語がその何倍トークンを消費するかを示す。
   */
  englishCostMultiplier: number;
}

/** 英語テキストの代表的な token/char（概算ベースライン） */
export const ENGLISH_TOKENS_PER_CHAR = 0.25;

export function analyzeTokenCost(text: string): TokenCostBreakdown {
  const tokens = countTokens(text);
  const chars = [...text].length;
  const tokensPerChar = chars === 0 ? 0 : tokens / chars;
  const englishCostMultiplier =
    tokensPerChar === 0 ? 0 : tokensPerChar / ENGLISH_TOKENS_PER_CHAR;

  return {
    tokens,
    chars,
    tokensPerChar: round(tokensPerChar, 3),
    englishCostMultiplier: round(englishCostMultiplier, 2),
  };
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
