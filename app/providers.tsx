"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode, PropsWithChildren } from "react";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { mantle } from "wagmi/chains";
import { http } from "wagmi";
import { Provider } from "jotai";
import { store } from "./state";

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const config = createConfig({
    chains: [mantle],
    transports: {
      [mantle.id]: http(),
    },
  });

  return (
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
            <ArweaveProvider>{props.children}</ArweaveProvider>
          </Provider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export const ArweaveProvider: React.FC<PropsWithChildren> = ({ children }) => {
  //   const { user } = usePrivy();

  return <>{children}</>;
};
