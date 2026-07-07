import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css"; // Import global styles

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Pixel Punch AI", template: "%s | Pixel Punch AI" },
  description: "AI-native product and engineering for the companies building what's next.",
  icons: {
    icon: "/Pixelpunch_logo2.png",
    shortcut: "/Pixelpunch_logo2.png",
    apple: "/Pixelpunch_logo2.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
