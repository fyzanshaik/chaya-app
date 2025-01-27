"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Inbox, User, Settings, Users } from "lucide-react";
import { useAuthStore } from "@/lib/utils/authStore";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-300 rounded-md ${className}`} />
);

const AppSidebar = () => {
  const { user } = useAuthStore();

  const items = [
    ...(user?.role?.toLowerCase() === "admin"
      ? [
          {
            title: "Admin Dashboard",
            url: "/admindashboard",
            icon: Users,
          },
        ]
      : []),
    {
      title: "User Dashboard",
      url: "/dashboard",
      icon: Inbox,
    },
    {
      title: "Profile",
      url: "/",
      icon: User,
    },
    {
      title: "Settings",
      url: "/",
      icon: Settings,
    },
  ];

  return (
    <>
      <div className="p-1">
        <ModeToggle />
      </div>
      <div className="text-3xl font-bold px-2 mb-2">Chaya</div>
      <div className="text-l font-semibold px-2">
        {!user ? (
          <Skeleton className="h-5 w-3/5 mb-" />
        ) : (
          `${user?.name} - ${user?.role}`
        )}
      </div>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {!user
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <SidebarMenuItem key={idx}>
                    <Skeleton className="h-5 w-full my-2" />
                  </SidebarMenuItem>
                ))
              : items.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default AppSidebar;
