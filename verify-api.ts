
import { marketService } from './lib/market-data-service';

async function testScan() {
    console.log("Testing 0DTE Scan for SPX...");
    try {
        const results = await marketService.get0DTEScan("SPX");
        console.log(`Found ${results.length} opportunities.`);
        if (results.length > 0) {
            console.log("First result:", JSON.stringify(results[0], null, 2));
        }
    } catch (error) {
        console.error("Scan test failed:", error);
    }
}

async function testNews() {
    console.log("\nTesting Market Activity...");
    try {
        const results = await marketService.getMarketActivity();
        console.log(`Found ${results.length} news items.`);
    } catch (error) {
        console.error("News test failed:", error);
    }
}

async function runTests() {
    await testScan();
    await testNews();
}

runTests();
