"use client";

import "./globals.css";
import { Footer } from "@/components/Footer";
import { State } from "./StateInit";
import { Providers } from "./providers";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#D4C1B0" />
        <title>$LAG</title>
      </head>
      <body style={{ background: "linear-gradient(#D4C1B0,#FEFCFF)" }}>
        <Script src="https://telegram.org/js/telegram-web-app.js" />
        <Providers>
          {children}
          <State />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
