import type { Metadata } from "next";
import { LoginLayout } from "@/components/auth/login-layout";

export const metadata: Metadata = { title: "Login Admin" };

export default function AdminLoginPage() {
  return <LoginLayout role="admin" />;
}
