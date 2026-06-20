import Dashboard from "@/features/analytics/Dashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold">簡易分析ダッシュボード</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        トークンコスト（英語比倍率）の可視化と、記事ドラフトの反応予測スコアを表示します。
      </p>
      <div className="mt-8">
        <Dashboard />
      </div>
    </main>
  );
}
