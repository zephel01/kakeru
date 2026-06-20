import type { ThumbnailRequest, ThumbnailResponse } from "@/types";

type ImageProvider = "replicate" | "fal" | "local_sd" | "none";

/**
 * サムネイル生成（スタブ）。
 * IMAGE_PROVIDER に応じて実プロバイダ呼び出しへ差し替える。
 * 現状は none の場合プレースホルダ URL を返す。
 */
export async function generateThumbnail(
  req: ThumbnailRequest,
): Promise<ThumbnailResponse> {
  const provider = (process.env.IMAGE_PROVIDER as ImageProvider) ?? "none";
  const variations = req.variations ?? 3;

  if (provider === "none") {
    return {
      provider,
      images: Array.from({ length: variations }, (_, i) => ({
        url: `https://placehold.co/1200x630?text=Kakeru+${i + 1}`,
        prompt: req.prompt,
      })),
    };
  }

  // TODO: replicate / fal / local_sd の実呼び出しを実装
  throw new Error(`Image provider not implemented yet: ${provider}`);
}
