import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sijaga-ponpes-al-jihad.web.id"),
  title: {
    default: "SIJAGA | Masuk",
    template: "SIJAGA | %s",
  },
  description: "Mencatat dan memantau kedisiplinan santri Pondok Pesantren Al-Jihad dengan lebih teratur.",
  applicationName: "SIJAGA",
  openGraph: {
    title: "SIJAGA | Masuk",
    description: "Mencatat dan memantau kedisiplinan santri Pondok Pesantren Al-Jihad dengan lebih teratur.",
    url: "https://sijaga-ponpes-al-jihad.web.id",
    siteName: "SIJAGA",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIJAGA | Masuk",
    description: "Mencatat dan memantau kedisiplinan santri Pondok Pesantren Al-Jihad dengan lebih teratur.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<Toaster position="top-right" richColors /></body></html>;
}
