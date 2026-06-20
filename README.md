# Kakeru ✍️

> AIコンテンツ作成補助ツール — Zenn / note / X 特化。日本語最適化（language tax対策）＋ ローカルLLMプライベートモード。

Kakeruは、技術系クリエイターのライティングワークフローを一気通貫で支援するツールです。トピックを入力するだけでZenn/noteスタイルのドラフトを生成し、日本語のトークン効率を最適化、サムネイル生成やX投稿ドラフトまでサポートします。プライベートな下書きは**ローカルLLM（Ollama / LM Studio）にAPI接続**して処理でき、クラウドに上げずに執筆できます。

## 主な特徴

- **ドラフト生成エンジン** — トピック/キーワード/参考リンクから、見出し・コードブロック・引用を最適化したMarkdownドラフトを生成。媒体別スタイル（Zenn / note / X）に対応。
- **日本語最適化レイヤー** — 英語高品質生成→自然な日本語化、またはローカル日本語モデル直接利用。トークン消費を可視化（英語比のコスト倍率表示）。
- **ローカルLLMプライベートモード** — Ollama / LM Studio に接続し、未公開・有料ドラフトをクラウドに出さず処理。クラウドモデルとのハイブリッド運用も可能。
- **サムネイル生成** — 記事内容から自動でプロンプト生成→媒体規格に合うサムネを複数バリエーション出力。
- **投稿支援＆簡易分析** — X投稿ドラフト＋スケジュール提案、簡易PV/反応予測。

## 対応プラットフォーム

Web優先設計。1コードベースで以下をカバーします。

| 端末 | 提供方法 |
|---|---|
| 低スペックPC / デスクトップ | ブラウザ（軽量）／ Tauri デスクトップアプリ（将来） |
| スマホ / iPad | PWA（インストール風）／ Capacitor ネイティブ化（将来） |

ローカルLLMは端末本体ではなく、別マシンのOllama/LM StudioにAPI接続する方式のため、**端末スペックに縛られず**プライベートモードを利用できます。

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS
- **状態管理**: Zustand
- **AI連携**: OpenAI / Anthropic / Ollama / LM Studio（プロバイダ切替式）
- **画像生成**: ローカル Stable Diffusion / Replicate・Fal.ai 系API
- **バックエンド/DB**: Supabase（認証・DB・ストレージ）
- **デスクトップ化（将来）**: Tauri
- **モバイル化（将来）**: PWA → Capacitor

## クイックスタート

```bash
# 依存関係インストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集（LLMプロバイダ・APIキー等）

# 開発サーバ起動
npm run dev
# http://localhost:3000
```

### ローカルLLMを使う場合（プライベートモード）

```bash
# 例: Ollama を起動し、日本語強化モデルを用意
ollama pull qwen2.5:7b
ollama serve
# .env.local で LLM_PROVIDER=ollama, OLLAMA_BASE_URL=http://127.0.0.1:11434 を設定
```

## ロードマップ

- **Month 1** — コアドラフト生成 + 日本語最適化プロンプト
- **Month 2** — 画像生成統合 + ローカルLLM接続
- **Month 3** — MVPリリース（Web/PWA）
- **Month 4+** — フィードバック反映 + 有料プラン + Tauri/Capacitor展開

## ライセンス

[MIT](./LICENSE)
