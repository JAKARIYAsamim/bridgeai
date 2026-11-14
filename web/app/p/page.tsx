"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ParentIndex() {
  const router = useRouter();
  useEffect(() => router.replace("/p/today"), [router]);
  return null;
}
