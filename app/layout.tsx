import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Dental Implant Consultation | Pallant Advanced Dentistry",
  description:
    "Find out if dental implants are right for you. Book your free consultation with our award-winning team in Chichester, West Sussex.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
