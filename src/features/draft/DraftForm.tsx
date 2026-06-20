"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProviderName } from "@/lib/llm/types";
import type { DraftResponse, Media } from "@/types";

interface TemplateMeta {
  id: string;
  title: string;
  file: string;
  media: Media[];
  variables: string[];
}

const PROVIDERS: { value: ProviderName; label: string; local: boolean }[] = [
  { value: "ollama", label: "Ollama（ローカル）", local: true },
  { value: "lmstudio", label: "LM Studio（ローカル）", local: true },
  { value: "openai", label: "OpenAI", local: false },
  { value: "anthropic", label: "Anthropic", local: false },
];

export default function DraftForm() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [provider, setProvider] = useState<ProviderName>("ollama");
  const [model, setModel] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d: { templates: TemplateMeta[] }) => {
        setTemplates(d.templates ?? []);
        if (d.templates?.[0]) setTemplateId(d.templates[0].id);
      })
      .catch(() => setError("テンプレート一覧の取得に失敗しました"));
  }, []);

  const current = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  const isLocal = PROVIDERS.find((p) => p.value === provider)?.local ?? false;

  async function onGenerate() {
    if (!current) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/draft", {
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成に失敗しました");
      } else {
        setResult(data as DraftResponse);
      }
    } catch {
      setError("リクエストに失敗しました（プロバイダ接続を確認してください）");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-5">
        <div>
          <label className="block text-sm font-medium">テンプレート</label>
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setValues({});
              setResult(null);
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

        {current?.variables.map((v) => (
          <div key={v}>
            <label className="block text-sm font-medium">{v}</label>
            <textarea
              value={values[v] ?? ""}
              onChange={(e) =>
                setValues((s) => ({ ...s, [v]: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              placeholder={`${v} を入力`}
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">プロバイダ</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as ProviderName)}
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
            <label className="block text-sm font-medium">モデル（任意）</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              placeholder="例: qwen2.5:7b"
            />
          </div>
        </div>

        {isLocal && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
            🔒 プライベートモード：クラウドへ送信されません
          </p>
        )}

        <button
          onClick={onGenerate}
          disabled={loading || !current}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "生成中…" : "ドラフトを生成"}
        </button>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium">生成結果</h2>
        {result ? (
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
              <span>provider: {result.provider}</span>
              <span>model: {result.model}</span>
              <span>{result.private ? "🔒 private" : "☁ cloud"}</span>
              <span>
                tokens: {result.usage.inputTokens}in /{" "}
                {result.usage.outputTokens}out
              </span>
              <span>英語比: {result.cost.englishCostMultiplier}x</span>
            </div>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
              {result.markdown}
            </pre>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            ここに生成されたMarkdownドラフトとトークンコストが表示されます。
          </p>
        )}
      </section>
    </div>
  );
}
