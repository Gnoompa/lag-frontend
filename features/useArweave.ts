"use client";

import { EthereumSigner } from "arbundles";
import { useEffect, useState } from "react";
import { Contract, WarpFactory } from "warp-contracts/web";

export const ARWEAVE_CONTRACT = "-wxZt4O9aUi5SnnLjFwaEmtdjIncxid31Qxe73VmS9M";
const SIGN_MSG = "__linkedarwallet";

const contract = WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).setEvaluationOptions({
    remoteStateSyncEnabled: true,
});

export default function useArweave(
    address: string | undefined,
    sign: (msg: string) => Promise<string>,
    autoAuth: boolean = false
) {
    const LINKED_WALLET_STORAGE_ID = `ar${ARWEAVE_CONTRACT}${address}`

    const [ready, setReady] = useState(false);

    useEffect(() => {
        address ? autoAuth && sign && auth(address, sign) : setReady(false);
    }, [address, autoAuth]);

    const auth = async (address: string, sign: (msg: string) => Promise<string>) => {
        const arWallet = await _getArWallet(address, sign)
        //@ts-ignore
        address && sign && !_getLinkedArWallet(address)
            ? contract
                .connect(arWallet.wallet)
                .writeInteraction({
                    function: "auth",
                    user: address,
                })
                .then(() => (setReady(true), _setLinkedArWallet(address, arWallet.pk)))
            : setReady(true);
    }

    const write: Contract["writeInteraction"] = async (input, options) =>
        ready
            ? contract.connect((await _getArWallet(address!, sign)).wallet).writeInteraction(input, options)
            : null;

    const read: Contract["viewState"] = async (input) => contract.viewState(input);

    const _getArWallet = async (address: string, sign: (msg: string) => Promise<string>) =>
        (async (savedPk) =>
            savedPk
                ? { wallet: new EthereumSigner(savedPk), pk: savedPk }
                : ((pk) => ({ wallet: new EthereumSigner(pk), pk }))(
                    (await sign(SIGN_MSG)).substring(0, 66)
                ))(_getLinkedArWallet(address));

    const _getLinkedArWallet = (address: string) =>
        localStorage.getItem(LINKED_WALLET_STORAGE_ID);

    const _setLinkedArWallet = (address: string, pk: string) =>
        localStorage.setItem(LINKED_WALLET_STORAGE_ID, pk);

    return {
        auth,
        ready,
        write,
        read,
    };
}
