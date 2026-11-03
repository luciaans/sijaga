import type { Metadata } from "next";
import { LoginLayout } from "@/components/auth/login-layout";

export const metadata: Metadata = { title: "Login Ustadz/Ustadzah" };

export default function UstadzLoginPage() {
  return <LoginLayout role="ustaz" />;
}
