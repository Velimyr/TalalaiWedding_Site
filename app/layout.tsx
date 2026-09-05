import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import { BOOK } from "@/config/book";
import "./globals.css";

const bodyFont = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BOOK.siteUrl),
  title: BOOK.title,
  description: BOOK.shortDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: BOOK.siteUrl,
    siteName: BOOK.title,
    title: BOOK.title,
    description: BOOK.shortDescription,
    images: [
      {
        url: BOOK.coverSrc,
        width: 1200,
        height: 630,
        alt: BOOK.coverAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BOOK.title,
    description: BOOK.shortDescription,
    images: [BOOK.coverSrc],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
