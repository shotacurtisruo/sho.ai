import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sho.ai - AI Chat Assistant",
  description: "Chat with AI powered by Google Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
