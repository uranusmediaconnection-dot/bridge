import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../lib/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bringenton-Cosmic V1.2 Lab — Web Intelligence Suite",
  description:
    "Advanced web scraping, search aggregation, and AI-powered data extraction platform. Extract insights from the web with multiple engines.",
  keywords: [
    "web scraping",
    "search engine",
    "data extraction",
    "AI swarm",
    "BeautifulSoup",
    "Selenium",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Bringenton-Cosmic V1.2 Lab — Web Intelligence Suite",
    description:
      "Advanced web scraping, search aggregation, and AI-powered data extraction platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
