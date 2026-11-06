import type { Metadata } from "next";
import { LoginLayout } from "@/components/auth/login-layout";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return <LoginLayout />;
}
