import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pixel Punch AI", template: "%s | Pixel Punch AI" },
  description: "AI-native product and engineering for the companies building what's next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0f] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
