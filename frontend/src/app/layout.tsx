import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autocari — AI Product Recommendations",
  description:
    "AI shopping advisor untuk pasar Indonesia. Temukan produk terbaik dengan rekomendasi AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="autocari" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-base-200 text-base-content">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
