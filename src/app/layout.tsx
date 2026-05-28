import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Client Closing Agent — Turn Inquiries Into Booked Calls",
  description: "AI-powered lead qualification and booking system for agencies, freelancers, coaches, and service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#05070f]"><div className="animated-mesh"><div className="neural-grid" /><div className="flow-line top-[18%] left-0" /><div className="flow-line top-[64%] left-0 [animation-delay:2s]" /></div>{children}</body>
    </html>
  );
}
