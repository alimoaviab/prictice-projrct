"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLiveClassesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/live-class");
  }, [router]);

  return null;
}
