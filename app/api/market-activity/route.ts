import { NextResponse } from 'next/server';
import { marketService } from '@/lib/market-data-service';

export async function GET() {
    try {
        const data = await marketService.getMarketActivity();

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error("API Route Error (market-activity):", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
