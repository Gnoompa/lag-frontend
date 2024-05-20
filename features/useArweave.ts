"use client";

import { EthereumSigner } from "arbundles";
import { useEffect, useState } from "react";
import { Contract, WarpFactory } from "warp-contracts/web";
import { Address, PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { useAtom } from "jotai";
import { arWalletIsReadyAtom } from "@/state";

export const ARWEAVE_CONTRACT = "PV_nDov3BoBFvAiY8j-SQwAe39EARXYXm9pM9tbV2EE";
const SIGN_MSG = "Login into DoubleTap";

// const getContract = () => WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).setEvaluationOptions({
//   remoteStateSyncEnabled: true,
// });

const getContract = () => WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT);

export default function useArweave(address: string | undefined) {
  const LINKED_WALLET_STORAGE_ID = `ar${ARWEAVE_CONTRACT}${address}`;

  const [isLoading, setIsLoading] = useState(true);
  const [ready, setReady] = useAtom(arWalletIsReadyAtom);
  // const [ready, setReady] = useState(false);
  const [arWallet, setArWallet] = useState<PrivateKeyAccount>()

  useEffect(() => {
    // @ts-ignore
    ready && address && _getLinkedArWallet() && setArWallet(getArWallet())
  }, [ready, address])

  const auth = async (address: string, sign: (msg: string) => Promise<string>, invitedBy: string = "") => {
    if (_getLinkedArWallet(address)) {
      setReady(true);
      setIsLoading(false)

      return;
    }

    const arWallet = await _getArWallet(address, sign);

    //@ts-ignore
    arWallet && address && sign
      ? getContract()
        .connect(arWallet.wallet)
        .writeInteraction({
          function: "auth",
          evmAddress: address,
          invitedBy
        })
        .then(() => (setReady(true), _setLinkedArWallet(arWallet.pk))).finally(() => setIsLoading(false))
      : (setReady(false), setIsLoading(false));
  };

  const write: Contract["writeInteraction"] = async (input, options) =>
    ready
      ? getContract()
        .connect(new EthereumSigner(await _getLinkedArWallet()!))
        .writeInteraction(input, options)
      : null;

  const read: Contract["viewState"] = async (input) => getContract().viewState(input);

  const readState: Contract["readState"] = async () => getContract().readState();

  const _getArWallet = async (address: string, sign: (msg: string) => Promise<string | undefined>) =>
    (async (savedPk) =>
      savedPk
        ? { wallet: new EthereumSigner(savedPk), pk: savedPk }
        : ((pk) => pk ? { wallet: new EthereumSigner(pk), pk } : undefined)(
          (await sign(SIGN_MSG).catch(() => { }))?.substring(0, 66)
        ))(_getLinkedArWallet());

  const _getLinkedArWallet = (address?: string) => localStorage.getItem(address ? `ar${ARWEAVE_CONTRACT}${address}` : LINKED_WALLET_STORAGE_ID);

  const _setLinkedArWallet = (pk: string) => localStorage.setItem(LINKED_WALLET_STORAGE_ID, pk);

  const getArWallet = (address: string) => _getLinkedArWallet(address) ? privateKeyToAccount(_getLinkedArWallet(address) as Address) : undefined

  return {
    auth,
    arWallet,
    getArWallet,
    isLoading,
    ready,
    write,
    read,
    readState
  };
}
