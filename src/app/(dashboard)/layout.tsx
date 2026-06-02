"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  Bot,
  CalendarCheck,
  CalendarDays,
  Inbox,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sparkles,
  LogOut,
  Building,
  User as UserIcon,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "AI Receptionist", href: "/agent", icon: Bot },
  { name: "Booking Funnel", href: "/funnel", icon: CalendarCheck },
  { name: "Schedule", href: "/appointments", icon: CalendarDays },
  { name: "Settings", href: "/settings", icon: Settings },
];

type Workspace = { id: string; name: string };
type Account = { email?: string | null; name?: string | null };
type NotificationItem = { id: string; title: string; message: string; link?: string | null; isRead: boolean; createdAt: string };

type NotificationsPayload = { notifications?: NotificationItem[]; unreadCount?: number };

function initials(value?: string | null) {
  const safe = (value || "Owner").trim();
  const words = safe.split(/\s+/).filter(Boolean);
  if (!words.length) return "AC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function timeAgo(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const workspaceName = workspace?.name || "Loading workspace...";
  const displayName = account?.name || account?.email || "Owner console";
  const displayEmail = account?.email || "Signed-in workspace";
  const avatarInitials = useMemo(() => initials(displayName), [displayName]);

  useEffect(() => {
    let alive = true;

    async function loadAccountAndWorkspace() {
      try {
        const supabase = createClient();
        const [{ data }, res] = await Promise.all([
          supabase.auth.getUser(),
          fetch("/api/workspace/current", { cache: "no-store" }),
        ]);
        const payload = await res.json();
        if (!alive) return;
        setWorkspace(payload.workspace || null);
        setAccount({
          email: data.user?.email || payload.user?.email || null,
          name: payload.user?.name || data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || null,
        });
      } catch {
        if (!alive) return;
        setWorkspace(null);
        setAccount(null);
      }
    }

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const payload = (await res.json()) as NotificationsPayload;
        if (!alive || !res.ok) return;
        setNotifications(payload.notifications || []);
        setUnreadCount(payload.unreadCount || 0);
      } catch {
        if (!alive) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    }

    loadAccountAndWorkspace();
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 45_000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  async function markAllNotificationsRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Keep the current UI state if the request fails.
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/sign-in");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100 flex">
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-pink-600/5 rounded-full blur-[100px] pointer-events-none" />

      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0c101d] border-r border-white/5 z-20">
        <div className="flex h-16 shrink-0 items-center px-6 gap-2 border-b border-white/5 bg-[#090d16]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-md shadow-indigo-500/10">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white uppercase">AI Closer</span>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-indigo-600/15 border border-indigo-500/20 text-indigo-300 font-bold shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-white")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#090d16]/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white border border-white/10 shadow-sm">
              {avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{workspaceName}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Logout">
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md px-6 shadow-sm">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <Menu className="h-6 w-6" />
          </button>

          <div className="relative">
            <button onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-[#0c101d] hover:bg-[#12182b] border border-white/5 rounded-lg text-sm text-white font-semibold transition-colors cursor-pointer">
              <Building className="h-4 w-4 text-indigo-400" />
              <span>{workspaceName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </button>

            {workspaceDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setWorkspaceDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-64 glassmorphism rounded-xl border border-white/5 p-1.5 shadow-2xl z-30 animate-in fade-in-50 duration-100">
                  <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">Current Workspace</div>
                  <div className="px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 text-xs font-bold flex items-center justify-between">
                    <span className="truncate">{workspaceName}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  </div>
                  {workspace?.id && <p className="px-3 py-2 text-[10px] leading-5 text-gray-500 break-all">{workspace.id}</p>}
                  <div className="border-t border-white/5 my-1.5" />
                  <button onClick={() => { setWorkspaceDropdownOpen(false); router.push("/settings"); }} className="w-full text-left px-3 py-2 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-500/10 transition-all cursor-pointer">
                    Workspace settings
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 rounded-lg text-gray-400 hover:bg-[#0c101d] hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/5" aria-label="Open notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-black text-white ring-2 ring-[#070b14]">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 glassmorphism rounded-xl border border-white/5 shadow-2xl p-2.5 z-30 animate-in fade-in-50 duration-100">
                    <div className="flex items-center justify-between px-2 pb-2 border-b border-white/5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Live Alerts</span>
                      <button onClick={markAllNotificationsRead} disabled={!unreadCount} className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline disabled:text-gray-600 disabled:no-underline">
                        <CheckCheck className="h-3 w-3" /> Mark read
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-72 mt-1 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 px-2 text-center">
                          <p className="text-xs text-gray-300 font-semibold">No live notifications yet</p>
                          <p className="text-[10px] text-gray-500 mt-1">New leads, booked calls, and owner alerts will appear here after they are saved.</p>
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (item.link) router.push(item.link);
                            }}
                            className={cn(
                              "w-full rounded-lg p-3 text-left transition hover:bg-white/5",
                              item.isRead ? "bg-transparent" : "bg-indigo-500/10 border border-indigo-400/15",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs font-black text-white">{item.title}</p>
                              <span className="shrink-0 text-[10px] text-gray-500">{timeAgo(item.createdAt)}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-gray-400">{item.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center gap-2 cursor-pointer group" aria-label="Open profile menu">
                <div className="h-9 w-9 rounded-full bg-[#0c101d] border border-white/10 group-hover:border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-300 shadow-sm transition-colors">
                  {avatarInitials}
                </div>
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 glassmorphism rounded-xl border border-white/5 p-1.5 shadow-2xl z-30 animate-in fade-in-50 duration-100">
                    <div className="px-3 py-2 border-b border-white/5">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{displayEmail}</p>
                    </div>
                    <button onClick={() => { setUserDropdownOpen(false); router.push("/settings"); }} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 cursor-pointer mt-1">
                      <UserIcon className="h-4 w-4 text-gray-400" /> Workspace profile
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4 text-red-400" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto z-0">{children}</main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0c101d] border-r border-white/5 animate-in slide-in-from-left duration-200">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button onClick={() => setMobileMenuOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex h-16 shrink-0 items-center px-6 gap-2 border-b border-white/5 bg-[#090d16]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white uppercase">AI Closer</span>
            </div>
            <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer", isActive ? "bg-indigo-600/15 border border-indigo-500/20 text-indigo-300 font-bold" : "text-gray-400 hover:text-white hover:bg-white/5")}>
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/5 bg-[#090d16]/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white">{avatarInitials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{workspaceName}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
