export interface ShopField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  example?: string;
  options?: string[];
  required?: boolean;
  /** 初期値（プリセット） */
  default?: string;
  /** ワンタップで追加できる候補（text/textarea向け） */
  presets?: string[];
}

export interface ShopAction {
  id: string; // = テンプレートID
  title: string;
  emoji: string;
  desc: string;
  fields: ShopField[];
}

/** 業種（選択式＋その他は自由入力） */
export const GYOSHU_OPTIONS = [
  "マッサージ・整体",
  "美容院・ヘアサロン",
  "ネイル・まつげ",
  "エステ・リラクゼーション",
  "飲食店・カフェ",
  "その他",
] as const;

export const SHOP_ACTIONS: ShopAction[] = [
  {
    id: "sns-post",
    title: "SNS投稿文",
    emoji: "📱",
    desc: "Instagram・LINE・X に載せる投稿文を作ります",
    fields: [
      {
        name: "shop_name",
        label: "お店の名前",
        type: "text",
        example: "例: ほぐし処 やすらぎ",
        required: true,
      },
      {
        name: "channel",
        label: "どこに投稿する？",
        type: "select",
        options: ["Instagram", "LINE公式", "X(旧Twitter)"],
        required: true,
      },
      {
        name: "purpose",
        label: "今回伝えたいこと",
        type: "text",
        example: "例: 新メニューのお知らせ／今月のキャンペーン／予約のお願い",
        required: true,
      },
      {
        name: "details",
        label: "くわしい内容",
        type: "textarea",
        example:
          "例: 肩こり向けの新しい60分コースを始めました。今月は初回10%オフです。",
        required: true,
      },
      {
        name: "tone",
        label: "雰囲気",
        type: "select",
        options: ["やさしい", "元気", "上品", "カジュアル"],
      },
    ],
  },
  {
    id: "menu-copy",
    title: "メニュー表の文面",
    emoji: "📋",
    desc: "メニューの説明文・キャッチを作ります",
    fields: [
      {
        name: "item_name",
        label: "メニューの名前",
        type: "text",
        example: "例: 全身もみほぐし60分",
        required: true,
      },
      {
        name: "details",
        label: "内容（時間・施術・素材など／タップで追加できます）",
        type: "textarea",
        example: "例: 肩・腰・脚を中心に全身をゆっくりほぐします。所要60分。",
        required: true,
        presets: [
          "所要30分",
          "所要60分",
          "所要90分",
          "完全予約制",
          "個室あり",
          "初めての方向け",
          "国産素材",
          "無添加",
        ],
      },
      {
        name: "price",
        label: "値段（任意）",
        type: "text",
        example: "例: 5,500円",
      },
      {
        name: "appeal",
        label: "おすすめポイント（タップで追加できます）",
        type: "text",
        example: "例: デスクワークで疲れた方に人気です",
        presets: [
          "初めての方に人気",
          "リピーター多数",
          "季節限定",
          "数量限定",
          "ゆったり過ごせる",
          "お子さま連れOK",
        ],
      },
    ],
  },
  {
    id: "flyer-copy",
    title: "チラシの文面",
    emoji: "📄",
    desc: "チラシのキャッチコピーと本文を作ります",
    fields: [
      {
        name: "purpose",
        label: "チラシの目的",
        type: "select",
        options: [
          "新規オープン",
          "季節のキャンペーン",
          "再来店のお誘い",
          "その他",
        ],
        required: true,
        default: "新規オープン",
      },
      {
        name: "offer",
        label: "特典・お得な内容（タップで追加できます）",
        type: "text",
        example: "例: 初回の方は20%オフ",
        required: true,
        presets: [
          "初回20%オフ",
          "ドリンク1杯サービス",
          "ご紹介で500円オフ",
          "期間限定価格",
          "次回使える割引券",
          "ポイント2倍",
        ],
      },
      {
        name: "target",
        label: "来てほしい人（タップで追加できます）",
        type: "text",
        example: "例: 近所にお住まいで肩こりにお悩みの方",
        presets: [
          "近所にお住まいの方",
          "お仕事帰りの方",
          "はじめての方",
          "ご家族・お友達と",
          "疲れがたまっている方",
          "平日昼間に来られる方",
        ],
      },
      {
        name: "info",
        label: "お店の基本情報（任意／タップで項目を追加）",
        type: "textarea",
        example: "例: 店名／住所／電話／営業時間 10:00-20:00",
        default: "店名、住所、電話番号、営業時間、定休日",
        presets: [
          "店名",
          "住所",
          "電話番号",
          "営業時間",
          "定休日",
          "地図・QRコード",
          "Instagram",
          "駐車場あり",
        ],
      },
    ],
  },
  {
    id: "image-prompt",
    title: "画像のプロンプト",
    emoji: "🎨",
    desc: "ChatGPT等で画像を作るための「指示文」を作ります",
    fields: [
      {
        name: "purpose",
        label: "どんな画像に使う？",
        type: "select",
        options: [
          "SNS投稿（正方形）",
          "SNSストーリー（縦長）",
          "チラシの背景",
          "メニューの背景",
          "ロゴ風のアイコン",
        ],
        required: true,
        default: "SNS投稿（正方形）",
      },
      {
        name: "people",
        label: "人物の写り方",
        type: "select",
        options: ["背景のみ（人物なし）", "後ろ姿・手元だけ", "人物あり"],
        required: true,
        default: "背景のみ（人物なし）",
      },
      {
        name: "atmosphere",
        label: "入れたい雰囲気・要素（タップで追加できます）",
        type: "textarea",
        example: "例: 清潔感、やわらかい自然光、ベージュ系の色",
        required: true,
        presets: [
          "清潔感",
          "やわらかい自然光",
          "ナチュラル",
          "木目とグリーン",
          "観葉植物",
          "高級感",
          "あたたかい雰囲気",
          "ベージュ・白基調",
          "ミニマル",
          "落ち着いた色味",
        ],
      },
      {
        name: "avoid",
        label: "入れたくないもの",
        type: "text",
        example: "例: 文字、ロゴ、人物の顔、ごちゃごちゃした背景",
        default: "文字、ロゴ、人物の顔、ごちゃごちゃした背景",
        presets: ["文字", "ロゴ", "人物の顔", "ごちゃごちゃした背景", "強い影"],
      },
    ],
  },
];

export function getAction(id: string): ShopAction | undefined {
  return SHOP_ACTIONS.find((a) => a.id === id);
}
