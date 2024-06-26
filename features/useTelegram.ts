"use client";

import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Address, Hex, LocalAccount } from "viem";
import {
  generatePrivateKey,
  privateKeyToAddress,
  signMessage,
  signTransaction,
  signTypedData,
  toAccount,
} from "viem/accounts";

const WALLET_STORAGE_KEY = "wallet_sk";
const globalTelegram = global.Telegram;

const readyAtom = atom(false);
const inTelegramAtom = atom<boolean | undefined>(undefined);
const cloudWalletAtom = atom<LocalAccount | undefined>(undefined);

export default function useTelegram() {
  const [ready, setReady] = useAtom(readyAtom);
  const [inTelegram, setInTelegram] = useAtom(inTelegramAtom);
  const [cloudWallet, setCloudWallet] = useAtom(cloudWalletAtom);

  useEffect(() => {
    setInTelegram(!!globalTelegram?.WebApp?.initData);
  }, []);

  useEffect(() => {
    inTelegram &&
      globalTelegram.WebApp.CloudStorage.getItem(
        WALLET_STORAGE_KEY,
        (error, walletSK) => (
          walletSK ? setCloudWallet(_SKToAccount(walletSK as Address)) : generateCloudWallet(),
          setReady(true),
          error && console.error(error)
        )
      );
  }, [inTelegram]);

  const generateCloudWallet = (cb?: (error: string | null) => any) =>
    inTelegram &&
    !cloudWallet &&
    ((sk) =>
      globalTelegram.WebApp.CloudStorage.setItem(WALLET_STORAGE_KEY, sk, (error, succeeded) =>
        succeeded ? (setCloudWallet(_SKToAccount(sk)), cb?.(null)) : cb?.(error)
      ))(generatePrivateKey());

  return {
    ready,
    inTelegram,
    cloudWallet,
    generateCloudWallet,
  };
}

const _SKToAccount = (sk: Hex) =>
  toAccount({
    address: privateKeyToAddress(sk),
    async signMessage({ message }) {
      return signMessage({ message, privateKey: sk });
    },
    async signTransaction(transaction) {
      return signTransaction({ privateKey: sk, transaction });
    },
    async signTypedData(typedData) {
      return signTypedData({ ...typedData, privateKey: sk });
    },
  });
