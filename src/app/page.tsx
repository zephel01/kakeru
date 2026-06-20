import Link from "next/link";

const proFeatures = [
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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Kakeru ✍️</h1>
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">
        AIで文章づくりをかんたんに。お店の発信から技術記事まで。
      </p>

      {/* お店オーナー向け（かんたんモード） */}
      <Link
        href="/shop"
        className="mt-10 block rounded-2xl border-2 border-brand bg-brand/5 p-6 transition hover:shadow-md"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-brand">
          🏪 お店オーナーの方はこちら
        </div>
        <h2 className="mt-2 text-2xl font-bold">お店モード（かんたん）</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          3つの質問に答えるだけで、SNS投稿文・メニュー文・チラシ文がその場で作れます。むずかしい知識はいりません。スマホだけでOK。
        </p>
        <span className="mt-3 inline-block text-sm font-medium text-brand">
          さっそく作る →
        </span>
      </Link>

      {/* 技術ライター向け */}
      <h3 className="mt-12 text-sm font-semibold text-neutral-500">
        技術ライター向け（Zenn / note / X）
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {proFeatures.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-xl border border-neutral-200 p-5 transition hover:border-brand hover:shadow-sm dark:border-neutral-800"
          >
            <h4 className="font-semibold text-brand">{f.title}</h4>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {f.desc}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
