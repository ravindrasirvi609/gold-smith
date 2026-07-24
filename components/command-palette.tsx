"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Coins,
  FileText,
  Gauge,
  Gem,
  Hammer,
  Handshake,
  PackageCheck,
  Receipt,
  Shield,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

/**
 * Global ⌘K / Ctrl+K command palette.
 *
 * Opens on the keyboard shortcut and offers keyboard navigation to every
 * major dashboard destination. Rendered once from the dashboard layout so
 * it's available everywhere the user is authenticated.
 */

type PaletteAction = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
};

const ITEMS: { group: string; items: PaletteAction[] }[] = [
  {
    group: "Navigate",
    items: [
      { label: "Dashboard", href: "/dashboard", Icon: Gauge, keywords: ["home"] },
      { label: "Vendors", href: "/dashboard/vendors", Icon: Building2 },
      { label: "Customers", href: "/dashboard/customers", Icon: Users },
      { label: "Karigars", href: "/dashboard/karigars", Icon: Hammer, keywords: ["craftsman"] },
      { label: "Users", href: "/dashboard/users", Icon: UserCog, keywords: ["team", "staff"] },
      { label: "Products", href: "/dashboard/products", Icon: Gem, keywords: ["jewellery", "stock"] },
    ],
  },
  {
    group: "Inventory",
    items: [
      { label: "Gold purchases", href: "/dashboard/gold-purchases", Icon: Coins },
      { label: "Diamond purchases", href: "/dashboard/diamond-purchases", Icon: Gem },
      { label: "Karigar issues", href: "/dashboard/manufacturing/issues", Icon: Wrench },
      { label: "Karigar receipts", href: "/dashboard/manufacturing/receipts", Icon: PackageCheck },
    ],
  },
  {
    group: "Sales",
    items: [
      { label: "Approvals", href: "/dashboard/approvals", Icon: Handshake, keywords: ["trial"] },
      { label: "Invoices", href: "/dashboard/invoices", Icon: Receipt, keywords: ["bill"] },
      { label: "Payments", href: "/dashboard/payments", Icon: Wallet },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Audit log", href: "/dashboard/audit-log", Icon: Shield },
      { label: "Settings", href: "/dashboard/settings", Icon: FileText },
      {
        label: "Reference data",
        href: "/dashboard/settings/reference-data",
        Icon: FileText,
        keywords: ["catalog", "options", "specialization", "category"],
      },
      { label: "My sessions", href: "/dashboard/account/sessions", Icon: Shield },
    ],
  },
  {
    group: "Create",
    items: [
      { label: "New vendor", href: "/dashboard/vendors/new", Icon: Building2 },
      { label: "New customer", href: "/dashboard/customers/new", Icon: Users },
      { label: "New karigar", href: "/dashboard/karigars/new", Icon: Hammer },
      { label: "New gold purchase", href: "/dashboard/gold-purchases/new", Icon: Coins },
      { label: "New karigar issue", href: "/dashboard/manufacturing/issues/new", Icon: Wrench },
      { label: "New approval", href: "/dashboard/approvals/new", Icon: Handshake },
    ],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        {ITEMS.map((group, index) => (
          <div key={group.group}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => go(item.href)}
                >
                  <item.Icon className="mr-2 size-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        Tip: press <CommandShortcut>⌘K</CommandShortcut> anywhere.
      </div>
    </CommandDialog>
  );
}
