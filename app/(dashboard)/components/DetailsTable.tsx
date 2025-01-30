"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, FileText, Sprout } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/utils/authStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FarmerFormEdit } from "./FarmerFormEdit";

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

interface Column {
  id: keyof Farmer;
  label: string;
  isVisible: boolean;
}

const TableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Gender</TableHead>
        <TableHead>Contact</TableHead>
        <TableHead>State</TableHead>
        <TableHead>District</TableHead>
        <TableHead>Mandal</TableHead>
        <TableHead>Village</TableHead>
        <TableHead>Panchayath</TableHead>
        <TableHead>Date of Birth</TableHead>
        <TableHead>Age</TableHead>
        <TableHead>Documents</TableHead>
        <TableHead>Fields</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function DetailsTable({
  data,
  isLoading,
  onDelete,
  onEdit
}: {
  data: Farmer[];
  isLoading: boolean;
  onDelete: (surveyNumber: string) => Promise<void>;
  onEdit: () => Promise<void>;
}) {
  const initialColumns: Column[] = [
    { id: "id", label: "Id", isVisible: false },
    { id: "surveyNumber", label: "Farmer Survey No.", isVisible: false },
    { id: "createdBy", label: "Created By", isVisible: false },
    { id: "name", label: "Name", isVisible: true },
    { id: "relationship", label: "Relationship", isVisible: false },
    { id: "gender", label: "Gender", isVisible: true },
    { id: "community", label: "Community", isVisible: false },
    { id: "aadharNumber", label: "Aadhar Number", isVisible: false },
    { id: "contactNumber", label: "Contact", isVisible: true },
    { id: "state", label: "State", isVisible: true },
    { id: "district", label: "District", isVisible: true },
    { id: "mandal", label: "Mandal", isVisible: true },
    { id: "village", label: "Village", isVisible: true },
    { id: "panchayath", label: "Panchayath", isVisible: true },
    { id: "dateOfBirth", label: "Date of Birth", isVisible: true },
    { id: "age", label: "Age", isVisible: true },
    { id: "documents", label: "Documents", isVisible: true },
    { id: "fields", label: "Fields", isVisible: true },
  ];

  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const { user } = useAuthStore();
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const handleEditFarmer = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
  };

  const toggleColumn = (columnId: keyof Farmer) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId ? { ...col, isVisible: !col.isVisible } : col
      )
    );
  };

  const resetColumns = () => {
    setColumns(initialColumns);
  };

  const visibleColumns = columns.filter(col => col.isVisible);

  const fetchDocumentUrl = async (type: string, surveyNumber: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/documents/${type}/${surveyNumber}/url`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch document URL");
      }
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="h-72 w-[200px]">
            <ScrollArea className="h-72">
              <div className="p-1">
                <DropdownMenuCheckboxItem
                  onCheckedChange={resetColumns}
                  className="mt-2"
                >
                  Reset to Default
                </DropdownMenuCheckboxItem>
                {columns.map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.isVisible}
                    onCheckedChange={() => toggleColumn(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(column => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
                <TableHead
                  className={
                    user?.role.toLowerCase() !== "admin"
                      ? "hidden"
                      : "text-center"
                  }
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(farmer => (
                <TableRow key={farmer.id}>
                  {visibleColumns.map(column => {
                    if (column.id === "documents") {
                      return (
                        <TableCell
                          key={column.id}
                          className="flex items-center justify-center"
                        >
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Fetch Documents</DialogTitle>
                              </DialogHeader>
                              <div className="py-7 flex justify-around">
                                <Button
                                  onClick={() =>
                                    fetchDocumentUrl(
                                      "profile-pic",
                                      farmer.surveyNumber
                                    )
                                  }
                                >
                                  Get Profile Pic
                                </Button>
                                <Button
                                  onClick={() =>
                                    fetchDocumentUrl(
                                      "aadhar",
                                      farmer.surveyNumber
                                    )
                                  }
                                >
                                  Get Aadhar Doc
                                </Button>
                                <Button
                                  onClick={() =>
                                    fetchDocumentUrl(
                                      "bank",
                                      farmer.surveyNumber
                                    )
                                  }
                                >
                                  Get Bank Doc
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      );
                    } else if (column.id === "fields") {
                      return (
                        <TableCell key={column.id}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Sprout className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Fields</DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col gap-2 p-4 border rounded-lg">
                                <p>
                                  <strong>Area (Ha):</strong>{" "}
                                  {farmer.fields[0]?.areaHa}
                                </p>
                                <p>
                                  <strong>Yield Estimate:</strong>{" "}
                                  {farmer.fields[0]?.yieldEstimate}
                                </p>
                                <Button
                                  onClick={() =>
                                    fetchDocumentUrl(
                                      "land",
                                      farmer.surveyNumber
                                    )
                                  }
                                >
                                  Get Land Doc
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      );
                    } else if (column.id === "createdBy") {
                      return (
                        <TableCell key={column.id}>
                          {farmer.createdBy.name}
                        </TableCell>
                      );
                    } else if (column.id === "bankDetails") {
                      return "";
                    } else {
                      return (
                        <TableCell key={column.id}>
                          {farmer[column.id]}
                        </TableCell>
                      );
                    }
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={user?.role.toLowerCase() !== "admin"}
                            className={
                              user?.role.toLowerCase() !== "admin"
                                ? "hidden"
                                : ""
                            }
                            onClick={() => handleEditFarmer(farmer)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Edit Farmer Data</DialogTitle>
                          </DialogHeader>
                          {selectedFarmer && (
                            <FarmerFormEdit
                              farmerData={selectedFarmer}
                              onSuccess={onEdit}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={user?.role.toLowerCase() !== "admin"}
                            className={
                              user?.role.toLowerCase() !== "admin"
                                ? "hidden"
                                : ""
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the farmer&apos;s data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(farmer.surveyNumber)}
                              className="bg-red-600 dark:bg-red-500 dark:text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
