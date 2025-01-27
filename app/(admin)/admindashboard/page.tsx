"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { User, useAuthStore } from "@/lib/utils/authStore";
import AppSidebar from "@/app/(dashboard)/components/AppSidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const { setUser, setIsAuthenticated, isAuthenticated, hydrated } =
    useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/signin");
    }
  }, [hydrated, isAuthenticated, router]);

  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      fetchUsers();
    }
  }, [hydrated, isAuthenticated]);

  // const handleToggleStatus = async (user: User) => {
  //   try {
  //     const response = await fetch(`/api/users/${user.id}/toggle-status`, {
  //       method: "PUT",
  //     });
  //     if (!response.ok) {
  //       throw new Error("Failed to toggle user status");
  //     }
  //     toast({
  //       title: "Success",
  //       description: `User status toggled successfully.`,
  //     });
  //     fetchUsers();
  //   } catch (error) {
  //     console.error("Error toggling user status:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to toggle user status. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsAuthenticated(false);
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const TableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Active</TableHead>
          {/* <TableHead>Actions</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-8" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex h-screen w-full">
      <Sidebar className="border-r border-border">
        <SidebarContent>
          <SidebarHeader></SidebarHeader>
          <AppSidebar />
          <SidebarFooter>
            <Button onClick={handleLogout} className="mt-4">
              Logout
            </Button>
          </SidebarFooter>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-5">Admin Dashboard</h1>
        {isLoading || !hydrated ? (
          <TableSkeleton />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.isActive === true ? "Yes" : "No"}</TableCell>
                  {/* <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user)}
                      className="mr-2"
                    >
                      Toggle Status
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>
    </div>
  );
}
