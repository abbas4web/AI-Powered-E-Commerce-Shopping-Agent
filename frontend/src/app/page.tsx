import Link from 'next/link';
import { ArrowRight, Sparkles, Search, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            SmartShop AI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Products
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by Gemini AI
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
            Shop smarter with{' '}
            <span className="text-primary">AI-powered</span> recommendations
          </h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Tell us what you need in plain English. Our AI understands your requirements,
            searches thousands of products, and explains why each recommendation fits your needs.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/assistant">
              <Button size="lg" className="gap-2">
                Start shopping <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                Browse products
              </Button>
            </Link>
          </div>
          {/* Example query pill */}
          <div className="mt-8 rounded-xl border bg-muted/50 px-6 py-4 text-sm text-muted-foreground text-left max-w-xl mx-auto">
            <span className="text-foreground font-medium">Try asking: </span>
            "I need a laptop under ₹80,000 for Flutter development and Android Studio, with at least 16GB RAM and good battery life."
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {[
            {
              icon: Sparkles,
              title: 'Natural Language',
              description: 'Describe what you need the way you would to a friend.',
            },
            {
              icon: Search,
              title: 'Smart Filtering',
              description: 'Hard constraints are applied deterministically — no hallucinated specs.',
            },
            {
              icon: BarChart3,
              title: 'Explainable Scores',
              description: 'Every recommendation comes with a breakdown of why it was chosen.',
            },
            {
              icon: Shield,
              title: 'Trusted Results',
              description: 'AI only explains — it never invents product data.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SmartShop AI. Built with Next.js, NestJS, and Gemini.
        </div>
      </footer>
    </main>
  );
}
