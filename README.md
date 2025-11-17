# Near Contract

Contract is NEP-141 (like ERC20)<br>
deposit function takes Near and gives back x1000 Token (ICO alike)

## Preview
Near Contract on testnet: <a href=https://testnet.nearblocks.io/address/rice-ten.testnet>NearBlocks.io</a><br>
Interact with Contract: <a href=https://near-sc.vercel.app>near-sc.vercel.app</a>


## 🏗️ Build

Build the Near Contract:
```bash
cargo near deploy
```
Go to frontend/src/config.ts then change the rice-ten.testnet to yours.
<br>Change ABI: frontend/src/hello_near.tsx

Frontend is built with: React + Vite

## 🚀 Development

Install dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
npm run dev
```



## 📜 License

MIT
