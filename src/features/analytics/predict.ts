/**
 * 簡易分析（PV/反応予測）スタブ。
 * MVP では実測データ不足のためヒューリスティックなスコアを返す。
 * 将来 Supabase の実績データで補正する想定。
 */
export interface EngagementPrediction {
  score: number; // 0-100
  factors: { label: string; impact: number }[];
}

export function predictEngagement(input: {
  title: string;
  body: string;
  hasCode: boolean;
  hasImage: boolean;
}): EngagementPrediction {
  const factors: { label: string; impact: number }[] = [];

  const titleLen = [...input.title].length;
  const titleScore = titleLen >= 20 && titleLen <= 40 ? 25 : 12;
  factors.push({ label: "タイトル長", impact: titleScore });

  const bodyLen = [...input.body].length;
  const bodyScore = bodyLen >= 1500 ? 25 : bodyLen >= 600 ? 18 : 8;
  factors.push({ label: "本文ボリューム", impact: bodyScore });

  const codeScore = input.hasCode ? 25 : 5;
  factors.push({ label: "コード有無", impact: codeScore });

  const imageScore = input.hasImage ? 20 : 8;
  factors.push({ label: "サムネ有無", impact: imageScore });

  const score = Math.min(
    100,
    factors.reduce((s, f) => s + f.impact, 0),
  );

  return { score, factors };
}
