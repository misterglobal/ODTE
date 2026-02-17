import Link from "next/link"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
                            0
                        </div>
                        <h1 className="text-2xl font-bold tracking-tighter">0DTE Scanner</h1>
                    </div>
                    <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                        Back to Dashboard
                    </Link>
                </header>

                <main className="prose prose-slate dark:prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground italic mb-8">Last Updated: February 17, 2026</p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">1. Introduction</h2>
                        <p>
                            Welcome to 0DTE Options Scanner. We respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                        </p>

                        <h2 className="text-2xl font-semibold">2. Data We Collect</h2>
                        <p>
                            We collect information that you provide directly to us when you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Create an account or update your profile (e.g., risk tolerance, preferred tickers).</li>
                            <li>Use the scanner and save settings.</li>
                            <li>Communicate with us via our support channels.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold">3. How We Use Your Data</h2>
                        <p>
                            We use your data to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide and maintain our scanner service.</li>
                            <li>Personalize your experience based on your risk preferences.</li>
                            <li>Improve our app's functionality and performance.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold">4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
                        </p>

                        <h2 className="text-2xl font-semibold">5. Your Rights</h2>
                        <p>
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of your personal data.
                        </p>

                        <h2 className="text-2xl font-semibold">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us through our dashboard support.
                        </p>
                    </section>
                </main>

                <footer className="border-t pt-8 mt-12 text-center text-sm text-muted-foreground">
                    <p>&copy; 2026 0DTE Scanner. All rights reserved.</p>
                </footer>
            </div>
        </div>
    )
}
