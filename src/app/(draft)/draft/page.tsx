import DraftForm from "@/features/draft/DraftForm";
import LocalLLMStatusBadge from "@/components/LocalLLMStatus";

export const dynamic = "force-dynamic";

export default function DraftPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ドラフト生成</h1>
        <LocalLLMStatusBadge />
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        テンプレートを選び、変数を入力してMarkdownドラフトを生成します。ローカルプロバイダ選択でプライベートモードになります。
      </p>

      <div className="mt-8">
        <DraftForm />
      </div>
    </main>
  );
}
