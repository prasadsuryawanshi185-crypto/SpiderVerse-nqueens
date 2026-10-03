import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spider-Verse: N-Queens Challenge",
  description: "Every dimension has a solution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="halftone-overlay"></div>
        {children}
      </body>
    </html>
  );
}
