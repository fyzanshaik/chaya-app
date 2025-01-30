"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDistricts, states } from "@/lib/utils/locationData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

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

const FarmerFormEditSchema = z.object({
  farmerName: z.string().min(1, "Farmer name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  gender: z.string().min(1, "Gender is required"),
  community: z.string().min(1, "Community is required"),
  aadharNumber: z.string().length(12, "Aadhar number must be 12 digits"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  mandal: z.string().min(1, "Mandal is required"),
  village: z.string().min(1, "Village is required"),
  panchayath: z.string().min(1, "Panchayath is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(18, "Age must be at least 18"),
  contactNumber: z.string().length(10, "Contact number must be 10 digits"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  branchName: z.string().min(1, "Branch name is required"),
  bankAddress: z.string().min(1, "Address is required"),
  bankName: z.string().min(1, "Bank name is required"),
  bankCode: z.string().min(1, "Bank code is required"),
});

type FarmerFormEditValues = z.infer<typeof FarmerFormEditSchema>;

export function FarmerFormEdit({
  farmerData,
  onSuccess,
}: {
  farmerData: Farmer;
  onSuccess?: () => void;
}) {
  const form = useForm<FarmerFormEditValues>({
    resolver: zodResolver(FarmerFormEditSchema),
    defaultValues: {
      farmerName: farmerData.name,
      relationship: farmerData.relationship,
      gender: farmerData.gender,
      community: farmerData.community,
      aadharNumber: farmerData.aadharNumber,
      state: farmerData.state,
      district: farmerData.district,
      mandal: farmerData.mandal,
      village: farmerData.village,
      panchayath: farmerData.panchayath,
      dateOfBirth: farmerData.dateOfBirth,
      age: farmerData.age,
      contactNumber: farmerData.contactNumber,
      accountNumber: farmerData.bankDetails.accountNumber,
      ifscCode: farmerData.bankDetails.ifscCode,
      branchName: farmerData.bankDetails.branchName,
      bankAddress: farmerData.bankDetails.address,
      bankName: farmerData.bankDetails.bankName,
      bankCode: farmerData.bankDetails.bankCode,
    },
  });

  const { toast } = useToast();
  const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);
  const [districtInput, setDistrictInput] = useState("");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const selectedState = form.watch("state");

  useEffect(() => {
    if (selectedState) {
      const districts = getDistricts(selectedState);
      setFilteredDistricts(districts);
      form.setValue("district", "");
      setDistrictInput("");
      setShowDistrictDropdown(true);
    } else {
      setFilteredDistricts([]);
      setShowDistrictDropdown(false);
    }
  }, [form, selectedState]);

  const handleDistrictInputChange = (value: string) => {
    setDistrictInput(value);
    form.setValue("district", value);

    if (selectedState) {
      const districts = getDistricts(selectedState);
      const filtered = districts.filter(district =>
        district.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDistricts(filtered);
      setShowDistrictDropdown(true);
    }
  };

  const handleDistrictSelect = (district: string) => {
    form.setValue("district", district);
    setDistrictInput(district);
    setShowDistrictDropdown(false);
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const onSubmit = async (data: FarmerFormEditValues) => {
    const formData = new FormData();

    // Append only changed fields
    Object.entries(data).forEach(([key, value]) => {
      if (farmerData[key as keyof Farmer] !== value) {
        formData.append(key, String(value));
      }
    });

    try {
      const response = await fetch(
        `http://localhost:3000/api/farmers/${farmerData.surveyNumber}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `Farmer updated successfully.`,
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        console.error(errorData.message);
        toast({
          title: "Error",
          description: "Failed to update farmer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to update farmer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <ScrollArea className="h-[80vh]">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <div className="space-y-4">
              <div>
                <Label htmlFor="farmerName">Farmer Name</Label>
                <Input
                  {...form.register("farmerName")}
                  id="farmerName"
                  placeholder="Farmer Name"
                />
                {form.formState.errors.farmerName && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.farmerName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Select
                  onValueChange={value => form.setValue("relationship", value)}
                  defaultValue={form.getValues("relationship")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELF">SELF</SelectItem>
                    <SelectItem value="SPOUSE">SPOUSE</SelectItem>
                    <SelectItem value="CHILD">CHILD</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.relationship && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.relationship.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  onValueChange={value => form.setValue("gender", value)}
                  defaultValue={form.getValues("gender")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">MALE</SelectItem>
                    <SelectItem value="FEMALE">FEMALE</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="community">Community</Label>
                <Select
                  onValueChange={value => form.setValue("community", value)}
                  defaultValue={form.getValues("community")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OBC">OBC</SelectItem>
                    <SelectItem value="OC">OC</SelectItem>
                    <SelectItem value="BC">BC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.community && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.community.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="aadharNumber">Aadhar Number</Label>
                <Input
                  {...form.register("aadharNumber")}
                  id="aadharNumber"
                  placeholder="Aadhar Number"
                />
                {form.formState.errors.aadharNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.aadharNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  {...form.register("dateOfBirth", {
                    onChange: e => {
                      const age = calculateAge(e.target.value);
                      form.setValue("age", age, { shouldValidate: true });
                    },
                  })}
                  id="dateOfBirth"
                  type="date"
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  {...form.register("age", { valueAsNumber: true })}
                  id="age"
                  type="number"
                  readOnly
                />
                {form.formState.errors.age && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.age.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  {...form.register("contactNumber")}
                  id="contactNumber"
                  placeholder="Contact Number"
                />
                {form.formState.errors.contactNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.contactNumber.message}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="location">
            <div className="space-y-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  onValueChange={value => form.setValue("state", value)}
                  defaultValue={form.watch("state")}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.state && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.state.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="Search or select a district"
                  value={districtInput}
                  onChange={e => handleDistrictInputChange(e.target.value)}
                  autoComplete="off"
                  onFocus={() => setShowDistrictDropdown(true)}
                />
                {showDistrictDropdown && filteredDistricts.length > 0 && (
                  <div className="border rounded-md mt-1 bg-white shadow-md">
                    {filteredDistricts.map(district => (
                      <div
                        key={district}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleDistrictSelect(district)}
                      >
                        {district}
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.district && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.district.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="mandal">Mandal</Label>
                <Input
                  {...form.register("mandal")}
                  id="mandal"
                  placeholder="Mandal"
                />
                {form.formState.errors.mandal && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.mandal.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="village">Village</Label>
                <Input
                  {...form.register("village")}
                  id="village"
                  placeholder="Village"
                />
                {form.formState.errors.village && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.village.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="panchayath">Panchayath</Label>
                <Input
                  {...form.register("panchayath")}
                  id="panchayath"
                  placeholder="Panchayath"
                />
                {form.formState.errors.panchayath && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.panchayath.message}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="bank">
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  {...form.register("accountNumber")}
                  id="accountNumber"
                  placeholder="Account Number"
                />
                {form.formState.errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.accountNumber.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  {...form.register("ifscCode")}
                  id="ifscCode"
                  placeholder="IFSC Code"
                />
                {form.formState.errors.ifscCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.ifscCode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  {...form.register("branchName")}
                  id="branchName"
                  placeholder="Branch Name"
                />
                {form.formState.errors.branchName && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.branchName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  {...form.register("bankAddress")}
                  id="address"
                  placeholder="Address"
                />
                {form.formState.errors.bankAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.bankAddress.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  {...form.register("bankName")}
                  id="bankName"
                  placeholder="Bank Name"
                />
                {form.formState.errors.bankName && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.bankName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="bankCode">Bank Code</Label>
                <Input
                  {...form.register("bankCode")}
                  id="bankCode"
                  placeholder="Bank Code"
                />
                {form.formState.errors.bankCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.bankCode.message}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Button type="submit" className="w-full">
          Update
        </Button>
      </form>
    </ScrollArea>
  );
}
