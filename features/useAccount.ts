"use client";

import { Wallet, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import useTelegram from "./useTelegram";
import { Account, Address } from "viem";
import { atom, useAtom } from "jotai";

export type TAccount = {
  evmWallet?: Wallet | Account;
  arweaveAddress?: Address;
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

  const [account, setAccount] = useAtom(accountAtom);

  const ready = privyReady && (inTelegram ? telegramReady : true);
  const authenticated = inTelegram ? true : privyAuthenticated;

  useEffect(() => {
    inTelegram &&
      telegramReady &&
      !account &&
      setAccount(
        telegramCloudWallet
          ? {
              evmWallet: telegramCloudWallet,
              sign: (message) => telegramCloudWallet.signMessage({ message }),
            }
          : undefined
      );
  }, [account, inTelegram, telegramReady, telegramCloudWallet]);

  useEffect(() => {
    privyReady &&
      privyUser &&
      setAccount(
        privyUser
          ? {
              evmWallet: privyUser.wallet as Wallet,
              sign: privySignMessage,
            }
          : undefined
      );
  }, [privyReady, privyUser]);

  const login = () =>
    inTelegram ? true : privyReady && !authenticated ? (privyLogin(), false) : true;

  return {
    ready,
    account,
    authenticated,
    login,
  };
}
