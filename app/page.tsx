import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Package,
  Share2,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react"
import { ROUTES } from "@/lib/constants"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-whatsapp flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-foreground text-sm">
              MicroStore
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.LOGIN}>Sign in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-whatsapp hover:bg-whatsapp-dark text-white"
              asChild
            >
              <Link href={ROUTES.SIGN_UP}>Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-whatsapp/10 text-whatsapp text-xs font-semibold px-3 py-1.5 rounded-full">
          <MessageCircle className="w-3.5 h-3.5" />
          Built for Instagram sellers
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight text-balance">
          Your store. Your products.
          <br />
          <span className="text-whatsapp">Orders via WhatsApp.</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed text-pretty">
          Create a beautiful micro store in minutes. Share product links on
          Instagram. Let customers order directly on WhatsApp — no cart, no
          checkout.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            size="lg"
            className="bg-whatsapp hover:bg-whatsapp-dark text-white gap-2 h-12 px-6"
            asChild
          >
            <Link href={ROUTES.SIGN_UP}>
              Create your free store
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-6" asChild>
            <Link href={ROUTES.LOGIN}>Sign in</Link>
          </Button>
        </div>


      </section>

      {/* How It Works Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">How it works</h2>
            <p className="text-muted-foreground text-sm">
              From signup to first sale in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                step: "1",
                title: "Create your store",
                desc: "Sign up, name your store, add your WhatsApp number. Done.",
              },
              {
                icon: Package,
                step: "2",
                title: "Add products",
                desc: "Upload photos, set prices, mark your best sellers as featured.",
              },
              {
                icon: Share2,
                step: "3",
                title: "Share & sell",
                desc: "Copy product links and share on Instagram. Buyers order on WhatsApp.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="bg-background rounded-xl border border-border p-6 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-whatsapp/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-whatsapp" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Step {step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-sm">
            No complexity. Just the essentials that drive sales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "Shareable storefront link",
            "WhatsApp order button on every product",
            "Featured product showcase",
            "3 beautiful store themes",
            "Product image gallery",
            "Copy-to-clipboard product links",
            "Mobile-first design",
            "Zero commission on sales",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 py-2.5 px-4 rounded-lg border border-border bg-card"
            >
              <div className="w-5 h-5 rounded-full bg-whatsapp/10 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-whatsapp" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-balance">
            Start selling on WhatsApp today
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Join thousands of Instagram sellers who use MicroStore to sell
            faster and simpler.
          </p>
          <Button
            size="lg"
            className="bg-whatsapp hover:bg-whatsapp-dark text-white gap-2 h-12 px-8"
            asChild
          >
            <Link href={ROUTES.SIGN_UP}>
              Create your free store
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-whatsapp flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="text-xs text-muted-foreground">MicroStore</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for Indian Instagram sellers
          </p>
        </div>
      </footer>
    </div>
  )
}
