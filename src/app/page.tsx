import Link from "next/link";

const features = [
  {
    href: "/draft",
    title: "ドラフト生成",
    desc: "トピックからZenn/noteスタイルのMarkdownドラフトを生成",
  },
  {
    href: "/thumbnail",
    title: "サムネ生成",
    desc: "記事内容から媒体規格に合うサムネを複数バリエーション出力",
  },
  {
    href: "/dashboard",
    title: "簡易分析",
    desc: "PV/反応予測とトークンコストの可視化",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Kakeru ✍️</h1>
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">
        Zenn / note / X 特化のAIライティング支援。日本語最適化＋ローカルLLMプライベートモード。
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-xl border border-neutral-200 p-5 transition hover:border-brand hover:shadow-sm dark:border-neutral-800"
          >
            <h2 className="font-semibold text-brand">{f.title}</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {f.desc}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
