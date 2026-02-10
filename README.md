# 0DTE Options Scanner

A real-time dashboard for scanning and analyzing Zero-Days-to-Expiration (0DTE) options contracts. Designed for high-speed analysis of gamma exposure and market opportunities.

## 🚀 Features

- **Live Market Integration**: Powered by [Massive.com](https://massive.com) for professional-grade market data.
- **Smart Score**: A proprietary ranking system based on Gamma, Price, and Bid/Ask spreads.
- **Intelligent Expiry Search**: Automatically falls back to the nearest future expiration if no contracts expire today.
- **Data Transparency**: Clear visual indicators (LIVE vs MOCK) to ensure data integrity.
- **Ticker Selection**: Easily switch between SPX, SPY, TSLA, NVDA, and more.
- **Responsive Profile Controls**: Customize risk tolerance and strategy bias on the fly.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **API Client**: `@massive.com/client-js`
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (Latest LTS recommended)
- A [Massive.com](https://massive.com) API Key

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```bash
POLYGON_API_KEY=your_massive_api_key_here
REQUIRE_REAL_DATA=false # Set to true to disable mock fallbacks
```

### 3. Installation
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the scanner.

## 📊 How it Works

The scanner uses the `/api/scan` endpoint to fetch real-time option snapshots. 
- It prioritizes contracts expiring on the **current date**.
- If none exist, it searches the contract list for the **earliest future expiration**.
- Opportunities are ranked by **Smart Score**, which normalizes key Greeks into a 0-100 scale.

## ⚖️ License
MIT