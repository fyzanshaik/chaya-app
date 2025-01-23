"use client";

import { Button } from "@/components/ui/button";
import AppSidebar from "../components/AppSidebar";
import DetailsTable from "../components/DetailsTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FarmerForm } from "../components/FarmerForm";
import { useAuthStore } from "@/lib/utils/authStore";
import { useEffect, useState } from "react";
import { withAuth } from "@/lib/protectedRoute";

type Gender = "MALE" | "FEMALE" | "OTHER";
type Community = "GENERAL" | "OBC" | "BC" | "SC" | "ST";

interface Farmer {
  id: number;
  name: string;
  relationship: string;
  gender: Gender;
  community: Community;
  aadharNumber: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  panchayath: string;
  dateOfBirth: string;
  age: number;
  contactNumber: string;
  accountNumber: string;
}

const FormPage = () => {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuthStore();
  const { token } = useAuthStore.getState();
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchFarmers = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch("/api/farmers?all=true", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch farmers");
          }
          const data = await response.json();
          setFarmers(data.farmers);
          setIsLoading(false);
        } catch (err) {
          setError("Error fetching farmers data");
          setIsLoading(false);
          console.log(err);
          console.log(error);
        }
      }
    };
    fetchFarmers();
  }, [isAuthenticated, isLoading, token]);

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

  if (!isAuthenticated) {
    return null;
  }

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
        <div className="flex flex-col">
          <p className="text-3xl font-semibold mb-4">Dashboard</p>
          <div className="ml-auto flex gap-2 mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>ADD FARMER DATA</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Add Farmer Data</DialogTitle>
                </DialogHeader>
                <FarmerForm />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Export Document</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export as</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>CSV</DropdownMenuItem>
                <DropdownMenuItem>Json</DropdownMenuItem>
                <DropdownMenuItem>XLSX</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Farmer Data</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailsTable data={farmers} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default withAuth(FormPage);
