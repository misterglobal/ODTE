Product Requirements Document: 0DTE Options Scanner App
1. Overview & Objective
Web app that pulls real-time options data from Massive/Polygon.io to scan and rank potential 0DTE trades (entries/exits) tailored to user risk prefs. Goal: Help experienced traders spot high-conviction setups faster than manual screening, focusing on gamma/theta-dominant plays. Success if users find it saves time and surfaces ideas they validate themselves—not if it leads to consistent wins, since markets crush over-optimized suggestions.
2. Target Users & Personas

Primary: Active retail day traders familiar with 0DTE (know greeks, have IBKR/other broker).
Inputs they provide: Risk tolerance (max $ loss/trade or % capital), available capital, preferred tickers/sectors (e.g., SPX, QQQ, high-vol names), strategy bias (directional long/short, gamma scalp neutral, credit theta plays), max contracts/size, hold time window (e.g., exit by 2pm), entry filters (min volume/OI, IV rank/percentile, gamma threshold), directional bias (bull/bear/neutral), exit rules (profit target %, time cutoff, stop %).

3. Core Features (Functional Requirements)

User onboarding/profile: Secure signup, input form for above prefs (save per user, editable).
Real-time dashboard: Live feed via Massive WebSockets for selected tickers—show chains, greeks, volume spikes, unusual activity.
Scan engine: Algorithm ranks "best" 0DTE plays hourly/minutely based on user prefs + data (e.g., high gamma ATM for scalps, favorable credit spreads if theta bias, filter illiquid). Output: Ranked list with entry strike/price rationale, projected P&L curve (simple theta/gamma sim), expected move.
Alerts/notifications: Push/email when scan hits user criteria (e.g., gamma > X on SPX).
Backtest viewer: Show historical sims of similar setups (pull past Massive data if available) to stress-test idea viability.
Disclaimers everywhere: "Not advice, past performance no guarantee, 0DTE can wipe capital fast—use at own risk."

4. Data & Tech Needs

Polygon/Massive API: Real-time quotes, chains, greeks, trades, aggregates for volume/OI changes.
No broker API yet: Manual execution reminder.
Backend: Process scans server-side (avoid client overload), store user prefs securely.
Frontend: Responsive web (React?), charts for chains/P&L (like your earlier graph).

5. Non-Functional & Constraints

Performance: Sub-5s refresh on live data for intraday use.
Security: HTTPS, encrypted prefs, no storage of sensitive financials.
Compliance: Mandatory risk warnings on every suggestion, no "profitable" claims without proof.
Scope limits: No auto-trading, no portfolio tracking, no ML predictions yet (start rule-based). Out of scope: Mobile app, payments, community sharing.

6. Assumptions & Risks
Assumes users are sophisticated and won't blindly follow suggestions (they'll get wrecked otherwise). Biggest risk: App gets blamed for losses → legal exposure. Stress test the ranking logic hard on historical data first—if it doesn't show positive expectancy after fees/slippages, scrap or pivot to research tool only.