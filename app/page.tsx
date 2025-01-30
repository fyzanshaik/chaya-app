"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/utils/authStore";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/signin");
    }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(134,236,154)]">
        <Card className="w-64 h-64 flex items-center justify-center shadow-lg">
          <CardContent>
            <h1 className="text-4xl font-bold text-[rgb(134,236,154)]">
              Chaya
            </h1>
            <div className="mt-4 w-12 h-12 border-4 border-[rgb(134,236,154)] border-t-[rgb(134,236,154,0.3)] rounded-full animate-spin"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
