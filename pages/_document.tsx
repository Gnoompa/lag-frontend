import { Html, Main, NextScript, Head } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=KoHo:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        {/* <Script strategy="beforeInteractive" src="/vendor" referrerPolicy="same-origin"></Script> */}
        <Script
          strategy="beforeInteractive"
          src="/tg.js"
        ></Script>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
