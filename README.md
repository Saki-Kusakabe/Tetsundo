# 🚉 Tetsundo - エクササイズ × 全国鉄道制覇ゲーム

YouTubeのエクササイズ動画を実施するごとに日本全国の鉄道路線を1駅ずつ進み、すべての鉄道路線を制覇することを目指す運動継続支援型のWebゲームです。

## 主な機能

- 全国鉄道路線マップ機能（JR・私鉄・第三セクター全路線の地図表示）
- エクササイズ進捗記録（YouTube API連携）
- マイページ／進捗ダッシュボード
- Slack共有機能

## 技術スタック

- フロントエンド: React (Next.js), Tailwind CSS, Mapbox GL JS
- バックエンド: Ruby on Rails または Go
- データベース: PostgreSQL + PostGIS
- 外部API: YouTube iframe API, Firebase Auth
- デプロイ: Vercel（フロント）, Fly.io／Railway（バックエンド）

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local

# 開発サーバーの起動
npm run dev
```

## 環境変数

### 必須設定
- `YOUTUBE_API_KEY` - YouTube Data API v3のキー
- `MAPBOX_ACCESS_TOKEN` - Mapbox GL JSのアクセストークン
- `DATABASE_URL` - PostgreSQLデータベースURL
- `FIREBASE_CONFIG` - Firebase認証設定

## ライセンス

MIT License

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
