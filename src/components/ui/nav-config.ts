import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { Translations } from "@/lib/i18n/translations";
import type { UserRole } from "@/lib/types";

type IconComponent = React.ComponentType<{ className?: string }>;

export interface NavItem {
  href: string;
  labelKey: keyof Translations["nav"];
  icon: IconComponent;
  roles: UserRole[];
}

export interface NavGroup {
  labelKey: keyof Translations["nav"];
  roles: UserRole[];
  items: NavItem[];
}

// Single source of truth for the sidebar navigation. Defined as data so it
// can be tree-shaken, cached, and rendered server-side without dragging in
// any client-only state.
export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "overview",
    roles: ["owner", "cashier"],
    items: [
      {
        href: "/dashboard",
        labelKey: "dashboard",
        icon: LayoutDashboard,
        roles: ["owner", "cashier"],
      },
    ],
  },
  {
    labelKey: "transactions",
    roles: ["owner", "cashier"],
    items: [
      {
        href: "/pos",
        labelKey: "pos",
        icon: ShoppingCart,
        roles: ["owner", "cashier"],
      },
      {
        href: "/sales",
        labelKey: "sales",
        icon: Receipt,
        roles: ["owner", "cashier"],
      },
      {
        href: "/purchases",
        labelKey: "purchases",
        icon: ClipboardList,
        roles: ["owner"],
      },
      {
        href: "/credit",
        labelKey: "credit",
        icon: CreditCard,
        roles: ["owner"],
      },
    ],
  },
  {
    labelKey: "catalog",
    roles: ["owner"],
    items: [
      {
        href: "/products",
        labelKey: "products",
        icon: Package,
        roles: ["owner"],
      },
      {
        href: "/catalog/categories",
        labelKey: "categories",
        icon: Tag,
        roles: ["owner"],
      },
      {
        href: "/inventory",
        labelKey: "inventory",
        icon: Warehouse,
        roles: ["owner"],
      },
      {
        href: "/catalog/campaigns",
        labelKey: "campaigns",
        icon: Megaphone,
        roles: ["owner"],
      },
      {
        href: "/catalog/suppliers",
        labelKey: "suppliers",
        icon: Truck,
        roles: ["owner"],
      },
      {
        href: "/catalog/resellers",
        labelKey: "resellers",
        icon: Users,
        roles: ["owner"],
      },
    ],
  },
  {
    labelKey: "analytics",
    roles: ["owner"],
    items: [
      {
        href: "/reports",
        labelKey: "reports",
        icon: BarChart3,
        roles: ["owner"],
      },
    ],
  },
  {
    labelKey: "system",
    roles: ["owner"],
    items: [
      {
        href: "/settings",
        labelKey: "settings",
        icon: Settings,
        roles: ["owner"],
      },
    ],
  },
];

export function filterNavForRole(role: UserRole): NavGroup[] {
  return NAV_GROUPS.filter((group) => group.roles.includes(role))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
