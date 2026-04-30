"use client";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    checkAuth();
  }, [router]);
  const checkAuth = async () => {
    const res: any = await authService.checkAuth();
    if (res.isAuthenticated === true && res.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/admin");
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />
      {/* Offset content by sidebar width */}
      <div className="flex-1 ml-56 min-w-0">{children}</div>
    </div>
  );
}
