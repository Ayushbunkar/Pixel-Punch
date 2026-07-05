import type { Metadata } from "next";

import { Toaster } from "react-hot-toast";

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
    <html lang="en">
      <head>
        <link rel="icon" href="/Pixelpunch_logo2.png" type="image/png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
