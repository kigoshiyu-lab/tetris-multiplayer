# Tetris Multiplayer Setup (Netlify + Render)

## 1. Frontend (Netlify)

1. このリポジトリを Netlify にデプロイします（静的サイト）。
2. 配信URLを控えます（例: `https://your-tetris.netlify.app`）。

## 2. WebSocket Server (Render)

1. Render で `multiplayer-server` フォルダを Web Service として作成。
2. Build Command:
   - `npm install`
3. Start Command:
   - `npm start`
4. Root Directory:
   - `multiplayer-server`
5. デプロイ後の URL を確認（例: `https://your-ws-server.onrender.com`）。

### Render URL と WebSocket URL の対応

- Render の `https://...` URL を `wss://...` に読み替えて入力します。
- 例: `https://your-ws-server.onrender.com` -> `wss://your-ws-server.onrender.com`

## 3. ゲーム側の設定

1. ゲーム画面の「対戦モード（試験版）」に WebSocket URL を入力。
2. 同じルームIDを2人で入力して「ルーム参加」。
3. 2人そろうと対戦開始になります。

## 4. 現在の対戦ルール

- ライン消去した数だけ、相手におじゃま行を送信。
- 相手がゲームオーバーすると「あなたの勝ち」表示。

## 5. 注意

- 無料プランではスリープにより初回接続が遅い場合があります。
- まずは家族内テスト向けの最小版です。
