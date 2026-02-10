import { restClient } from '@massive.com/client-js'

export interface TradeOpportunity {
    id: string
    ticker: string
    type: "CALL" | "PUT"
    strike: number
    price: number
    bid?: number
    ask?: number
    lastTradeTime?: string
    expirationDate: string
    isRealData: boolean
    gammaScore: number
    expMove: string
    conviction: "High" | "Medium" | "Low"
}

// Realistic Mock Data for when API fails or is restricted
const MOCK_OPPORTUNITIES: TradeOpportunity[] = [
    { id: "1", ticker: "SPX", type: "CALL", strike: 5000, price: 2.45, bid: 2.40, ask: 2.50, lastTradeTime: "10:30:05", expirationDate: "2026-02-10", isRealData: false, gammaScore: 92, expMove: "+0.8%", conviction: "High" },
    { id: "2", ticker: "QQQ", type: "PUT", strike: 430, price: 0.85, bid: 0.80, ask: 0.90, lastTradeTime: "10:31:12", expirationDate: "2026-02-10", isRealData: false, gammaScore: 88, expMove: "-1.2%", conviction: "High" },
    { id: "3", ticker: "TSLA", type: "CALL", strike: 425, price: 1.10, bid: 1.05, ask: 1.15, lastTradeTime: "10:32:45", expirationDate: "2026-02-10", isRealData: false, gammaScore: 75, expMove: "+2.5%", conviction: "Medium" },
    { id: "4", ticker: "IWM", type: "PUT", strike: 200, price: 0.45, bid: 0.40, ask: 0.50, lastTradeTime: "10:29:30", expirationDate: "2026-02-10", isRealData: false, gammaScore: 60, expMove: "-0.5%", conviction: "Low" },
    { id: "5", ticker: "NVDA", type: "CALL", strike: 700, price: 5.20, bid: 5.10, ask: 5.30, lastTradeTime: "10:33:00", expirationDate: "2026-02-10", isRealData: false, gammaScore: 85, expMove: "+1.8%", conviction: "Medium" },
    { id: "6", ticker: "SPY", type: "PUT", strike: 500, price: 0.15, bid: 0.10, ask: 0.20, lastTradeTime: "10:28:15", expirationDate: "2026-02-10", isRealData: false, gammaScore: 95, expMove: "-0.9%", conviction: "High" },
]

export class MarketDataService {
    private client: any

    constructor() {
        const apiKey = process.env.POLYGON_API_KEY
        this.client = apiKey ? restClient(apiKey, 'https://api.massive.com') : null
    }

    async get0DTEScan(ticker: string = "SPX"): Promise<TradeOpportunity[]> {
        const requireReal = process.env.REQUIRE_REAL_DATA === "true"

        if (!this.client) {
            console.warn("No Massive API Client initialized")
            return requireReal ? [] : this.mockScan(ticker)
        }

        try {
            const underlying = ticker === "ALL" ? "SPX" : ticker
            const today = new Date().toISOString().split('T')[0]

            try {
                // Step 1: Attempt to get Snapshot for Today
                let response = await this.client.getOptionsChain({
                    underlyingAsset: underlying,
                    expirationDate: today,
                    limit: 100
                })

                let targetDate = today

                // Step 2: If empty, find the next available expiration
                if (!response.results || response.results.length === 0) {
                    console.log(`No 0DTE results for ${underlying} today. Searching for next available expiration...`)

                    const contracts = await this.client.listOptionsContracts({
                        underlying_ticker: underlying,
                    })

                    if (contracts.results && contracts.results.length > 0) {
                        // Find the first expiration date after today
                        const futureContract = contracts.results.find((c: any) => c.expiration_date > today)
                        if (futureContract) {
                            targetDate = futureContract.expiration_date
                            console.log(`Found next expiration for ${underlying}: ${targetDate}`)

                            response = await this.client.getOptionsChain({
                                underlyingAsset: underlying,
                                expirationDate: targetDate,
                                limit: 100
                            })
                        }
                    }
                }

                if (response.results && response.results.length > 0) {
                    return response.results.map((contract: any) => this.mapContractToOpportunity(contract, underlying, targetDate))
                        .filter((o: any) => o.price > 0.05)
                        .map((o: any) => this.enrichWithSmartScore(o))
                        .sort((a: any, b: any) => b.gammaScore - a.gammaScore)
                        .slice(0, 50)
                }

                return []
            } catch (snapError: any) {
                if (snapError.response?.status === 403) {
                    console.error("403 Forbidden: Entitlement error for Options Snapshot.")
                    return requireReal ? [] : this.mockScan(ticker)
                }
                console.error("Snapshot error:", snapError.message)
                return []
            }
        } catch (error) {
            console.error("Failed to fetch data from Massive:", error)
            return []
        }
    }

    private mapContractToOpportunity(contract: any, underlying: string, expirationDate: string): TradeOpportunity {
        const greeks = contract.greeks || {}
        const price = contract.last_trade?.price || contract.day?.close || 0
        const strike = contract.details?.strike_price || 0
        const lastQuote = contract.last_quote || {}
        const lastTrade = contract.last_trade || {}

        return {
            id: contract.details?.contract_type + strike,
            ticker: underlying,
            type: contract.details?.contract_type?.toUpperCase() || "CALL",
            strike,
            price,
            bid: lastQuote.bid,
            ask: lastQuote.ask,
            lastTradeTime: lastTrade.time_unix_milli ? new Date(lastTrade.time_unix_milli).toLocaleTimeString() : undefined,
            expirationDate,
            isRealData: true,
            gammaScore: Math.min(100, Math.round(Math.abs(greeks.gamma || 0) * 5000)),
            expMove: greeks.delta ? `${(greeks.delta * 100).toFixed(1)}%` : "0%",
            conviction: "Low"
        }
    }

    private mockScan(ticker: string): TradeOpportunity[] {
        return MOCK_OPPORTUNITIES
            .filter(t => t.ticker === ticker || ticker === "ALL")
            .map(opportunity => this.enrichWithSmartScore(opportunity))
            .sort((a, b) => b.gammaScore - a.gammaScore)
    }

    private enrichWithSmartScore(opportunity: TradeOpportunity): TradeOpportunity {
        const volatility = (Math.random() * 10) - 5
        let newScore = Math.max(0, Math.min(100, opportunity.gammaScore + volatility))

        let conviction: "High" | "Medium" | "Low" = "Low"
        if (newScore > 80) conviction = "High"
        else if (newScore > 50) conviction = "Medium"

        return {
            ...opportunity,
            gammaScore: Math.round(newScore),
            conviction
        }
    }
}

export const marketService = new MarketDataService()
