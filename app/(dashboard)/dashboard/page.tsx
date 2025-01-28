"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Gender = "MALE" | "FEMALE" | "OTHER";
type Community = "GENERAL" | "OBC" | "BC" | "SC" | "ST";
type FarmerDocs = {
  profilePicUrl: string;
  aadharDocUrl: string;
  bankDocUrl: string;
};
type FarmerField = {
  areaHa: number;
  yieldEstimate: number;
  location: {
    lat: number;
    lng: number;
  };
  landDocumentUrl: string;
};
type BankDetails = {
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  address: string;
  bankName: string;
  bankCode: string;
};
interface Farmer {
  id: number;
  surveyNumber: string;
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
  createdAt: string;
  createdBy: {
    name: string;
  };
  documents: FarmerDocs;
  fields: FarmerField[];
  bankDetails: BankDetails;
}

type SearchType = "name" | "state" | "surveyNumber";

export default function UserDashboard() {
  const { user, isAuthenticated, hydrated, setUser, setIsAuthenticated } =
    useAuthStore();
  const router = useRouter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("name");
  const { toast } = useToast();

  useEffect(() => {
    if (hydrated) {
      if (!isAuthenticated) {
        router.push("/signin");
      }
    }
  }, [hydrated, isAuthenticated, router]);

  const fetchFarmers = async () => {
    if (hydrated) {
      if (!isAuthenticated) {
        return;
      }
    }
    setIsLoading(true);
    try {
      let url = "/api/farmers";
      if (searchTerm) {
        url += `?${searchType}=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch farmers");
      }
      const data = await response.json();
      setFarmers(data.farmers);
    } catch (err) {
      console.error("Error fetching farmers data", err);
      toast({
        title: "Error",
        description: "Failed to fetch farmers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      fetchFarmers();
    }
  }, [hydrated, isAuthenticated]);

  const filteredFarmers = farmers.filter(farmer => {
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    if (searchType === "name") {
      return farmer.name.toLowerCase().includes(normalizedSearchTerm);
    } else if (searchType === "state") {
      return farmer.state.toLowerCase().includes(normalizedSearchTerm);
    } else if (searchType === "surveyNumber") {
      return farmer.surveyNumber.toLowerCase().includes(normalizedSearchTerm);
    } else {
      return true; // Return all farmers if no searchType matches
    }
  });

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

  const handleSearch = () => {
    setIsLoading(true);
  };

  const deleteFarmer = async (surveyNumber: string) => {
    try {
      const response = await fetch(`/api/farmers/${surveyNumber}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete farmer");
      }
      toast({
        title: "Success",
        description: "Farmer deleted successfully",
      });
      await fetchFarmers(); // Refresh the data
    } catch (error) {
      console.error("Error deleting farmer:", error);
      toast({
        title: "Error",
        description: "Failed to delete farmer. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                <FarmerForm onSuccess={fetchFarmers} />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={user?.role.toLowerCase() !== "admin"}
                  className={
                    user?.role.toLowerCase() !== "admin" ? "hidden" : ""
                  }
                  variant="outline"
                >
                  Export Document
                </Button>
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
            <div className="flex gap-2 mb-4">
              <Select
                value={searchType}
                onValueChange={(value: SearchType) => setSearchType(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Farmer Name</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="surveyNumber">Survey Number</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <DetailsTable
              isLoading={isLoading}
              data={filteredFarmers}
              onDelete={deleteFarmer}
              onEdit={fetchFarmers}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
