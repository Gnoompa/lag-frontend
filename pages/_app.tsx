"use client";

// import "./globals.css";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, PropsWithChildren, useEffect } from "react";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { mainnet, mantle } from "wagmi/chains";
import { http } from "wagmi";
import { Provider } from "jotai";
import { store } from "../state";
import Head from "next/head";
import Script from "next/script";
import { State } from "@/StateInit";
import { AppProps } from "next/app";
import { ChakraProvider, Spinner } from "@chakra-ui/react";
import { theme } from "../theme";
import { useRouter } from "next/router";
import Page from ".";
import useWallet from "@/features/useWallet";
import useArweave from "@/features/useArweave";

export default function Providers(props: AppProps) {
  const router = useRouter();

  const { Component, pageProps } = props;

  const [queryClient] = useState(() => new QueryClient());

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const config = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  });

  return !hasMounted ? (
    <></>
  ) : (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0E1111" />
        <title>DoubleTap</title>
      </Head>
      <PrivyProvider
        appId="cltsh2wbj0161vzdwrozpkglu"
        config={{
          supportedChains: [mainnet],
          defaultChain: mainnet,
          // @ts-ignore
          loginMethods: ["email", ...(global.Telegram?.WebApp.initData ? [] : ["wallet"])],
          appearance: {
            theme: "#0E1111",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <Provider store={store}>
              <ArweaveProvider>
                <ChakraProvider theme={theme}>
                  <ComponentWrapper {...props} />
                </ChakraProvider>
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

export const ComponentWrapper: React.FC<AppProps> = (props) => {
  const [isValidPasscode, setIsValidPasscode] = useState<boolean>();

  const { ready, user, login, authenticated } = usePrivy();
  const { signFn } = useWallet();
  const { write, ready: arReady, auth, isLoading, getArWallet } = useArweave(user?.wallet?.address);

  const [hasLoggedIn, setHasLoggedIn] = useState<boolean>();

  useEffect(() => {
    setIsValidPasscode(global.localStorage?.getItem("loginpasscode") === "lagin");
  }, []);

  useEffect(() => {
    ready && setHasLoggedIn(!!(getArWallet(user?.wallet?.address!) && signFn && authenticated));
  }, [ready, authenticated, user, signFn]);

  return isValidPasscode ? (
    hasLoggedIn === undefined ? (
      <Spinner
        pos={"fixed"}
        w={"2rem"}
        h={"2rem"}
        top={"calc(50%  - 1rem)"}
        left={"calc(50%  - 1rem)"}
      ></Spinner>
    ) : hasLoggedIn ? (
      <props.Component {...props.pageProps} />
    ) : (
      <Page />
    )
  ) : (
    <Page />
  );
};
