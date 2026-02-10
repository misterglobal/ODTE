"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, Zap } from "lucide-react"

interface MarketEvent {
    id: string
    time: string
    ticker: string
    message: string
    type: "VOLUME" | "NEWS" | "IV"
}

const MOCK_EVENTS: MarketEvent[] = [
    { id: "1", time: "10:32:15", ticker: "SPX", message: "Huge call sweep at 4850 strike", type: "VOLUME" },
    { id: "2", time: "10:31:45", ticker: "TSLA", message: "IV Spike > 50% percentile", type: "IV" },
    { id: "3", time: "10:30:20", ticker: "QQQ", message: "Breaking above VWAP", type: "NEWS" },
    { id: "4", time: "10:29:10", ticker: "AMD", message: "Put volume increasing rapidly", type: "VOLUME" },
    { id: "5", time: "10:28:05", ticker: "SPY", message: "Gamma flip level approached", type: "IV" },
    { id: "6", time: "10:27:00", ticker: "META", message: "Block trade 5000 contracts", type: "VOLUME" },
]

export function LiveMarketFeed() {
    return (
        <Card className="h-full max-h-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Market Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] px-6">
                    <div className="flex flex-col gap-4 pb-6">
                        {MOCK_EVENTS.map((event) => (
                            <div key={event.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                    <span className="text-xs text-muted-foreground font-mono">{event.time}</span>
                                    <Badge variant="outline" className="text-[10px] px-1 h-5">{event.ticker}</Badge>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {event.message}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {event.type === "VOLUME" && <TrendingUp className="h-3 w-3 text-blue-500" />}
                                        {event.type === "IV" && <Zap className="h-3 w-3 text-yellow-500" />}
                                        {event.type === "NEWS" && <AlertCircle className="h-3 w-3 text-red-500" />}
                                        <span className="text-[10px] text-muted-foreground">{event.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
