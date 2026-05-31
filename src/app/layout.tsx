import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EQR NLP Macro Forecast Demo",
  description: "Research dashboard for Korean macro-impact forecasts from low-friction news events.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
