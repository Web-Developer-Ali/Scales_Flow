"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Users,
  TrendingUp,
  UserCog,
  LogOut,
  Menu,
  X,
  Activity,
  User,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/shared/global-search";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Add Member", href: "/admin/add_member", icon: Users },
  { label: "Assign Team", href: "/admin/assign-team", icon: UserCog },
  { label: "Reports", href: "/admin/reports", icon: TrendingUp },
  { label: "Activity", href: "/admin/activity", icon: Activity },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="px-3 sm:px-6 flex items-center justify-between h-16 gap-2">
        {/* Left Section - Logo */}
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-black flex items-center justify-center shadow-sm flex-shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="leading-tight hidden sm:block">
            <h1 className="text-base sm:text-xl font-bold text-foreground whitespace-nowrap">
              SalesFlow
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Admin Panel
            </p>
          </div>
        </Link>

        {/* Desktop Nav - full labels, xl+ */}
        <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center min-w-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-black text-white hover:bg-black hover:text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Icon-only nav, lg to xl */}
        <nav className="hidden lg:flex xl:hidden items-center gap-0.5 flex-1 justify-center min-w-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link key={item.href} href={item.href} title={item.label}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all",
                    isActive
                      ? "bg-black text-white hover:bg-black hover:text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="hidden xl:block">
            <GlobalSearch />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Account Options"
                className="hidden sm:flex h-9 w-9"
              >
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile Page</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/setting/email"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Email Setting Page</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handleLogout}
            size="sm"
            className="h-9 px-2.5 sm:px-4 rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation (below lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3">
            <div className="mb-3">
              <GlobalSearch />
            </div>

            <div className="mb-2 flex flex-col gap-2">
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-lg"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile Page
                </Button>
              </Link>
              <Link
                href="/admin/setting/email"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-lg"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Setting Page
                </Button>
              </Link>
            </div>

            <nav className="flex flex-col gap-1">
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
