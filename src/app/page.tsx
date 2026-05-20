import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Clock,
  Zap,
  Shield,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "SalesFlow — Sales Pipeline Management",
  description:
    "A precision-built CRM for performance marketing agencies. Track deals, manage teams, and close more with clarity.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden font-sans">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 border border-gray-200 bg-white flex items-center justify-center">
              <BarChart3 size={13} className="text-gray-900" />
            </div>
            <span className="font-mono text-xs font-semibold tracking-widest text-gray-900 uppercase">
              SalesFlow
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7">
            {["Features", "Roles", "Metrics"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs text-gray-400 hover:text-gray-900 tracking-wide transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs text-gray-500 border border-gray-200 px-4 py-2 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-gray-900 px-4 py-2 hover:bg-gray-700 transition-colors"
            >
              Dashboard
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        className="relative border-b border-gray-100 px-6 py-28 md:py-36"
        style={{
          backgroundImage:
            "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Corner brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-gray-200 hidden md:block" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-gray-200 hidden md:block" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-gray-400 border border-gray-200 bg-white px-4 py-2 mb-7">
            <Zap size={10} />
            Performance Marketing CRM
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-light leading-none tracking-tight text-gray-900 mb-6">
            Sales clarity
            <br />
            <span className="italic text-gray-300">for agencies that</span>
            <br />
            move fast.
          </h1>

          {/* Sub */}
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto mb-9">
            Track every deal from first contact to closed. Built specifically
            for your agency — one team, one system, zero noise.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 px-6 py-3 hover:bg-gray-700 transition-colors"
            >
              Enter Dashboard
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 px-6 py-3 hover:border-gray-300 hover:text-gray-700 hover:bg-white transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: "3", label: "User roles", sub: "Admin · Manager · Rep" },
            { value: "5", label: "Pipeline stages", sub: "Prospect to Closed" },
            { value: "1", label: "Agency focus", sub: "Built for your team" },
            { value: "∞", label: "Deals tracked", sub: "No limits" },
          ].map((item, i) => (
            <div
              key={i}
              className={`px-8 py-9 ${i < 3 ? "border-r border-gray-100" : ""}`}
            >
              <div className="font-mono text-4xl font-medium text-gray-900 tracking-tight">
                {item.value}
              </div>
              <div className="text-xs font-medium text-gray-700 mt-2">
                {item.label}
              </div>
              <div className="text-xs text-gray-300 mt-1 tracking-wide">
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="w-7 h-px bg-gray-900 mb-4" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight leading-snug max-w-xs">
              Everything your team needs. Nothing they don't.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
            {[
              {
                icon: BarChart3,
                title: "Pipeline Dashboard",
                desc: "Real-time view of every deal across all stages. Know exactly where revenue is sitting.",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Create managers and reps, assign teams, block or remove users — all from one place.",
              },
              {
                icon: Target,
                title: "Deal Tracking",
                desc: "Track value, probability, close dates, and contacts. Move deals through stages in one click.",
              },
              {
                icon: TrendingUp,
                title: "Performance Analytics",
                desc: "See who's closing, who's stalling, and where your pipeline is strongest each month.",
              },
              {
                icon: Clock,
                title: "Stall Detection",
                desc: "Flags deals sitting too long in a stage automatically. Never let high-value leads go cold.",
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                desc: "Admins see everything. Managers see their team. Reps see their own deals. Always enforced.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="group bg-white p-7 relative overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="absolute left-0 top-0 w-0.5 h-0 bg-gray-900 group-hover:h-full transition-all duration-300" />
                <Icon size={17} className="text-gray-200 mb-5" />
                <h3 className="text-sm font-medium text-gray-900 mb-2 tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────────── */}
      <section
        id="roles"
        className="bg-white px-6 py-24 border-b border-gray-100"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Left copy */}
          <div>
            <div className="w-7 h-px bg-gray-900 mb-4" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mb-3">
              Built for every role
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight leading-snug mb-5">
              One system.
              <br />
              Three levels of visibility.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Each role sees exactly what they need. No overload, no blind
              spots. The right data, for the right person, at the right time.
            </p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col gap-3">
            {[
              {
                role: "Admin",
                dotColor: "bg-gray-900",
                perms: [
                  "Full pipeline visibility",
                  "Team creation & management",
                  "Assign reps to managers",
                  "All deals & metrics",
                ],
              },
              {
                role: "Manager",
                dotColor: "bg-gray-400",
                perms: [
                  "Team performance view",
                  "Their reps' deals only",
                  "Block / unblock reps",
                  "Personal pipeline",
                ],
              },
              {
                role: "Sales Rep",
                dotColor: "bg-gray-200",
                perms: [
                  "Own deals only",
                  "Add & edit deals",
                  "Stage progression",
                  "Personal metrics",
                ],
              },
            ].map((r) => (
              <div
                key={r.role}
                className="border border-gray-100 bg-gray-50 p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />
                  <span className="text-xs font-semibold text-gray-900 tracking-wide">
                    {r.role}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.perms.map((p) => (
                    <span
                      key={p}
                      className="text-xs text-gray-400 border border-gray-200 bg-white px-2.5 py-1"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METRICS ─────────────────────────────────────────────────── */}
      <section id="metrics" className="px-6 py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <div className="w-7 h-px bg-gray-900 mb-4" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mb-3">
              What you track
            </p>
            <h2 className="text-3xl font-light text-gray-900 tracking-tight leading-snug">
              The numbers that actually matter.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
            {[
              [
                {
                  label: "Total Pipeline Value",
                  note: "All active deals combined",
                },
                { label: "Closed This Month", note: "Won deal revenue" },
                { label: "Avg Close Time", note: "Days from open to won" },
              ],
              [
                {
                  label: "Deal Target Progress",
                  note: "Monthly goal tracking",
                },
                { label: "Expected Revenue", note: "Value × probability" },
                { label: "Stalled Deals", note: "14+ days in one stage" },
              ],
            ].map((col, ci) => (
              <div key={ci} className="bg-white px-7 py-2">
                {col.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-5 border-b border-gray-50 last:border-b-0"
                  >
                    <div>
                      <div className="text-sm text-gray-900 font-medium">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5 tracking-wide">
                        {item.note}
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-gray-200" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-32 border-b border-gray-100 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mb-6">
          Ready to start
        </p>
        <h2 className="text-4xl md:text-6xl font-light text-gray-900 tracking-tight mb-10 leading-none">
          Your pipeline
          <br />
          <span className="italic text-gray-300">is waiting.</span>
        </h2>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-900 px-8 py-3.5 hover:bg-gray-700 transition-colors"
        >
          Access Dashboard
          <ArrowRight size={13} />
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-gray-50 border-t border-gray-100 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 border border-gray-200 flex items-center justify-center">
                <BarChart3 size={11} className="text-gray-400" />
              </div>
              <span className="font-mono text-xs tracking-widest text-gray-400 uppercase">
                SalesFlow
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-[180px]">
              Custom CRM built for performance marketing agencies.
            </p>
          </div>

          {[
            {
              heading: "Product",
              links: ["Features", "Capabilities", "For Teams"],
            },
            {
              heading: "Company",
              links: ["About", "Blog", "Contact"],
            },
            {
              heading: "Legal",
              links: ["Terms", "Privacy", "Cookies"],
            },
          ].map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mb-4">
                {col.heading}
              </p>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="block text-xs text-gray-400 hover:text-gray-700 mb-2.5 transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="max-w-6xl mx-auto pt-8 border-t border-gray-100 flex items-center justify-between">
          <span className="font-mono text-xs text-gray-200">
            © 2026 SalesFlow
          </span>
          <span className="font-mono text-xs text-gray-200">v2.0</span>
        </div>
      </footer>
    </main>
  );
}
