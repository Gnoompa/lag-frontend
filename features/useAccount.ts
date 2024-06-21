"use client";

import { Wallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect } from "react";
import useTelegram from "./useTelegram";
import { Account, Address } from "viem";
import { atom, useAtom } from "jotai";
import useArweave from "./useArweave";

export type TAccount = {
  evmWallet?: Wallet | Account;
  arweaveAddress?: Address;
  getAddress?: () => Address;
  sign?: (msg: string) => Promise<string>;
};

export const accountAtom = atom<TAccount | undefined>(undefined);

export default function useAccount() {
  const {
    inTelegram,
    ready: telegramReady,
    cloudWallet: telegramCloudWallet,
    generateCloudWallet: generateTelegramCloudWallet,
  } = useTelegram();

  const {
    ready: privyReady,
    user: privyUser,
    login: privyLogin,
    authenticated: privyAuthenticated,
    signMessage: privySignMessage,
  } = usePrivy();

  const { wallets: privyWallets } = useWallets();

  const privyWallet = privyWallets[0];

  const { connectAccount } = useArweave();

  const [account, setAccount] = useAtom(accountAtom);

  const ready = privyReady && (inTelegram ? telegramReady && account : true);
  const authenticated = inTelegram ? !!account : privyAuthenticated;

  useEffect(() => {
    inTelegram &&
      telegramReady &&
      !account &&
      setAccount(
        telegramCloudWallet
          ? {
              evmWallet: telegramCloudWallet,
              getAddress: () => telegramCloudWallet.address,
              sign: (message) => telegramCloudWallet.signMessage({ message }),
            }
          : undefined
      );
  }, [account, inTelegram, telegramReady, telegramCloudWallet]);

  useEffect(() => {
    privyReady &&
      privyUser &&
      privyWallet &&
      setAccount({
        evmWallet: privyUser.wallet as Wallet,
        getAddress: () => privyWallet.address as Address,
        sign: (message) =>
          privyWallet.getEthereumProvider().then((provider) =>
            provider.request({
              method: "personal_sign",
              params: [message, privyWallet.address],
            })
          ),
      });
  }, [privyReady, privyUser, privyWallet]);

  useEffect(() => {
    privyReady &&
      privyUser &&
      privyAuthenticated &&
      account &&
      privyWallet &&
      connectAccount(account);
  }, [account, privyReady, privyUser, privyAuthenticated, privyWallet]);

  const login = async () =>
    ready &&
    (inTelegram
      ? account && connectAccount(account).then(() => Promise.resolve())
      : !authenticated || !privyWallet
      ? privyLogin()
      : Promise.resolve());

  return {
    ready,
    account,
    authenticated,
    login,
  };
}
