"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProviderName } from "@/lib/llm/types";
import type { LocalLLMStatus } from "@/features/local-llm/status";
import type { Media, TokenCostInfo } from "@/types";
import {
  addHistory,
  clearHistory,
  loadHistory,
  newId,
  removeHistory,
  type DraftHistoryItem,
} from "@/lib/history";
import DraftHistory from "@/features/draft/DraftHistory";

interface TemplateMeta {
  id: string;
  title: string;
  file: string;
  media: Media[];
  variables: string[];
}

interface LocalStatusResponse {
  ollama: LocalLLMStatus;
  lmstudio: LocalLLMStatus;
}

const PROVIDERS: { value: ProviderName; label: string; local: boolean }[] = [
  { value: "ollama", label: "Ollama（ローカル）", local: true },
  { value: "lmstudio", label: "LM Studio（ローカル）", local: true },
  { value: "openai", label: "OpenAI", local: false },
  { value: "anthropic", label: "Anthropic", local: false },
];

/** モデル名からファミリ（系統）を推定する。例: qwen2.5:14b → "qwen" */
function modelFamily(name: string): string {
  const base = name.includes("/") ? (name.split("/").pop() ?? name) : name;
  const m = base.match(/^[a-zA-Z]+/);
  return m ? m[0].toLowerCase() : "other";
}

interface ModelGroup {
  family: string;
  label: string;
  items: string[];
}

/** モデル一覧をファミリ別にグループ化（グループ=数の多い順、内部=バージョン順） */
function groupModels(models: string[]): ModelGroup[] {
  const map = new Map<string, string[]>();
  for (const m of models) {
    const f = modelFamily(m);
    if (!map.has(f)) map.set(f, []);
    map.get(f)!.push(m);
  }
  return [...map.entries()]
    .map(([family, items]) => ({
      family,
      label: family.charAt(0).toUpperCase() + family.slice(1),
      items: [...items].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    }))
    .sort(
      (a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label),
    );
}

/** 各変数の説明と入力例（ぱっと見で分かるように） */
const VARIABLE_HELP: Record<
  string,
  { desc: string; example: string; presets?: string[] }
> = {
  // 技術解説記事
  topic: {
    desc: "記事のテーマ",
    example: "例: Next.js App Router の Server Components 入門",
  },
  audience: {
    desc: "想定読者",
    example: "例: React は触れるが App Router は未経験の中級者",
    presets: [
      "初心者",
      "中級者",
      "実務エンジニア",
      "これから学ぶ人",
      "非エンジニア",
    ],
  },
  keywords: {
    desc: "盛り込みたいキーワード（カンマ区切り）",
    example: "例: App Router, Server Components, データフェッチ, キャッシュ",
  },
  reference_links: {
    desc: "参考にしたいURL（任意・複数可）",
    example: "例: https://nextjs.org/docs/app",
  },
  // ベンチマーク / 比較
  subjects: {
    desc: "比較する対象",
    example: "例: Ollama qwen2.5:7b / OpenAI gpt-4o-mini / Claude Haiku",
  },
  metrics: {
    desc: "評価する指標",
    example: "例: 生成速度(tok/s), 日本語の自然さ, コスト, トークン消費量",
    presets: [
      "速度",
      "メモリ使用量",
      "精度",
      "コスト",
      "開発体験(DX)",
      "学習コスト",
    ],
  },
  environment: {
    desc: "検証/動作環境",
    example: "例: MacBook Pro M3 / 32GB / Node 22 / Ollama 0.x",
  },
  use_case: {
    desc: "想定ユースケース",
    example: "例: 技術ブログ下書きの日本語生成（約3000字）",
  },
  // トラブルシューティング
  problem: {
    desc: "起きている問題・症状",
    example: "例: 本番ビルドだけ next build が失敗する",
  },
  error_message: {
    desc: "実際のエラーメッセージ",
    example: "例: Error: EPERM: operation not permitted, unlink '.next/...'",
  },
  attempted: {
    desc: "すでに試したこと",
    example: "例: node_modules削除＆再install、キャッシュ削除を試したが解消せず",
  },
  // X投稿
  source_content: {
    desc: "元にする記事の要旨・内容",
    example: "例: AIライティング補助ツール『Kakeru』を作った話の要点",
  },
  goal: {
    desc: "投稿の目的",
    example: "例: 記事への流入を増やす / ツールの認知拡大",
    presets: [
      "記事への流入",
      "認知拡大",
      "議論を呼びたい",
      "保存されたい",
      "共感を得たい",
    ],
  },
  tone: {
    desc: "トーン",
    example: "例: フランクだが誇張しない技術者向け",
    presets: ["フランク", "ていねい", "熱量高め", "落ち着いた", "真面目"],
  },
  link: {
    desc: "貼りたいリンク",
    example: "例: https://zenn.dev/yourname/articles/xxxx",
  },
  // チュートリアル
  prerequisites: {
    desc: "前提知識・環境",
    example: "例: Node.js 20、TypeScriptの基礎",
    presets: [
      "特になし",
      "基本的なコマンド操作",
      "JS/TSの基礎",
      "Gitの基礎",
      "Dockerの基礎",
    ],
  },
  outcome: {
    desc: "読者が最後にできること（ゴール）",
    example: "例: 自分のPCでローカルLLMを動かせる",
  },
  // まとめ / オピニオン
  theme: {
    desc: "テーマ・論点",
    example: "例: 個人開発でAIをどう使うか",
  },
  count: {
    desc: "紹介する数",
    example: "例: 5",
    presets: ["3", "5", "7", "10"],
  },
  criteria: {
    desc: "選定基準",
    example: "例: 無料で使える / 日本語対応",
    presets: [
      "人気度",
      "使いやすさ",
      "無料・安さ",
      "日本語対応",
      "学習コスト",
      "実務での実績",
    ],
  },
  stance: {
    desc: "自分の立場・主張",
    example: "例: 小規模ならローカルLLMで十分",
    presets: ["賛成", "反対", "中立（両論）", "条件つき賛成"],
  },
  context: {
    desc: "背景・きっかけ",
    example: "例: 実務で試して感じたこと",
  },
  // リリース告知
  product_name: {
    desc: "プロダクト/機能の名前",
    example: "例: Kakeru v0.2",
  },
  what_changed: {
    desc: "何が新しい・何ができる",
    example: "例: お店モードと画像プロンプト支援を追加",
  },
};

/** カンマ/読点区切りの値を配列化 */
function splitDraftParts(v: string): string[] {
  return v
    .split(/[、,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** プリセットのON/OFFトグル */
function toggleDraftPart(v: string, p: string): string {
  const parts = splitDraftParts(v);
  const i = parts.indexOf(p);
  if (i >= 0) parts.splice(i, 1);
  else parts.push(p);
  return parts.join("、");
}

export default function DraftForm() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [provider, setProvider] = useState<ProviderName>("ollama");
  const [model, setModel] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // ストリーミング表示用
  const [streamText, setStreamText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "streaming" | "done" | "error">(
    "idle",
  );
  const [meta, setMeta] = useState<{
    provider: string;
    model: string;
    private: boolean;
    cost?: TokenCostInfo;
  } | null>(null);

  // 履歴（localStorage）
  const [history, setHistory] = useState<DraftHistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const [localStatus, setLocalStatus] = useState<LocalStatusResponse | null>(
    null,
  );
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d: { templates: TemplateMeta[] }) => {
        setTemplates(d.templates ?? []);
        if (d.templates?.[0]) setTemplateId(d.templates[0].id);
      })
      .catch(() => setError("テンプレート一覧の取得に失敗しました"));
  }, []);

  async function refreshLocalStatus() {
    setStatusLoading(true);
    try {
      const r = await fetch("/api/local-llm");
      setLocalStatus((await r.json()) as LocalStatusResponse);
    } catch {
      setLocalStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }

  // 初回 + ローカルプロバイダ選択時に状態取得
  useEffect(() => {
    refreshLocalStatus();
  }, []);

  const current = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const providerMeta = PROVIDERS.find((p) => p.value === provider);
  const isLocal = providerMeta?.local ?? false;

  const localInfo: LocalLLMStatus | undefined =
    provider === "ollama"
      ? localStatus?.ollama
      : provider === "lmstudio"
        ? localStatus?.lmstudio
        : undefined;

  const availableModels = useMemo(
    () => (localInfo?.reachable ? (localInfo.models ?? []) : []),
    [localInfo],
  );
  const useModelDropdown = isLocal && availableModels.length > 0;
  const modelGroups = useMemo(
    () => groupModels(availableModels),
    [availableModels],
  );

  // ドロップダウン利用可能時、未選択 or リスト外なら先頭モデルを自動選択
  useEffect(() => {
    if (useModelDropdown && !availableModels.includes(model)) {
      setModel(availableModels[0]);
    }
    // プロバイダ切替でローカル接続が無い場合は手入力に戻すため model を維持
  }, [useModelDropdown, availableModels, model]);

  async function onGenerate() {
    if (!current) return;
    setError(null);
    setStreamText("");
    setMeta(null);
    setElapsed(0);
    setPhase("streaming");

    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      250,
    );

    try {
      const res = await fetch("/api/draft/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: current.id,
          media: current.media[0],
          variables: values,
          provider,
          model: model || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }

      // 生成完了後にトークンコストを取得
      let cost: TokenCostInfo | undefined;
      try {
        const r = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: acc }),
        });
        cost = (await r.json()) as TokenCostInfo;
      } catch {
        // コスト取得失敗は無視
      }

      const finalElapsed = Math.floor((Date.now() - start) / 1000);
      setElapsed(finalElapsed);
      setMeta({
        provider,
        model: model || "(既定)",
        private: provider === "ollama" || provider === "lmstudio",
        cost,
      });

      const hasError = acc.includes("[ERROR]");
      if (!acc.trim() || hasError) {
        setPhase("error");
        if (!acc.trim()) {
          setError("出力が空でした（モデル/接続を確認してください）");
        }
      } else {
        setPhase("done");
        const item: DraftHistoryItem = {
          id: newId(),
          createdAt: Date.now(),
          templateId: current.id,
          templateTitle: current.title,
          media: current.media[0],
          provider,
          model: model || "(既定)",
          variables: { ...values },
          markdown: acc,
          chars: acc.length,
          elapsedSec: finalElapsed,
          cost,
        };
        setHistory(addHistory(item));
        setActiveId(item.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "リクエストに失敗しました");
      setPhase("error");
    } finally {
      clearInterval(timer);
    }
  }

  function onViewHistory(item: DraftHistoryItem) {
    setTemplateId(item.templateId);
    setValues(item.variables);
    setProvider(item.provider as ProviderName);
    setModel(item.model === "(既定)" ? "" : item.model);
    setStreamText(item.markdown);
    setElapsed(item.elapsedSec);
    setMeta({
      provider: item.provider,
      model: item.model,
      private: item.provider === "ollama" || item.provider === "lmstudio",
      cost: item.cost,
    });
    setPhase("done");
    setActiveId(item.id);
    setError(null);
  }

  function onDeleteHistory(id: string) {
    setHistory(removeHistory(id));
    if (activeId === id) setActiveId(null);
  }

  function onClearHistory() {
    setHistory(clearHistory());
    setActiveId(null);
  }

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-5">
        <div>
          <label className="block text-sm font-medium">テンプレート</label>
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setValues({});
              setStreamText("");
              setMeta(null);
              setPhase("idle");
            }}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}（{t.media.join("/")}）
              </option>
            ))}
          </select>
        </div>

        {current?.variables.map((v) => {
          const help = VARIABLE_HELP[v];
          return (
            <div key={v}>
              <label className="flex items-baseline gap-2 text-sm font-medium">
                {v}
                {help && (
                  <span className="font-normal text-neutral-500">
                    — {help.desc}
                  </span>
                )}
              </label>
              <textarea
                value={values[v] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [v]: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                placeholder={help?.example ?? `${v} を入力`}
              />
              {help?.presets && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {help.presets.map((p) => {
                    const active = splitDraftParts(values[v] ?? "").includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setValues((s) => ({
                            ...s,
                            [v]: toggleDraftPart(s[v] ?? "", p),
                          }))
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          active
                            ? "border-brand bg-brand text-white"
                            : "border-neutral-300 text-neutral-600 hover:border-brand dark:border-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">プロバイダ</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as ProviderName);
                refreshLocalStatus();
              }}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">モデル</label>
              {isLocal && (
                <button
                  type="button"
                  onClick={refreshLocalStatus}
                  className="text-xs text-brand hover:underline"
                >
                  {statusLoading ? "取得中…" : "再取得"}
                </button>
              )}
            </div>

            {useModelDropdown ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              >
                {modelGroups.map((g) => (
                  <optgroup key={g.family} label={`${g.label}（${g.items.length}）`}>
                    {g.items.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                placeholder={isLocal ? "例: qwen2.5:7b" : "例: gpt-4o-mini"}
              />
            )}

            {isLocal && (
              <p className="mt-1 text-xs text-neutral-500">
                {localInfo?.reachable
                  ? `接続OK：${availableModels.length}モデル検出`
                  : "未接続（手入力）。サーバ起動後に「再取得」"}
              </p>
            )}
          </div>
        </div>

        {isLocal && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
            🔒 プライベートモード：クラウドへ送信されません
          </p>
        )}

        <button
          onClick={onGenerate}
          disabled={phase === "streaming" || !current}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {phase === "streaming" ? `生成中… ${elapsed}s` : "ドラフトを生成"}
        </button>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">生成結果</h2>
          {streamText && phase !== "streaming" && (
            <button
              onClick={() => navigator.clipboard?.writeText(streamText)}
              className="text-xs text-brand hover:underline"
            >
              コピー
            </button>
          )}
        </div>
        {phase !== "idle" ? (
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {phase === "streaming" && (
                <span className="flex items-center gap-1.5 font-medium text-brand">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                  生成中… {elapsed}s / {streamText.length}文字
                </span>
              )}
              {phase === "done" && (
                <span className="font-medium text-green-600 dark:text-green-400">
                  ✓ 完了（{elapsed}s / {streamText.length}文字）
                </span>
              )}
              {phase === "error" && (
                <span className="font-medium text-red-600 dark:text-red-400">
                  ⚠ 中断（{elapsed}s）
                </span>
              )}
              {meta && (
                <>
                  <span className="text-neutral-500">
                    provider: {meta.provider}
                  </span>
                  <span className="text-neutral-500">model: {meta.model}</span>
                  <span className="text-neutral-500">
                    {meta.private ? "🔒 private" : "☁ cloud"}
                  </span>
                  {meta.cost && (
                    <span className="text-neutral-500">
                      英語比: {meta.cost.englishCostMultiplier}x
                    </span>
                  )}
                </>
              )}
            </div>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              {streamText || (phase === "streaming" ? "…" : "")}
            </pre>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            ここに生成されたMarkdownドラフトとトークンコストが表示されます。
          </p>
        )}
      </section>
      </div>

      <DraftHistory
        items={history}
        activeId={activeId}
        onView={onViewHistory}
        onDelete={onDeleteHistory}
        onClear={onClearHistory}
      />
    </div>
  );
}
