import Link from "next/link"

export default function TermsPage() {
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
                    <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground italic mb-8">Last Updated: February 17, 2026</p>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using 0DTE Options Scanner, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>

                        <h2 className="text-2xl font-semibold text-destructive">2. Financial Disclaimer</h2>
                        <p className="font-bold">
                            0DTE Options Scanner is for informational and educational purposes only. We are not financial advisors, and this tool does not provide financial advice. Trading 0DTE (Zero Days to Expiration) options carries a high level of risk and can result in the loss of all your capital.
                        </p>

                        <h2 className="text-2xl font-semibold">3. Use License</h2>
                        <p>
                            Permission is granted to temporarily download one copy of the materials on 0DTE Options Scanner's website for personal, non-commercial transitory viewing only.
                        </p>

                        <h2 className="text-2xl font-semibold">4. Limitations</h2>
                        <p>
                            In no event shall 0DTE Options Scanner or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
                        </p>

                        <h2 className="text-2xl font-semibold">5. Accuracy of Materials</h2>
                        <p>
                            The materials appearing on 0DTE Options Scanner's website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current.
                        </p>

                        <h2 className="text-2xl font-semibold">6. External Links</h2>
                        <p>
                            0DTE Options Scanner has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by 0DTE Options Scanner.
                        </p>

                        <h2 className="text-2xl font-semibold">7. Modifications</h2>
                        <p>
                            We may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
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
