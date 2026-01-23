import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "./providers";
import { Header } from "@/components/header";

const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "CogEvo Event Connect",
  description: "イベント特化型セールス支援ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className={cn(notoSansJP.variable, "font-sans antialiased bg-gray-100 min-h-screen")}>
          <SettingsProvider>
            {/* Mobile-first container: centered and max-width on larger screens */}
            <main className="max-w-md mx-auto min-h-screen bg-background relative shadow-xl overflow-hidden flex flex-col">
              <Header />
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </main>
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
