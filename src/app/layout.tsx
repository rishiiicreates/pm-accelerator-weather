import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weather Intelligence Platform | PM Accelerator",
  description: "Real-time weather data retrieval, 5-day forecasting, interactive map spatial tracking, and persistent SQLite CRUD management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
