import type { Metadata } from "next";
import { Montserrat, DM_Sans } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import ConditionalLayout from "@/components/ConditionalLayout";
import { MobileSidebarProvider } from "@/components/MobileSidebar";
import MiniPlayer from "@/components/MiniPlayer";
import { QueryProvider } from "@/providers/QueryProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dopadaily",
  description: "A therapeutic productivity app for focus and mental wellness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${dmSans.variable}`}>
      <body className="antialiased bg-surface text-on-surface">
        <QueryProvider>
          <MobileSidebarProvider>
            <ConditionalSidebar />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <MiniPlayer />
          </MobileSidebarProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
