import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ProtectedAdminRoute from "@/components/extras/protectedAdminRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Boss Section",
  description: "This is the Boss section and Boss have all the power",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProtectedAdminRoute>
          {children}
        </ProtectedAdminRoute>
      </body>
    </html>
  );
}
