"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { ShoppingBag } from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center mr-8">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="font-bold text-xl">amazontools.in</span>
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/dashboard" legacyBehavior passHref>
                <NavigationMenuLink 
                  className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === "/dashboard" && "text-primary"
                  )}
                >
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/tools/ppc-optimizer" legacyBehavior passHref>
                <NavigationMenuLink 
                  className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === "/tools/ppc-optimizer" && "text-primary"
                  )}
                >
                  PPC Optimizer
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/tools/brand-analyzer" legacyBehavior passHref>
                <NavigationMenuLink 
                  className={cn(
                    navigationMenuTriggerStyle(),
                    pathname === "/tools/brand-analyzer" && "text-primary"
                  )}
                >
                  Brand Analyzer
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}