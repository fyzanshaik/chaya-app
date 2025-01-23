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
import { Edit2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/utils/authStore";

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
}

interface Column {
  id: keyof Farmer;
  label: string;
  isVisible: boolean;
}

export default function DetailsTable({ data }: { data: Farmer[] }) {
  const initialColumns: Column[] = [
    { id: "id", label: "Id", isVisible: true },
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
  ];

  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const { user } = useAuthStore();

  const toggleColumn = (columnId: keyof Farmer) => {
    setColumns(
      columns.map(col =>
        col.id === columnId ? { ...col, isVisible: !col.isVisible } : col
      )
    );
  };

  const resetColumns = () => {
    setColumns(initialColumns);
  };

  const visibleColumns = columns.filter(col => col.isVisible);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {columns.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.isVisible}
                onCheckedChange={() => toggleColumn(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuCheckboxItem
              onCheckedChange={resetColumns}
              className="mt-2"
            >
              Reset to Default
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(column => (
                <TableHead key={column.id}>{column.label}</TableHead>
              ))}
              <TableHead
                className={user?.role != "admin" ? "hidden" : "text-right"}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(farmer => (
              <TableRow key={farmer.id}>
                {visibleColumns.map(column => (
                  <TableCell key={column.id}>{farmer[column.id]}</TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={user?.role != "admin"}
                      className={user?.role != "admin" ? "hidden" : ""}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={user?.role != "admin"}
                      className={user?.role != "admin" ? "hidden" : ""}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
