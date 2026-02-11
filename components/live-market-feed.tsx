"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { type MarketEvent } from "@/lib/market-data-service"

export function LiveMarketFeed() {
    const [events, setEvents] = useState<MarketEvent[]>([])
    const [loading, setLoading] = useState(true)

    const fetchActivity = async () => {
        try {
            const res = await fetch('/api/market-activity')
            const data = await res.json()
            if (data.success) {
                setEvents(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch market activity", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivity()
        const interval = setInterval(fetchActivity, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 px-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Market Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[500px] px-6">
                    <div className="flex flex-col gap-4 pb-6">
                        {loading && events.length === 0 ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-muted rounded w-full animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            events.map((event) => (
                                <div key={event.id} className="flex gap-3 items-start border-b border-primary/5 pb-3 last:border-0 hover:bg-muted/30 transition-colors p-2 rounded-lg -mx-2">
                                    <div className="flex flex-col items-center gap-1 min-w-[70px]">
                                        <span className="text-[10px] text-muted-foreground font-mono">{event.time}</span>
                                        <Badge variant="secondary" className="text-[9px] px-1 h-4 font-bold bg-primary/10 text-primary border-0">{event.ticker}</Badge>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-semibold leading-tight line-clamp-2">
                                            {event.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {event.type === "VOLUME" && <TrendingUp className="h-3 w-3 text-blue-500" />}
                                            {event.type === "IV" && <Zap className="h-3 w-3 text-yellow-500" />}
                                            {event.type === "NEWS" && <AlertCircle className="h-3 w-3 text-red-500" />}
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{event.type}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {!loading && events.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm italic">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
