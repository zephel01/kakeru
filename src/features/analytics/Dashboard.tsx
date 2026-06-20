"use client";

import { useState } from "react";
import { predictEngagement } from "@/features/analytics/predict";
import type { TokenCostInfo } from "@/types";

export default function Dashboard() {
  const [text, setText] = useState("");
  const [cost, setCost] = useState<TokenCostInfo | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setCost((await res.json()) as TokenCostInfo);
    } finally {
      setLoading(false);
    }
  }

  const prediction = predictEngagement({
    title: text.split("\n")[0] ?? "",
    body: text,
    hasCode: /```/.test(text),
    hasImage: /!\[.*\]\(.*\)/.test(text),
  });

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium">
          解析対象テキスト（記事ドラフトを貼り付け）
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          placeholder="# タイトル\n\n本文…"
        />
        <button
          onClick={analyze}
          disabled={loading || !text}
          className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "解析中…" : "トークンコストを解析"}
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">トークンコスト</h2>
          {cost ? (
            <dl className="mt-3 space-y-1 text-sm">
              <Row k="トークン数" v={`${cost.tokens}`} />
              <Row k="文字数" v={`${cost.chars}`} />
              <Row k="トークン/文字" v={`${cost.tokensPerChar}`} />
              <Row
                k="英語比コスト倍率"
                v={`${cost.englishCostMultiplier}x`}
                highlight
              />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              「解析」を押すと表示されます。
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">反応予測（簡易）</h2>
          <p className="mt-3 text-3xl font-bold text-brand">
            {prediction.score}
            <span className="text-base font-normal text-neutral-500">/100</span>
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {prediction.factors.map((f) => (
              <li key={f.label} className="flex justify-between">
                <span className="text-neutral-500">{f.label}</span>
                <span>+{f.impact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({
  k,
  v,
  highlight,
}: {
  k: string;
  v: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-500">{k}</dt>
      <dd className={highlight ? "font-semibold text-brand" : ""}>{v}</dd>
    </div>
  );
}
