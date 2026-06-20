"use client";

import { useState } from "react";
import type { Media, ThumbnailResponse } from "@/types";

const MEDIA: { value: Media; label: string }[] = [
  { value: "zenn", label: "Zenn" },
  { value: "note", label: "note" },
  { value: "x", label: "X" },
];

export default function ThumbnailForm() {
  const [prompt, setPrompt] = useState("");
  const [media, setMedia] = useState<Media>("zenn");
  const [variations, setVariations] = useState(3);
  const [result, setResult] = useState<ThumbnailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, media, variations }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "生成に失敗しました");
      else setResult(data as ThumbnailResponse);
    } catch {
      setError("リクエストに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium">プロンプト / 記事要旨</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          placeholder="サムネに反映したい記事の要点・雰囲気を入力"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">媒体</label>
          <select
            value={media}
            onChange={(e) => setMedia(e.target.value as Media)}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          >
            {MEDIA.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">バリエーション数</label>
          <input
            type="number"
            min={1}
            max={6}
            value={variations}
            onChange={(e) => setVariations(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || !prompt}
        className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "生成中…" : "サムネを生成"}
      </button>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div>
          <p className="text-xs text-neutral-500">provider: {result.provider}</p>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {result.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={`thumbnail ${i + 1}`}
                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
