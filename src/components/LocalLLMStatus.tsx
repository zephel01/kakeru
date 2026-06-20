"use client";

import { useEffect, useState } from "react";
import type { LocalLLMStatus } from "@/features/local-llm/status";

interface StatusResponse {
  ollama: LocalLLMStatus;
  lmstudio: LocalLLMStatus;
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? "bg-green-500" : "bg-neutral-400"
      }`}
    />
  );
}

export default function LocalLLMStatusBadge() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/local-llm")
      .then((r) => r.json())
      .then((d: StatusResponse) => active && setStatus(d))
      .catch(() => active && setStatus(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-xs text-neutral-500">ローカルLLM状態を確認中…</p>
    );
  }
  if (!status) {
    return (
      <p className="text-xs text-neutral-500">ローカルLLM状態を取得できませんでした</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 text-xs text-neutral-600 dark:text-neutral-300">
      <span className="flex items-center gap-1.5">
        <Dot ok={status.ollama.reachable} />
        Ollama {status.ollama.reachable ? "接続OK" : "未接続"}
        {status.ollama.models && status.ollama.models.length > 0 && (
          <span className="text-neutral-400">
            ({status.ollama.models.length}モデル)
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        <Dot ok={status.lmstudio.reachable} />
        LM Studio {status.lmstudio.reachable ? "接続OK" : "未接続"}
      </span>
    </div>
  );
}
