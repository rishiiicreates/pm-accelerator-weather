import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Under The Weather • Real-Time Meteorological Intelligence",
  description: "Real-time weather data retrieval, 5-day forecasting, interactive map spatial tracking, and persistent SQLite CRUD management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#fbfbfd] text-[#222222] antialiased selection:bg-[#7e43fd] selection:text-white">
        {children}
      </body>
    </html>
  );
}
