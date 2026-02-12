import { NextResponse } from 'next/server';
import { marketService } from '@/lib/market-data-service';

export async function GET() {
    try {
        const data = await marketService.getMarketActivity();

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: unknown) {
        console.error("API Route Error (market-activity):", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch market activity";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
