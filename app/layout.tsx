import type { Metadata, Viewport } from "next";
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

// Site configuration
const siteConfig = {
  name: "Dopadaily",
  description: "A therapeutic productivity app for focus and mental wellness. Build healthy habits, track your progress, and join a supportive community.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://app.dopadaily.org",
  ogImage: "/og-image.png",
  twitterImage: "/twitter-image.png",
  creator: "@dopadaily",
  keywords: [
    "productivity",
    "focus",
    "mental wellness",
    "meditation",
    "pomodoro",
    "focus timer",
    "habit tracker",
    "ambient sounds",
    "concentration",
    "mindfulness",
    "wellness app",
    "therapeutic",
    "dopamine",
    "daily habits",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9ddcf" },
    { media: "(prefers-color-scheme: dark)", color: "#2b231e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: "Dopadaily Team" }],
  creator: siteConfig.creator,
  publisher: siteConfig.name,

  // Favicon and icons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#b89c86" },
    ],
  },

  // Web app manifest
  manifest: "/site.webmanifest",

  // Apple specific
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },

  // Format detection
  formatDetection: {
    telephone: false,
  },

  // Canonical URL
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Focus, Wellness, Productivity`,
        type: "image/png",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.twitterImage],
    creator: siteConfig.creator,
    site: siteConfig.creator,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification (add your actual verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },

  // App-specific
  applicationName: siteConfig.name,
  category: "productivity",

  // Other
  other: {
    "msapplication-TileColor": "#b89c86",
    "msapplication-config": "/browserconfig.xml",
  },
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
