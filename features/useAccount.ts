"use client";

import { Wallet, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import useTelegram from "./useTelegram";
import { Account, Address } from "viem";
import { atom, useAtom, useAtomValue } from "jotai";
import { walletAddressAtom as arweaveWalletAddressAtom } from "./useArweave";

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
  const arweaveWalletAddress = useAtomValue(arweaveWalletAddressAtom);

  const ready = privyReady && (inTelegram ? telegramReady : true);
  const authenticated = inTelegram ? true : privyAuthenticated;

  useEffect(() => {
    inTelegram;
  }, [inTelegram]);

  useEffect(() => {
    inTelegram &&
      telegramReady &&
      telegramCloudWallet &&
      setAccount({
        evmWallet: telegramCloudWallet,
        sign: (message) => telegramCloudWallet.signMessage({ message }),
      });

    inTelegram === false &&
      privyReady &&
      privyUser &&
      privyAuthenticated &&
      setAccount({
        evmWallet: privyUser.wallet as Wallet,
        sign: privySignMessage,
      });
  }, [
    account,
    inTelegram,
    telegramReady,
    telegramCloudWallet,
    privyReady,
    privyUser,
    privyAuthenticated,
  ]);

  const login = async () =>
    inTelegram
      ? telegramReady && generateTelegramCloudWallet(Promise.reject)
      : privyReady && privyLogin();

  return {
    ready,
    account,
    authenticated,
    login,
  };
}
