# 🚉 Tetsundo - エクササイズ × 全国鉄道制覇ゲーム

## プロジェクト概要
YouTubeのエクササイズ動画を実施するごとに日本全国の鉄道路線を1駅ずつ進み、すべての鉄道路線を制覇することを目指す運動継続支援型のWebゲームです。

## 対象ユーザー
- 年齢：20代男性
- 運動習慣の継続を目的とする
- 鉄道、旅行、地図、乗り鉄に興味がある

## 主要機能
1. **全国鉄道路線マップ機能**
   - JR・私鉄・第三セクター全路線の地図表示
   - 進捗の色分け表示
   - 駅情報ツールチップ

2. **エクササイズ進捗記録（YouTube API）**
   - YouTube iframe APIによる埋め込み再生
   - 再生率80%以上で完了判定
   - 完了時に1駅進行

3. **マイページ／進捗ダッシュボード**
   - 現在位置と全路線進捗表示
   - 運動履歴カレンダー
   - 累積情報とバッジ表示

4. **Slack共有機能**
   - Incoming Webhook方式
   - ユーザー操作トリガーによる投稿

## 技術スタック

### フロントエンド
- React (Next.js)
- Tailwind CSS
- Mapbox GL JS または Leaflet.js

### バックエンド
- Ruby on Rails または Go
- PostgreSQL + PostGIS

### 外部API・サービス
- YouTube iframe API
- Firebase Auth または Devise（Rails）
- Slack Incoming Webhook

### デプロイ
- Vercel（フロント）
- Fly.io／Railway（バックエンド）

## 開発コマンド

### セットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local

# データベースのセットアップ
npm run db:setup
```

### 開発環境
```bash
# 開発サーバーの起動
npm run dev

# フロントエンドとバックエンドを同時起動
npm run dev:full
```

### テスト
```bash
# テストの実行
npm run test

# テストのウォッチモード
npm run test:watch

# E2Eテスト
npm run test:e2e
```

### ビルド・デプロイ
```bash
# プロダクションビルド
npm run build

# 型チェック
npm run typecheck

# リント
npm run lint

# フォーマット
npm run format
```

## 環境変数

### 必須設定
- `YOUTUBE_API_KEY` - YouTube Data API v3のキー
- `MAPBOX_ACCESS_TOKEN` - Mapbox GL JSのアクセストークン
- `DATABASE_URL` - PostgreSQLデータベースURL
- `FIREBASE_CONFIG` - Firebase認証設定

### オプション設定
- `SLACK_WEBHOOK_URL` - Slack Incoming Webhook URL（ユーザー設定）

## データベース構成

### 主要テーブル
- `users` - ユーザー情報
- `railway_lines` - 鉄道路線マスタ
- `stations` - 駅マスタ
- `user_progress` - ユーザーの進捗状況
- `exercise_logs` - エクササイズ実施履歴

## ゲームルール

### 基本ルール
- エクササイズ動画1本完了につき1駅進む
- 現在地や進捗は地図上に表示
- 日本全国すべての鉄道路線制覇でゲームクリア

### 判定条件
- YouTube動画の再生率が80%以上で「完了」と判定
- 完了時に現在の路線上で1駅進行

## Slack共有機能

### 投稿フォーマット例
```
🚶‍♂️ 今日の運動報告 🚃
路線：京王線
進行：笹塚 → 代田橋
累積：31駅制覇！
動画：https://youtu.be/example
#運動記録 #鉄道チャレンジ
```

## 将来的な拡張アイデア
- 他ユーザーとの進捗比較（フレンド機能）
- ランキング表示（駅数、継続日数など）
- 駅ごとの地元紹介（写真／観光／豆知識）
- エクササイズの強度に応じた駅進行量設定

## 開発ガイドライン

### コーディング規約
- TypeScriptを使用し、厳密な型定義を行う
- ESLint + Prettierによるコード品質管理
- コンポーネントの単体テストを必須とする

### Git運用
- main: プロダクション環境
- develop: 開発環境
- feature/*: 機能開発ブランチ

### デプロイフロー
1. feature → develop（PR・レビュー）
2. develop → main（PR・レビュー・テスト）
3. main → 自動デプロイ