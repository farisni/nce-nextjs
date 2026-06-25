"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navItems = [
  { href: "/itles", label: "ITLES", icon: BookOpenText },
  { href: "/table", label: "Table", icon: Table2 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative shrink-0 bg-background text-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent after:content-[''] md:sticky md:top-0 md:flex md:h-svh md:w-56 md:flex-col md:px-4 md:py-8 md:after:inset-x-auto md:after:inset-y-8 md:after:right-0 md:after:h-auto md:after:w-px md:after:bg-gradient-to-b lg:w-60">
      <div className="hidden flex-col gap-1 md:flex">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:pl-10">
          Navigation
        </p>
      </div>
      <NavigationMenu
        viewport={false}
        orientation="vertical"
        className="block w-full max-w-none flex-none justify-start overflow-x-auto px-3 py-2 [mask-image:linear-gradient(to_right,transparent,black_18px,black_calc(100%-18px),transparent)] md:min-h-0 md:flex-1 md:overflow-y-auto md:px-0 md:py-3 md:[mask-image:linear-gradient(to_bottom,transparent,black_22px,black_calc(100%-22px),transparent)]"
      >
        <NavigationMenuList className="flex-row justify-center gap-1 md:flex-col md:items-start md:justify-start md:pl-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <NavigationMenuItem
                key={item.href}
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-md transition-colors hover:bg-accent/60 focus-within:bg-accent/60 data-[active=true]:bg-accent",
                  isActive && "bg-accent",
                )}
              >
                <NavigationMenuLink
                  asChild
                  active={isActive}
                  className={cn(
                    "h-7 w-fit flex-row items-center gap-2 rounded-md px-2 py-0 text-[13.5px] font-medium leading-none text-muted-foreground hover:text-foreground focus:bg-transparent focus:text-foreground data-[active=true]:text-foreground",
                    isActive && "text-foreground",
                  )}
                >
                  <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </aside>
  );
}