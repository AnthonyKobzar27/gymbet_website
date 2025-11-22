import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import HeaderWrapper from "@/components/HeaderWrapper";
import SwipeNavigation from "@/components/SwipeNavigation";
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
  themeColor: "#fdcff3",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
            <SwipeNavigation>
              <main className="min-h-screen">{children}</main>
            </SwipeNavigation>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
