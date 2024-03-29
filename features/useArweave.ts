"use client"

import { EthereumSigner } from "arbundles";
import { useEffect, useState } from "react";
import { Contract, WarpFactory } from "warp-contracts/web";

export const ARWEAVE_CONTRACT = "8jyKj8JqddVkshuJPSuP7N3-g2Dxw7uEbJikd64p0iw"
const SIGN_MSG = "linkedlagarwallet";

export default function useArweave(address: string | undefined, sign: (msg: string) => Promise<string>, autoAuth: boolean = false) {
    const [ready, setReady] = useState(false)    

    useEffect(() => {
        address ? autoAuth && sign && auth(address, sign) : setReady(false)
    }, [address, autoAuth])

    const auth = async (address: string, sign: (msg: string) => Promise<string>) =>
        address && sign && !_getLinkedArWallet(address) ? WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).connect(await _getArWallet(address, sign)).writeInteraction({
            function: "auth",
            user: address
        }).then(() => setReady(true)) : setReady(true)

    const write: Contract["writeInteraction"] = async (input, options) =>
        ready ? WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).connect(await _getArWallet(address!, sign)).writeInteraction(input, options) : null


    const read: Contract["viewState"] = async (input) =>
        WarpFactory.forMainnet().contract(ARWEAVE_CONTRACT).viewState(input)

    const _getArWallet = async (address: string, sign: (msg: string) => Promise<string>) =>
        (async (savedPk) =>
            savedPk ? new EthereumSigner(savedPk) :
                ((pk) => (_setLinkedArWallet(`ar${address}`, pk), new EthereumSigner(pk)))((await sign(SIGN_MSG)).substring(0, 66))
        )(_getLinkedArWallet(address))

    const _getLinkedArWallet = (address: string) =>
        localStorage.getItem(`ar${ARWEAVE_CONTRACT}${address}`);

    const _setLinkedArWallet = (address: string, pk: string) =>
        localStorage.setItem(`ar${ARWEAVE_CONTRACT}${address}`, pk);

    return {
        auth,
        ready,
        write,
        read
    }
}