import { NextResponse } from 'next/server'
import { marketService } from '@/lib/market-data-service'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker') || "ALL"

    try {
        const opportunities = await marketService.get0DTEScan(ticker)
        return NextResponse.json({
            success: true,
            data: opportunities,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Failed to run scan"
        }, { status: 500 })
    }
}
