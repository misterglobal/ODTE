"use client"

import { UserProfileForm } from "@/components/user-profile-form"
import { ScannerResults } from "@/components/scanner-results"
import { Watchlist } from "@/components/watchlist"
import { LiveMarketFeed } from "@/components/live-market-feed"
import { OptionsAiAssistant } from "@/components/options-ai-assistant"
import { useState } from "react"
import type { TradeOpportunity } from "@/lib/watchlist-store"

export default function Home() {
  const [ticker, setTicker] = useState("SPX")
  const [selectedContract, setSelectedContract] = useState<TradeOpportunity | null>(null)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
              0
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">0DTE Scanner</h1>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Dashboard</a>
            <a href="#" className="hover:text-foreground transition-colors">History</a>
            <a href="#" className="hover:text-foreground transition-colors">Settings</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Feed (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <UserProfileForm onUpdate={(vals) => setTicker(vals.preferredTicker)} />
          <LiveMarketFeed />
        </div>

        {/* Right Column: Main Scanner (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Market Dashboard - {ticker}</h2>
              <p className="text-muted-foreground">Real-time analysis of zero-days-to-expiration options.</p>
            </div>
          </div>

          <ScannerResults ticker={ticker} onSelectContract={setSelectedContract} />

          <OptionsAiAssistant selectedContract={selectedContract} />

          <Watchlist />

          {/* Placeholder for Chart or P&L Graph */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[200px] bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
              Gamma Exposure Chart (Coming Soon)
            </div>
            <div className="h-[200px] bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
              Theta Decay Sim (Coming Soon)
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
