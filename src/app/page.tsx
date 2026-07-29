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

const STAGES = ["Prospect", "Qualified", "Proposal", "Negotiation", "Closed"];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 overflow-x-hidden font-sans">
      {/* Local keyframes for the pipeline-flow signature visual. */}
      <style>{`
        @keyframes flowMove {
          0%   { left: 0%; transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: 100%; transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
        }
        @keyframes flowColor {
          0%, 55% { background-color: #cbd5e1; }
          100%    { background-color: #0ea5e9; }
        }
        .flow-dot {
          animation: flowMove var(--flow-duration) linear infinite,
                     flowColor var(--flow-duration) linear infinite;
          animation-delay: var(--flow-delay);
        }
        @media (prefers-reduced-motion: reduce) {
          .flow-dot {
            animation: none;
            left: 82%;
            opacity: 1;
            background-color: #0ea5e9;
          }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-lg">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">
              SalesFlow
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Roles", "Metrics"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 px-4 py-2 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32">
        {/* Gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 mb-8 rounded-full">
            <Zap size={12} className="text-blue-600" />
            Performance Marketing CRM
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-slate-900 mb-6">
            Sales clarity
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              for agencies that
            </span>
            <br />
            move fast.
          </h1>

          {/* Sub */}
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-12">
            Track every deal from first contact to closed. Built specifically
            for your agency — one team, one system, zero noise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 rounded-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Enter Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-base font-semibold text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* ── Signature visual: deals flowing through the pipeline ──── */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-8 pt-10 pb-8 text-left">
            <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-8">
              Live pipeline · 5 stages
            </p>

            <div className="relative h-8 mb-4">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300" />
              {/* Stage ticks */}
              {STAGES.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-300"
                  style={{ left: `${(i / (STAGES.length - 1)) * 100}%` }}
                />
              ))}
              {/* Animated deal dots */}
              <div
                className="flow-dot absolute top-1/2 w-3 h-3 rounded-full"
                style={
                  {
                    "--flow-duration": "7s",
                    "--flow-delay": "0s",
                  } as React.CSSProperties
                }
              />
              <div
                className="flow-dot absolute top-1/2 w-3 h-3 rounded-full"
                style={
                  {
                    "--flow-duration": "9s",
                    "--flow-delay": "2.4s",
                  } as React.CSSProperties
                }
              />
              <div
                className="flow-dot absolute top-1/2 w-3 h-3 rounded-full"
                style={
                  {
                    "--flow-duration": "8s",
                    "--flow-delay": "5s",
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="flex justify-between">
              {STAGES.map((stage) => (
                <span
                  key={stage}
                  className="text-xs font-mono tracking-wide uppercase text-slate-500"
                >
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: "3", label: "User roles", sub: "Admin · Manager · Rep" },
            { value: "5", label: "Pipeline stages", sub: "Prospect to Closed" },
            { value: "1", label: "Agency focus", sub: "Built for your team" },
            { value: "∞", label: "Deals tracked", sub: "No limits" },
          ].map((item, i) => (
            <div
              key={i}
              className={`px-8 py-10 text-center ${
                i < 3 ? "border-r border-slate-200" : ""
              }`}
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {item.value}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {item.label}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Powerful features
            </h2>
            <p className="text-lg text-slate-600">
              Everything your team needs to close deals faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Pipeline Dashboard",
                desc: "Real-time view of every deal across all stages. Know exactly where revenue is sitting.",
                gradient: "from-blue-50 to-blue-100",
                iconColor: "text-blue-600",
                bgColor: "bg-blue-600",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Create managers and reps, assign teams, block or remove users — all from one place.",
                gradient: "from-purple-50 to-purple-100",
                iconColor: "text-purple-600",
                bgColor: "bg-purple-600",
              },
              {
                icon: Target,
                title: "Deal Tracking",
                desc: "Track value, probability, close dates, and contacts. Move deals through stages in one click.",
                gradient: "from-rose-50 to-rose-100",
                iconColor: "text-rose-600",
                bgColor: "bg-rose-600",
              },
              {
                icon: TrendingUp,
                title: "Performance Analytics",
                desc: "See who's closing, who's stalling, and where your pipeline is strongest each month.",
                gradient: "from-emerald-50 to-emerald-100",
                iconColor: "text-emerald-600",
                bgColor: "bg-emerald-600",
              },
              {
                icon: Clock,
                title: "Stall Detection",
                desc: "Flags deals sitting too long in a stage automatically. Never let high-value leads go cold.",
                gradient: "from-orange-50 to-orange-100",
                iconColor: "text-orange-600",
                bgColor: "bg-orange-600",
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                desc: "Admins see everything. Managers see their team. Reps see their own deals. Always enforced.",
                gradient: "from-indigo-50 to-indigo-100",
                iconColor: "text-indigo-600",
                bgColor: "bg-indigo-600",
              },
            ].map(({ icon: Icon, title, desc, gradient, iconColor }, i) => (
              <div
                key={i}
                className="group bg-white border border-slate-200 p-8 rounded-2xl hover:border-slate-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={28} className={`${iconColor} font-bold`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  {title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────────── */}
      <section
        id="roles"
        className="bg-gradient-to-b from-slate-50 to-white px-6 py-24 border-y border-slate-200"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Built for every role
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              One system. Three levels of visibility.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Each role sees exactly what they need. No overload, no blind
              spots. The right data, for the right person, at the right time.
            </p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col gap-4">
            {[
              {
                role: "Admin",
                dotColor: "bg-slate-900",
                perms: [
                  "Full pipeline visibility",
                  "Team creation & management",
                  "Assign reps to managers",
                  "All deals & metrics",
                ],
              },
              {
                role: "Manager",
                dotColor: "bg-blue-600",
                perms: [
                  "Team performance view",
                  "Their reps' deals only",
                  "Block / unblock reps",
                  "Personal pipeline",
                ],
              },
              {
                role: "Sales Rep",
                dotColor: "bg-emerald-500",
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
                className="border-2 border-slate-200 bg-white p-6 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${r.dotColor}`} />
                  <span className="text-sm font-bold text-slate-900">
                    {r.role}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.perms.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full"
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
      <section id="metrics" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              The numbers that matter
            </h2>
            <p className="text-lg text-slate-600">
              Track metrics that drive your business forward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div
                key={ci}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg"
              >
                {col.map((item, idx) => (
                  <div
                    key={item.label}
                    className={`group flex items-center justify-between p-6 hover:bg-blue-50 transition-colors ${
                      idx < col.length - 1 ? "border-b border-slate-200" : ""
                    }`}
                  >
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {item.label}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {item.note}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-32 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to elevate your sales?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join agencies that are already closing more deals with SalesFlow
          </p>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-lg font-semibold text-blue-600 bg-white px-10 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Access Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900">SalesFlow</span>
          </div>
          <p className="text-sm text-slate-600">
            © 2024 SalesFlow. Built for agencies that move fast.
          </p>
        </div>
      </footer>
    </main>
  );
}
