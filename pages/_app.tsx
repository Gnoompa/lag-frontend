"use client";

import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, PropsWithChildren } from "react";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { mantle } from "wagmi/chains";
import { http } from "wagmi";
import { Provider } from "jotai";
import { store } from "../state";
import Head from "next/head";
import Script from "next/script";
import { State } from "@/StateInit";
import { Footer } from "@/components/Footer";
import { AppProps } from "next/app";

export default function Providers(props: AppProps) {
  const { Component, pageProps } = props;

  const [queryClient] = useState(() => new QueryClient());

  const config = createConfig({
    chains: [mantle],
    transports: {
      [mantle.id]: http(),
    },
  });

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#070606" />
        <title>$LAG</title>
      </Head>

      <Script src="https://telegram.org/js/telegram-web-app.js" />

      <PrivyProvider
        appId="cltsh2wbj0161vzdwrozpkglu"
        config={{
          supportedChains: [mantle],
          defaultChain: mantle,
          appearance: {
            theme: "dark",
            accentColor: "#676FFF",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <Provider store={store}>
              <ArweaveProvider>
                <Component {...pageProps} />
                <State />
              </ArweaveProvider>
            </Provider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </>
  );
}

export const ArweaveProvider: React.FC<PropsWithChildren> = ({ children }) => {
  //   const { user } = usePrivy();

  return <>{children}</>;
};
