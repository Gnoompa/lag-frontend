"use client";

import { Wallet, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import useTelegram from "./useTelegram";
import { Account } from "viem";
import { atom, useAtom } from "jotai";

export type TAccount = {
  wallet: Wallet | Account;
  sign: (msg: string) => Promise<string>;
};

const accountAtom = atom<TAccount | undefined>(undefined);

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
    inTelegram;
  }, [inTelegram]);

  useEffect(() => {
    inTelegram &&
      telegramReady &&
      telegramCloudWallet &&      
      setAccount({
        wallet: telegramCloudWallet,
        sign: (message) => telegramCloudWallet.signMessage({ message }),
      });

    inTelegram === false &&
      privyReady &&
      privyUser &&
      privyAuthenticated &&
      setAccount({
        wallet: privyUser.wallet as Wallet,
        sign: privySignMessage,
      });
  }, [account, inTelegram, telegramReady, telegramCloudWallet, privyReady, privyUser, privyAuthenticated]);

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
