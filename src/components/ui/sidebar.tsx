"use client";

import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  ShoppingCart,
  Sun,
  Tag,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { logout } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/context";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  userRole: UserRole;
  userName: string;
  storeName: string;
  storeIconUrl?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface NavGroup {
  label: string;
  roles: string[];
  items: NavItem[];
}

export function Sidebar({
  userRole,
  userName,
  storeName,
  storeIconUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  // All groups start expanded; track collapsed groups by label
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  // Nav groups are built inside the component so labels react to locale changes.
  const navGroups: NavGroup[] = [
    {
      label: t.nav.overview,
      roles: ["owner", "cashier"],
      items: [
        {
          href: "/dashboard",
          label: t.nav.dashboard,
          icon: LayoutDashboard,
          roles: ["owner", "cashier"],
        },
      ],
    },
    {
      label: t.nav.transactions,
      roles: ["owner", "cashier"],
      items: [
        {
          href: "/pos",
          label: t.nav.pos,
          icon: ShoppingCart,
          roles: ["owner", "cashier"],
        },
        {
          href: "/sales",
          label: t.nav.sales,
          icon: Receipt,
          roles: ["owner", "cashier"],
        },
        {
          href: "/purchases",
          label: t.nav.purchases,
          icon: ClipboardList,
          roles: ["owner"],
        },
        {
          href: "/credit",
          label: t.nav.credit,
          icon: CreditCard,
          roles: ["owner"],
        },
      ],
    },
    {
      label: t.nav.catalog,
      roles: ["owner"],
      items: [
        {
          href: "/products",
          label: t.nav.products,
          icon: Package,
          roles: ["owner"],
        },
        {
          href: "/catalog/categories",
          label: t.nav.categories,
          icon: Tag,
          roles: ["owner"],
        },
        {
          href: "/inventory",
          label: t.nav.inventory,
          icon: Warehouse,
          roles: ["owner"],
        },
        {
          href: "/catalog/campaigns",
          label: t.nav.campaigns,
          icon: Megaphone,
          roles: ["owner"],
        },
        {
          href: "/catalog/suppliers",
          label: t.nav.suppliers,
          icon: Truck,
          roles: ["owner"],
        },
        {
          href: "/catalog/resellers",
          label: t.nav.resellers,
          icon: Users,
          roles: ["owner"],
        },
      ],
    },
    {
      label: t.nav.analytics,
      roles: ["owner"],
      items: [
        {
          href: "/reports",
          label: t.nav.reports,
          icon: BarChart3,
          roles: ["owner"],
        },
      ],
    },
    {
      label: t.nav.system,
      roles: ["owner"],
      items: [
        {
          href: "/settings",
          label: t.nav.settings,
          icon: Settings,
          roles: ["owner"],
        },
      ],
    },
  ];

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  const filteredGroups = navGroups
    .filter((group) => group.roles.includes(userRole))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  const navContent = (collapsed: boolean) => (
    <nav className="flex flex-col h-full" aria-label="Main navigation">
      {/* Header */}
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
                unoptimized
                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
              />
            )}
            {!collapsed && (
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {storeName}
              </h1>
            )}
          </div>
          {/* Minimize toggle — desktop only */}
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            className="hidden lg:flex flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {filteredGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups.has(group.label);
          return (
            <div key={group.label}>
              {/* Group label — hidden when sidebar is minimized */}
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-1 mb-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  aria-expanded={!isGroupCollapsed}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                    {group.label}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                      isGroupCollapsed ? "-rotate-90" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )}
              {(!isGroupCollapsed || collapsed) && (
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={collapsed ? item.label : undefined}
                          className={`flex items-center ${collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"} rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                          aria-label={collapsed ? item.label : undefined}
                        >
                          <item.icon
                            className="h-5 w-5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          {!collapsed && item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

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
              <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && "Sign out"}
            </button>
          </form>
          <div
            className={`flex items-center gap-1 ${collapsed ? "flex-col" : ""}`}
          >
            {/* Language toggle — shows current locale so the choice is always visible */}
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "id" : "en")}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t.nav.language}
              title={
                locale === "en" ? "Switch to Indonesia" : "Switch to English"
              }
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="uppercase tracking-wide">{locale}</span>
              )}
              {collapsed && (
                <span className="uppercase tracking-wide text-[10px]">
                  {locale}
                </span>
              )}
            </button>
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={
                theme === "light" ? t.login.switchToDark : t.login.switchToLight
              }
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar — full-width header so it never overlaps page content */}
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
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        {storeIconUrl && (
          <Image
            src={storeIconUrl}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-md object-cover flex-shrink-0"
          />
        )}
        <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {storeName}
        </span>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar — slides in from left, sits below the top bar */}
      <aside
        id="mobile-sidebar"
        className={`lg:hidden fixed top-14 bottom-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        {navContent(false)}
      </aside>

      {/* Desktop sidebar — animates between full (w-64) and icon-only (w-14) */}
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
