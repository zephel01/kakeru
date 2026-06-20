import Link from "next/link";

const steps = [
  {
    n: 1,
    title: "「作るもの」を選ぶ",
    body: "SNS投稿文・メニュー表の文面・チラシの文面から、今ほしいものを選びます。ボタンを押すだけです。",
  },
  {
    n: 2,
    title: "「お店の種類」を選ぶ",
    body: "マッサージ・美容院・飲食店など、あなたのお店に近いものを選びます。当てはまるものがなければ「その他」で自由に入力できます。",
  },
  {
    n: 3,
    title: "かんたんな質問に答える",
    body: "お店の名前やメニューなど、いくつかの欄を埋めます。入力例が薄く表示されるので、まねして書けば大丈夫。* がついた欄だけ必須です。",
  },
  {
    n: 4,
    title: "「文章を作る」を押す",
    body: "数秒〜十数秒で文章ができあがります。作成中は経過時間と文字数が出るので、止まっていないか分かります。",
  },
  {
    n: 5,
    title: "コピーして使う",
    body: "できた文章は「コピー」ボタンでまるごとコピーできます。InstagramやLINE、印刷の原稿に貼り付けて使ってください。",
  },
];

const tips = [
  "うまくいかないときは、「くわしい内容」をもう少し具体的に書くと良くなります。",
  "作ったものは自動で「これまでに作ったもの」に保存されます（この端末のブラウザの中だけ）。クリックするといつでも見直せます。",
  "AIが作った文章は、そのまま使う前にかならず一度ご自身で読んで、事実とちがう点や言いすぎがないか確認してください。",
  "とくにマッサージ・美容・飲食では、「必ず治る」「絶対やせる」のような言い切りは避けましょう（法律で禁止されている表現があります）。",
];

export default function ShopGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/shop" className="text-sm text-brand hover:underline">
        ← お店モードにもどる
      </Link>
      <h1 className="mt-3 text-2xl font-bold">使い方ガイド</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        スマホとこのページだけで、お店の発信文がその場で作れます。順番にやってみましょう。
      </p>

      <ol className="mt-8 space-y-5">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {s.n}
            </span>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h2 className="text-lg font-bold">🎨 画像をつくりたいときは</h2>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          「画像のプロンプト」を選ぶと、画像生成AI（ChatGPTなど）に貼り付けるための
          <strong>指示文（プロンプト）</strong>を作れます。プロンプトを書いたことがなくても大丈夫です。
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          <li>「画像のプロンプト」を選び、雰囲気などを入力して作成</li>
          <li>「🎨 プロンプトだけコピー」を押す</li>
          <li>
            ChatGPT（無料の Microsoft Copilot や Google Gemini でもOK）を開いて貼り付け、送信
          </li>
          <li>出てきた画像を保存する</li>
          <li>そこに、さきほど作ったSNS文やメニュー文を重ねて完成</li>
        </ol>
        <p className="mt-3 text-xs text-neutral-500">
          ※ 画像の中の文字はAIが苦手なので、文字は入れずに「背景・雰囲気」だけ作るのがコツです。文字はあとから載せましょう。
        </p>
      </div>

      <h2 className="mt-12 text-lg font-bold">うまく使うコツ・注意</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <div className="mt-12">
        <Link
          href="/shop"
          className="inline-block rounded-md bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          さっそく作ってみる →
        </Link>
      </div>
    </main>
  );
}
