"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Users,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Activity,
  User,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/notification-bell";
import { GlobalSearch } from "@/components/shared/global-search";

const navItems = [
  {
    label: "Dashboard",
    href: "/manager/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Deals",
    href: "/manager/my-deals",
    icon: Users,
  },
  {
    label: "Add Deal",
    href: "/deals/add_deal",
    icon: Users,
  },
  {
    label: "Performance Report",
    href: "/manager/reports",
    icon: TrendingUp,
  },
  {
    label: "Team Activity",
    href: "/manager/activity",
    icon: Activity,
  },
];

export function ManagerDashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({
      redirect: false,
    });

    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Left Side - Logo */}
        <Link
          href="/manager/dashboard"
          className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
          </div>

          <div className="leading-tight hidden sm:block">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">
              SalesFlow
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manager Panel
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-11 px-4 lg:px-5 rounded-xl text-sm lg:text-base font-medium transition-all",
                    isActive
                      ? "bg-black text-white hover:bg-black hover:text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          {/* Notifications */}
          <NotificationBell role="manager" />

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/profile")}
            title="My Profile"
            className="hidden sm:flex"
          >
            <User className="w-5 h-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3">
            {/* Mobile Search */}
            <div className="mb-3">
              <GlobalSearch />
            </div>

            {/* Mobile Notifications */}
            <div className="mb-2 flex items-center">
              <NotificationBell role="manager" />
            </div>

            {/* Mobile Profile */}
            <Button
              variant="ghost"
              className="w-full justify-start rounded-lg mb-2"
              onClick={() => {
                router.push("/profile");
                setMobileMenuOpen(false);
              }}
            >
              <User className="w-4 h-4 mr-2" />
              My Profile
            </Button>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start rounded-lg",
                        isActive && "bg-black hover:bg-black text-white",
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 mt-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
