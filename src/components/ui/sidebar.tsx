"use client";

import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import {
  filterNavForRole,
  type NavGroup,
  type NavItem,
} from "@/components/ui/nav-config";
import { useTheme } from "@/components/ui/theme-provider";
import { logout } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/context";
import type { Translations } from "@/lib/i18n/translations";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  storeName: string;
  storeIconUrl?: string | null;
  unreadNotifications?: number;
}

// Memoised nav link — re-renders only when its props change. Prevents the
// whole nav list from re-rendering when an unrelated piece of sidebar state
// (theme, locale, mobile drawer) updates.
const NavLink = memo(function NavLink({
  href,
  label,
  Icon,
  isActive,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: NavItem["icon"];
  isActive: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={`flex items-center ${collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"} rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && label}
    </Link>
  );
});

function SidebarFooter({
  userName,
  userRole,
  collapsed,
  t,
  locale,
  setLocale,
  theme,
  toggleTheme,
  unreadNotifications,
}: {
  userName: string;
  userRole: UserRole;
  collapsed: boolean;
  t: Translations;
  locale: "en" | "id";
  setLocale: (locale: "en" | "id") => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  unreadNotifications?: number;
}) {
  return (
    <div
      className={`p-3 border-t border-gray-200 dark:border-gray-700 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}
    >
      {!collapsed && (
        <>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-0.5">
            {userName}
          </p>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize mb-3">
            {userRole}
          </p>
        </>
      )}
      <div
        className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}
      >
        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
            aria-label={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </form>
        <div
          className={`flex items-center gap-1 ${collapsed ? "flex-col" : ""}`}
        >
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t.nav.notifications}
            title={t.nav.notifications}
          >
            <Bell className="h-4 w-4" />
            {(unreadNotifications ?? 0) > 0 && (
              <span
                className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "id" : "en")}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`${t.nav.language}: ${locale.toUpperCase()}`}
            title={
              locale === "en" ? "Switch to Indonesia" : "Switch to English"
            }
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span
              className={`uppercase tracking-wide ${collapsed ? "text-[10px]" : ""}`}
            >
              {locale}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={
              theme === "light" ? t.login.switchToDark : t.login.switchToLight
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  userRole,
  userName,
  storeName,
  storeIconUrl,
  unreadNotifications,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();

  // Filter once per role change rather than on every re-render.
  const filteredGroups = useMemo<NavGroup[]>(
    () => filterNavForRole(userRole),
    [userRole],
  );

  const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);

  const toggleGroup = useCallback((label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const navContent = (collapsed: boolean) => (
    <nav className="flex flex-col h-full" aria-label="Main navigation">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2 justify-between"}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {storeIconUrl && (
              <Image
                src={storeIconUrl}
                alt=""
                width={32}
                height={32}
                priority
                className="h-8 w-8 rounded-lg object-cover shrink-0"
              />
            )}
            {!collapsed && (
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {storeName}
              </h1>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            className="hidden lg:flex shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {filteredGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups.has(group.labelKey);
          const groupLabel = t.nav[group.labelKey];
          return (
            <div key={group.labelKey}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.labelKey)}
                  className="w-full flex items-center justify-between px-3 py-1 mb-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  aria-expanded={!isGroupCollapsed}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    {groupLabel}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-500 dark:text-gray-300 transition-transform duration-200 ${
                      isGroupCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}
              {(!isGroupCollapsed || collapsed) && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        href={item.href}
                        label={t.nav[item.labelKey]}
                        Icon={item.icon}
                        isActive={pathname.startsWith(item.href)}
                        collapsed={collapsed}
                        onNavigate={closeMobileDrawer}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <SidebarFooter
        userName={userName}
        userRole={userRole}
        collapsed={collapsed}
        t={t}
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        toggleTheme={toggleTheme}
        unreadNotifications={unreadNotifications}
      />
    </nav>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        {storeIconUrl && (
          <Image
            src={storeIconUrl}
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 rounded-md object-cover shrink-0"
          />
        )}
        <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {storeName}
        </span>
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={closeMobileDrawer}
        />
      )}

      <aside
        id="mobile-sidebar"
        className={`lg:hidden fixed top-14 bottom-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        {navContent(false)}
      </aside>

      <aside
        className={`hidden lg:flex lg:flex-col lg:border-r lg:border-gray-200 dark:lg:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200 overflow-hidden ${
          minimized ? "lg:w-14" : "lg:w-64"
        }`}
        aria-label="Sidebar"
      >
        {navContent(minimized)}
      </aside>
    </>
  );
}
