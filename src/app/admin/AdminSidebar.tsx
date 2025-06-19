"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Users,
  MessageSquare,
  Flag,
  Settings,
  Home,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/admin/reports", icon: Flag, label: "Reports" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/content", icon: MessageSquare, label: "Content" },
  { href: "/admin/performance", icon: Zap, label: "Performance" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Shield className="size-6 text-primary" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Button
            key={href}
            asChild
            variant={pathname.startsWith(href) ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
          >
            <Link href={href}>
              <Icon className="size-5" />
              {label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="mt-auto border-t p-4">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start gap-3"
        >
          <Link href="/">
            <Home className="size-5" />
            Back to App
          </Link>
        </Button>
      </div>
    </aside>
  );
}
