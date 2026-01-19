import type { Metadata } from "next";
import { Barlow_Condensed, Rubik } from "next/font/google";
import "./globals.css";

const rubikRegular = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["400"],
});

const barlowCondensedExtrabold = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow",
  weight: ["800"],
});

export const metadata: Metadata = {
  title: "Game of Tag | Víc, než jen hra",
  description: "V Game of Tag spolu soupeří tři týmy o to, který z nich probehně Prahou jako první dříve, než ho chytí lovci.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlowCondensedExtrabold.variable} ${rubikRegular.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
