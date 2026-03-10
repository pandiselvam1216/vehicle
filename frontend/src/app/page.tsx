"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? "/dashboard" : "/auth/login");
    }
  }, [user, isLoading, router]);
  return null;
}
