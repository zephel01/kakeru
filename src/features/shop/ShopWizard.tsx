"use client";

import { useEffect, useState } from "react";
import {
  GYOSHU_OPTIONS,
  SHOP_ACTIONS,
  getAction,
  type ShopField,
} from "@/features/shop/config";

/** アクションの初期値（プリセット）を作る */
function defaultsFor(id: string): Record<string, string> {
  const a = getAction(id);
  const v: Record<string, string> = {};
  a?.fields.forEach((f) => {
    if (f.default) v[f.name] = f.default;
  });
  return v;
}

function splitParts(v: string): string[] {
  return v
    .split(/[、,]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function togglePart(v: string, p: string): string {
  const parts = splitParts(v);
  const i = parts.indexOf(p);
  if (i >= 0) parts.splice(i, 1);
  else parts.push(p);
  return parts.join("、");
}
import {
  addHistory,
  clearHistory,
  formatRelative,
  loadHistory,
  newId,
  removeHistory,
  SHOP_HISTORY_KEY,
  type DraftHistoryItem,
} from "@/lib/history";

type Phase = "idle" | "streaming" | "done" | "error";

export default function ShopWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [actionId, setActionId] = useState<string>("");
  const [gyoshu, setGyoshu] = useState<string>("");
  const [gyoshuOther, setGyoshuOther] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});

  const [text, setText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // 参考写真の解析
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [history, setHistory] = useState<DraftHistoryItem[]>([]);
  useEffect(() => {
    setHistory(loadHistory(SHOP_HISTORY_KEY));
  }, []);

  const action = getAction(actionId);
  const effectiveGyoshu = gyoshu === "その他" ? gyoshuOther : gyoshu;

  function clearImage() {
    setImgPreview(null);
    setAnalyzeError(null);
  }

  function reset() {
    setStep(1);
    setActionId("");
    setGyoshu("");
    setGyoshuOther("");
    setValues({});
    setText("");
    setPhase("idle");
    setError(null);
    clearImage();
  }

  function chooseAction(id: string) {
    setActionId(id);
    setValues(defaultsFor(id));
    setText("");
    setPhase("idle");
    clearImage();
    setStep(2);
  }

  function chooseGyoshu(g: string) {
    setGyoshu(g);
    if (g !== "その他") setStep(3);
  }

  const missing =
    !action ||
    !effectiveGyoshu.trim() ||
    action.fields.some((f) => f.required && !(values[f.name] ?? "").trim());

  async function onGenerate() {
    if (!action) return;
    setError(null);
    setText("");
    setElapsed(0);
    setPhase("streaming");
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      250,
    );

    try {
      const res = await fetch("/api/shop/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: action.id,
          variables: { gyoshu: effectiveGyoshu, ...values },
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `エラーが発生しました (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }

      const hasError = acc.includes("[ERROR]");
      if (!acc.trim() || hasError) {
        setPhase("error");
        if (!acc.trim()) {
          setError(
            "うまく作れませんでした。少し時間をおいて、もう一度お試しください。",
          );
        }
      } else {
        setPhase("done");
        const item: DraftHistoryItem = {
          id: newId(),
          createdAt: Date.now(),
          templateId: action.id,
          templateTitle: action.title,
          media: "x",
          provider: "shop",
          model: "",
          variables: { gyoshu: effectiveGyoshu, ...values },
          markdown: acc,
          chars: acc.length,
          elapsedSec: Math.floor((Date.now() - start) / 1000),
        };
        setHistory(addHistory(item, SHOP_HISTORY_KEY));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setPhase("error");
    } finally {
      clearInterval(timer);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可は無視
    }
  }

  // 最初の ``` コードブロック（＝そのまま使えるプロンプト）を取り出す
  function extractFence(t: string): string | null {
    const m = t.match(/```[a-zA-Z]*\n?([\s\S]*?)```/);
    return m ? m[1].trim() : null;
  }
  const promptOnly =
    actionId === "image-prompt" && phase !== "streaming"
      ? extractFence(text)
      : null;

  async function copyPrompt() {
    if (!promptOnly) return;
    try {
      await navigator.clipboard?.writeText(promptOnly);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1500);
    } catch {
      // クリップボード不可は無視
    }
  }

  function onPickImage(file: File) {
    setAnalyzeError(null);
    const reader = new FileReader();
    reader.onload = () => setImgPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function analyzeImage() {
    if (!imgPreview) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/shop/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imgPreview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解析に失敗しました");
      setValues((s) => ({ ...s, reference: data.description }));
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "解析に失敗しました");
    } finally {
      setAnalyzing(false);
    }
  }

  function viewHistory(it: DraftHistoryItem) {
    setActionId(it.templateId);
    const { gyoshu: g, ...rest } = it.variables;
    setGyoshu(GYOSHU_OPTIONS.includes(g as never) ? g : "その他");
    setGyoshuOther(GYOSHU_OPTIONS.includes(g as never) ? "" : (g ?? ""));
    setValues(rest);
    setText(it.markdown);
    setPhase("done");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* ステップ表示 */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= n
                  ? "bg-brand text-white"
                  : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700"
              }`}
            >
              {n}
            </span>
            <span
              className={
                step >= n ? "font-medium" : "text-neutral-400"
              }
            >
              {n === 1 ? "作るもの" : n === 2 ? "お店の種類" : "かんたん入力"}
            </span>
            {n < 3 && <span className="mx-1 text-neutral-300">→</span>}
          </div>
        ))}
      </div>

      {/* ステップ1: 何を作る */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {SHOP_ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => chooseAction(a.id)}
              className="rounded-2xl border border-neutral-200 p-6 text-left transition hover:border-brand hover:shadow-md dark:border-neutral-800"
            >
              <div className="text-3xl">{a.emoji}</div>
              <div className="mt-3 text-lg font-bold">{a.title}</div>
              <p className="mt-1 text-sm text-neutral-500">{a.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ステップ2: 業種 */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="mb-4 text-sm text-brand hover:underline"
          >
            ← もどる
          </button>
          <p className="mb-4 text-base font-medium">お店の種類を選んでください</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {GYOSHU_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => chooseGyoshu(g)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition hover:border-brand ${
                  gyoshu === g
                    ? "border-brand bg-brand/5"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {gyoshu === "その他" && (
            <div className="mt-4">
              <input
                value={gyoshuOther}
                onChange={(e) => setGyoshuOther(e.target.value)}
                placeholder="例: 整骨院、写真スタジオ など"
                className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              />
              <button
                onClick={() => effectiveGyoshu.trim() && setStep(3)}
                disabled={!effectiveGyoshu.trim()}
                className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      )}

      {/* ステップ3: 入力＋生成 */}
      {step === 3 && action && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-brand hover:underline"
            >
              ← もどる
            </button>
            <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm dark:bg-neutral-800">
              {action.emoji} <strong>{action.title}</strong> ／ {effectiveGyoshu}
            </div>

            {action.id === "image-prompt" && (
              <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                <label className="block text-sm font-medium">
                  参考写真（任意）
                </label>
                <p className="mt-1 text-xs text-neutral-500">
                  好きな雰囲気の写真があれば読み込むと、その雰囲気を解析してプロンプトに反映します。写真は端末内で処理され、外部には送られません。
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && onPickImage(e.target.files[0])
                  }
                  className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:text-neutral-300"
                />
                {imgPreview && (
                  <div className="mt-3 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgPreview}
                      alt="参考写真"
                      className="max-h-40 rounded-md border border-neutral-200 dark:border-neutral-800"
                    />
                    <button
                      onClick={analyzeImage}
                      disabled={analyzing}
                      className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900"
                    >
                      {analyzing ? "解析中…" : "この写真の雰囲気を解析"}
                    </button>
                    {analyzeError && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {analyzeError}
                      </p>
                    )}
                    {values.reference && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-500">
                          解析結果（編集できます。これがプロンプトに反映されます）
                        </label>
                        <textarea
                          value={values.reference}
                          onChange={(e) =>
                            setValues((s) => ({
                              ...s,
                              reference: e.target.value,
                            }))
                          }
                          rows={4}
                          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-xs dark:border-neutral-700"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {action.fields.map((f) => (
              <Field
                key={f.name}
                field={f}
                value={values[f.name] ?? ""}
                onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
              />
            ))}

            <button
              onClick={onGenerate}
              disabled={phase === "streaming" || missing}
              className="w-full rounded-md bg-brand px-4 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {phase === "streaming" ? `作成中… ${elapsed}秒` : "✨ 文章を作る"}
            </button>
            {missing && phase === "idle" && (
              <p className="text-xs text-neutral-500">
                ※ 必須の欄（{action.fields
                  .filter((f) => f.required)
                  .map((f) => f.label)
                  .join("・")}）を入力すると押せます
              </p>
            )}
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
          </div>

          {/* 結果 */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">できあがり</h2>
              {text && phase !== "streaming" && (
                <div className="flex gap-2">
                  {promptOnly && (
                    <button
                      onClick={copyPrompt}
                      className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:opacity-90"
                    >
                      {copiedPrompt ? "コピーしました" : "🎨 プロンプトだけコピー"}
                    </button>
                  )}
                  <button
                    onClick={copyText}
                    className="rounded-md border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand/5"
                  >
                    {copied ? "コピーしました" : "全部コピー"}
                  </button>
                </div>
              )}
            </div>

            {phase === "streaming" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
                作成中… {elapsed}秒 / {text.length}文字
              </p>
            )}
            {phase === "done" && (
              <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                ✓ できました（{text.length}文字）
              </p>
            )}

            {phase !== "idle" ? (
              <pre className="mt-2 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                {text || (phase === "streaming" ? "…" : "")}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                「文章を作る」を押すと、ここに結果が出ます。
              </p>
            )}
          </div>
        </div>
      )}

      {/* 履歴 */}
      <ShopHistory
        items={history}
        onView={viewHistory}
        onDelete={(id) => setHistory(removeHistory(id, SHOP_HISTORY_KEY))}
        onClear={() => setHistory(clearHistory(SHOP_HISTORY_KEY))}
      />

      {step !== 1 && (
        <div className="mt-8">
          <button
            onClick={reset}
            className="text-sm text-neutral-500 hover:underline"
          >
            最初からやり直す
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ShopField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        >
          <option value="">選んでください</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={field.example}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.example}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
        />
      )}

      {field.presets && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {field.presets.map((p) => {
            const active = splitParts(value).includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(togglePart(value, p))}
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
}

function ShopHistory({
  items,
  onView,
  onDelete,
  onClear,
}: {
  items: DraftHistoryItem[];
  onView: (it: DraftHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">これまでに作ったもの（{items.length}）</h2>
        <button
          onClick={() => {
            if (confirm("すべて削除しますか？")) onClear();
          }}
          className="text-xs text-red-600 hover:underline dark:text-red-400"
        >
          すべて削除
        </button>
      </div>
      <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
        {items.map((it) => {
          const preview =
            it.variables.shop_name ||
            it.variables.item_name ||
            it.variables.purpose ||
            it.markdown.slice(0, 30);
          return (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2">
              <button
                onClick={() => onView(it)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {it.templateTitle}
                  </span>
                  <span>{it.variables.gyoshu}</span>
                  <span>{formatRelative(it.createdAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-sm">{preview}</p>
              </button>
              <button
                onClick={() => onDelete(it.id)}
                className="shrink-0 text-xs text-neutral-400 hover:text-red-600"
                aria-label="削除"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
