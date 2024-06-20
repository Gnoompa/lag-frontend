import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { mainnet, mantle } from "wagmi/chains";
import { http } from "wagmi";
import { Provider as JotaiProvider } from "jotai";
import { store } from "../state";
import Head from "next/head";
import { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../theme";
import Layout from "@/components/Layout";

export default function Page(props: AppProps) {
  const queryClient = new QueryClient();

  const config = createConfig({
    chains: [mainnet, mantle],
    transports: {
      [mainnet.id]: http(),
      [mantle.id]: http(),
    },
  });

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0E1111" />
        <title>LAG</title>
      </Head>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          supportedChains: [mainnet],
          defaultChain: mainnet,
          loginMethods: ["email", "wallet"],
          appearance: {
            theme: "#0E1111",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <JotaiProvider store={store}>
              <ChakraProvider theme={theme}>
                <Layout {...props} />
              </ChakraProvider>
            </JotaiProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </>
  );
}
