"use client";

import { EthereumSigner } from "arbundles";
import { useEffect, useState } from "react";
import { Contract, WarpFactory } from "warp-contracts/web";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";

export const ARWEAVE_CONTRACT = "PsB8l_vStWnEcIP5WSSiGiVSVVBsHHaq9LzYTX4Ik2g";
const SIGN_MSG = "__linkedarwallet";

// const getContract = () => WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).setEvaluationOptions({
//   remoteStateSyncEnabled: true,
// });

const getContract = () => WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT);

export default function useArweave(address: string | undefined) {
  const LINKED_WALLET_STORAGE_ID = `ar${ARWEAVE_CONTRACT}${address}`;

  const [ready, setReady] = useState(false);
  const [arWallet, setArWallet] = useState<PrivateKeyAccount>()

  useEffect(() => {
    // @ts-ignore
    address && _getLinkedArWallet() && setArWallet(privateKeyToAccount(_getLinkedArWallet()))
  }, [address])

  const auth = async (address: string, sign: (msg: string) => Promise<string>) => {
    const arWallet = await _getArWallet(address, sign);

    //@ts-ignore
    address && sign && !_getLinkedArWallet(address)
      ? getContract()
        .connect(arWallet.wallet)
        .writeInteraction({
          function: "auth",
          evmAddress: address,
        })
        .then(() => (setReady(true), _setLinkedArWallet(arWallet.pk)))
      : setReady(true);
  };

  const write: Contract["writeInteraction"] = async (input, options) =>
    ready
      ? getContract()
        .connect(new EthereumSigner(await _getLinkedArWallet()!))
        .writeInteraction(input, options)
      : null;

  const read: Contract["viewState"] = async (input) => getContract().viewState(input);

  const readState: Contract["readState"] = async () => getContract().readState();

  const _getArWallet = async (address: string, sign: (msg: string) => Promise<string>) =>
    (async (savedPk) =>
      savedPk
        ? { wallet: new EthereumSigner(savedPk), pk: savedPk }
        : ((pk) => ({ wallet: new EthereumSigner(pk), pk }))(
          (await sign(SIGN_MSG)).substring(0, 66)
        ))(_getLinkedArWallet());

  const _getLinkedArWallet = () => localStorage.getItem(LINKED_WALLET_STORAGE_ID);

  const _setLinkedArWallet = (pk: string) => localStorage.setItem(LINKED_WALLET_STORAGE_ID, pk);

  return {
    auth,
    arWallet,
    ready,
    write,
    read,
    readState
  };
}
