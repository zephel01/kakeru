import ThumbnailForm from "@/features/image-gen/ThumbnailForm";

export default function ThumbnailPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold">サムネ生成</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        記事要旨から媒体規格に合うサムネを複数バリエーション出力します（現状は
        IMAGE_PROVIDER=none でプレースホルダ表示）。
      </p>
      <div className="mt-8">
        <ThumbnailForm />
      </div>
    </main>
  );
}
