import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  Target,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "SalesFlow CRM - Custom Sales Pipeline Management",
  description:
    "A custom-built CRM solution for your sales team. Track deals from first contact to closed sale with visual pipeline management, team performance insights, and real-time analytics.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background/70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SalesFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "Capabilities", "Teams"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-muted-foreground hover:text-primary transition font-medium"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="hover:bg-primary/10">
                Login
              </Button>
            </Link>
            <Link href="/admin">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Access Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-28 md:py-40 hero-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 shadow-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Custom CRM Solution
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-balance">
            Supercharge Your Sales Pipeline
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Track deals effortlessly, visualize your pipeline, and make smarter
            decisions with real-time actionable insights tailored to your
            business.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/admin">
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                View Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 w-full sm:w-auto hover:bg-primary/10 transition"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-20 section-fade border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: TrendingUp,
              title: "Increase Win Rates",
              text: "Visualize pipeline health and close more deals with clarity.",
              color: "primary",
            },
            {
              icon: Users,
              title: "Empower Your Team",
              text: "Role-based dashboards for reps, managers, and admins.",
              color: "accent",
            },
            {
              icon: BarChart3,
              title: "Real-Time Insights",
              text: "Instant analytics and performance metrics you can act on.",
              color: "destructive",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center md:text-left card-hover">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-${item.color}/10 text-${item.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features (Updated Styling) */}
      <section id="features" className="px-6 py-20 border-b border-border">
        <div className="max-w-6xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features
          </h2>
          <p className="text-muted-foreground text-lg">
            Built for teams who need clarity, control, and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: "Deal Pipeline Visualization",
              description:
                "See your entire sales pipeline at a glance with interactive stage tracking.",
              icon: BarChart3,
            },
            {
              title: "Team Performance Analytics",
              description:
                "Track progress against KPIs and targets in real-time.",
              icon: TrendingUp,
            },
            {
              title: "Deal Management",
              description:
                "Monitor values, probabilities, and next actions with precision.",
              icon: Target,
            },
            {
              title: "Sales Metrics Dashboard",
              description:
                "Measure pipeline value, close rates, and average cycle time easily.",
              icon: Clock,
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="p-4 card-hover border-border hover:border-primary/40"
              >
                <CardHeader>
                  <div className="flex gap-4 items-start">
                    <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to streamline your sales workflow?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Start using SalesFlow to boost productivity and close more deals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
              >
                Access Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto hover:bg-primary/10 gap-2"
            >
              Contact Support <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">SalesFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Custom CRM solution built around your sales process.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#capabilities">Capabilities</a>
              </li>
              <li>
                <a href="#roles">For Teams</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#">Terms</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Cookies</a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
