import { restClient } from '@massive.com/client-js';

const apiKey = "S03zJkwu4P_47tC3vxCs2yzZDAxZmo40";

async function debug() {
    try {
        console.log("Initializing client...");
        const rest = restClient(apiKey, 'https://api.massive.com');

        const ticker = 'TSLA';
        const today = '2026-02-10'; // Explicit date match

        console.log(`------------------------------------------`);
        console.log(`Checking getOptionsChain for ${ticker} on ${today}...`);

        try {
            const res = await rest.getOptionsChain({
                underlyingAsset: ticker,
                expirationDate: today,
                limit: 10
            });

            console.log("Status:", res.status);
            console.log("Request ID:", res.request_id);
            console.log("Results Length:", res.results?.length || 0);

            if (res.results && res.results.length > 0) {
                console.log("First Result:", JSON.stringify(res.results[0], null, 2));
            } else {
                console.log("No results for this expiration today.");

                // If 0DTE yields nothing, let's see what IS available for TSLA
                console.log("------------------------------------------");
                console.log("Listing some contracts for TSLA to see valid expirations...");
                const list = await rest.listOptionsContracts({
                    underlying_ticker: ticker,
                    limit: 5
                });
                console.log("Recent Contracts Expirations:", list.results?.map(r => r.expiration_date));
            }
        } catch (e) {
            console.log("Error:", e.message);
            if (e.response) console.log("Response Data:", e.response.data);
        }

    } catch (e) {
        console.error("Critical Error:", e);
    }
}

debug();
