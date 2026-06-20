import Link from "next/link";
import ShopWizard from "@/features/shop/ShopWizard";

export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">お店モード（かんたん）</h1>
        <Link
          href="/shop/guide"
          className="text-sm text-brand hover:underline"
        >
          📖 使い方ガイド
        </Link>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        3ステップの質問に答えるだけ。SNS投稿文・メニュー文・チラシ文を、その場で作れます。むずかしい知識はいりません。
      </p>

      <div className="mt-8">
        <ShopWizard />
      </div>
    </main>
  );
}
