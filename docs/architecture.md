# Kakeru アーキテクチャ

## 設計方針

- **Web優先 / 1コードベース** — Next.js を基盤に、低スペックPC・スマホ・iPad を PWA でカバー。将来 Tauri(デスクトップ) / Capacitor(モバイル) を後付け。
- **プロバイダ抽象化** — LLM・画像生成は共通インターフェースで切替（OpenAI / Anthropic / Ollama / LM Studio）。
- **ローカルLLM = 別マシン接続方式** — 端末本体で大型モデルを動かさず、Ollama/LM Studio サーバへAPI接続。端末スペックに非依存でプライベートモードを実現。

## 推奨フォルダ構成（Next.js App Router）

```
kakeru/
├── .github/workflows/        # CI（build / lint / typecheck）
├── public/                   # 静的アセット, manifest.json(PWA), icons
├── src/
│   ├── app/                  # App Router（pages, layouts, route handlers）
│   │   ├── api/              # サーバ側API（LLM/画像/Supabase中継）
│   │   │   ├── draft/        # ドラフト生成エンドポイント
│   │   │   ├── image/        # サムネ生成
│   │   │   └── tokens/       # トークンコスト計算
│   │   ├── (draft)/          # ドラフト生成画面
│   │   ├── (thumbnail)/      # サムネ生成画面
│   │   └── (dashboard)/      # 簡易分析ダッシュボード
│   ├── components/           # UIコンポーネント
│   ├── features/
│   │   ├── draft/            # ドラフト生成ロジック
│   │   ├── japanese-opt/     # 日本語最適化・language tax対策
│   │   ├── image-gen/        # 画像生成
│   │   ├── local-llm/        # Ollama/LM Studio 連携
│   │   ├── posting/          # X投稿ドラフト・スケジュール
│   │   └── analytics/        # 簡易分析
│   ├── lib/
│   │   ├── llm/              # プロバイダ抽象（provider切替）
│   │   ├── tokens/           # トークン計測（gpt-tokenizer）
│   │   └── supabase/         # クライアント/サーバ
│   ├── store/                # Zustand ストア
│   └── types/                # 共通型
├── prompts/                  # プロンプトテンプレート（JSON/MD）
├── docs/                     # ドキュメント
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## データフロー（ドラフト生成）

```
ユーザー入力(トピック/媒体/参考リンク)
   ↓
[src/app/api/draft]  プロンプト構築（prompts/ テンプレ適用）
   ↓
[lib/llm] provider切替 → OpenAI / Anthropic / Ollama / LM Studio
   ↓
日本語最適化レイヤー（features/japanese-opt）
   ↓
[lib/tokens] トークンコスト計測 → 英語比倍率を可視化
   ↓
Markdownドラフト + コスト情報を返却 → UI表示/編集
```

## プロバイダ抽象インターフェース（方針）

```ts
interface LLMProvider {
  name: 'openai' | 'anthropic' | 'ollama' | 'lmstudio';
  generate(input: {
    system: string;
    prompt: string;
    model: string;
    temperature?: number;
  }): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }>;
}
```

プライベートモード時は `ollama` / `lmstudio` を選択し、外部送信を行わない。
