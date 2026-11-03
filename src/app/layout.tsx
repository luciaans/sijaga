import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SIJAGA | Sistem Kedisiplinan Santri",
    template: "SIJAGA | %s",
  },
  description: "Sistem Informasi Jejak dan Administrasi Pelanggaran Santri",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<Toaster position="top-right" richColors /></body></html>;
}
