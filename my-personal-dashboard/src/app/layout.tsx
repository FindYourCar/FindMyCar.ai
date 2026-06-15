import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { CurrencyProvider } from "@/lib/currency";
import NotificationsInit from "@/components/NotificationsInit";
import AddToHomeScreenBanner from "@/components/AddToHomeScreenBanner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Personal budget and task dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashboard",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0d0d0d] text-white`}
      >
        <CurrencyProvider>
          <NotificationsInit />
          <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
          </div>
          <AddToHomeScreenBanner />
        </CurrencyProvider>
      </body>
    </html>
  );
}
