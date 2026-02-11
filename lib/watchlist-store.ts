"use client"

import { useState, useEffect } from "react"

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

const STORAGE_KEY = "0dte_watchlist"

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<TradeOpportunity[]>([])

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse watchlist", e)
            }
        }

        // Listen for changes from other tabs/instances
        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setWatchlist(JSON.parse(e.newValue))
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [])

    const saveToStorage = (newList: TradeOpportunity[]) => {
        setWatchlist(newList)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
        // Dispatch event for other components in same tab
        window.dispatchEvent(new Event("watchlist-updated"))
    }

    // Single-tab sync
    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) setWatchlist(JSON.parse(saved))
        }
        window.addEventListener("watchlist-updated", handleUpdate)
        return () => window.removeEventListener("watchlist-updated", handleUpdate)
    }, [])

    const addToWatchlist = (item: TradeOpportunity) => {
        if (watchlist.some(i => i.id === item.id)) return
        const newList = [...watchlist, item]
        saveToStorage(newList)
    }

    const removeFromWatchlist = (id: string) => {
        const newList = watchlist.filter(i => i.id !== id)
        saveToStorage(newList)
    }

    const clearWatchlist = () => {
        saveToStorage([])
    }

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        clearWatchlist
    }
}
