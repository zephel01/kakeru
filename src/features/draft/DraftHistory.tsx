"use client";

import { formatRelative, type DraftHistoryItem } from "@/lib/history";

interface Props {
  items: DraftHistoryItem[];
  activeId?: string | null;
  onView: (item: DraftHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function DraftHistory({
  items,
  activeId,
  onView,
  onDelete,
  onClear,
}: Props) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          履歴{" "}
          <span className="text-neutral-500">（{items.length}）</span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm("履歴をすべて削除しますか？")) onClear();
            }}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            すべて削除
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">
          生成したドラフトはここに自動保存されます（この端末のブラウザ内のみ）。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((it) => {
            const preview =
              it.variables.topic ||
              it.variables.subjects ||
              it.variables.problem ||
              it.variables.source_content ||
              it.markdown.slice(0, 40);
            return (
              <li
                key={it.id}
                className={`flex items-start justify-between gap-3 py-2 ${
                  activeId === it.id ? "rounded-md bg-brand/5 px-2" : ""
                }`}
              >
                <button
                  onClick={() => onView(it)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700 dark:text-neutral-200">
                      {it.templateTitle}
                    </span>
                    <span>{formatRelative(it.createdAt)}</span>
                    <span>{it.provider}</span>
                    <span>{it.model}</span>
                    <span>{it.chars}文字</span>
                    {it.cost && <span>英語比 {it.cost.englishCostMultiplier}x</span>}
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
      )}
    </section>
  );
}
