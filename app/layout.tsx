import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeaderWrapper from "@/components/HeaderWrapper";
import TabBar from "@/components/TabBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GymBet",
  description: "Discipline challenge community - Bet on your goals and win rewards!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <HeaderWrapper />
            <main className="min-h-screen pb-[70px] lg:pb-0">{children}</main>
            <TabBar />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
