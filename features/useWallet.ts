"use client";

import { ConnectedWallet, User, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";


export default function useWallet() {
    const { ready, user, authenticated, unlinkWallet, signMessage: embeddedSignMessage } = usePrivy();
    const { wallets } = useWallets();

    const [embeddedWallet, setEmbeddedWallet] = useState<ConnectedWallet>();
    const [externalWallet, setExternalWallet] = useState<ConnectedWallet>();
    const [linkedWallets, setLinkedWallets] = useState<User["linkedAccounts"]>();
    const [signFn, setSignFn] = useState<(msg: string) => Promise<string>>();

    // @ts-ignore
    const isEmbeddedWalletOnly = !!global.Telegram?.WebApp?.initData;

    const lastLinkedExternalWallet =
        ready && authenticated
            ? wallets.filter((wallet) => wallet.walletClientType !== "privy")[0]
            : undefined;

    useEffect(() => {
        user &&
            wallets &&
            ready &&
            authenticated &&
            (setEmbeddedWallet(wallets.filter((wallet) => wallet.walletClientType == "privy")[0]),
                setLinkedWallets(user?.linkedAccounts.filter((account) => account.type == "wallet")));
    }, [ready, wallets, user]);

    useEffect(() => {
        isEmbeddedWalletOnly
            ? embeddedWallet && setSignFn(embeddedSignMessage)
            : wallets[0]
                ?.getEthereumProvider()
                .then((provider) =>
                    setSignFn(() => (message: string) =>
                        provider.request({ method: "personal_sign", params: [message, wallets[0].address] })
                    )
                );
    }, [embeddedSignMessage, embeddedWallet, externalWallet]);

    const unlinkWallets = () =>
        Promise.all(
            user?.linkedAccounts
                ? user?.linkedAccounts.map(
                    (account) =>
                        account.type == "wallet" &&
                        account.connectorType !== "embedded" &&
                        unlinkWallet(account.address)
                )
                : []
        );

    return {
        isEmbeddedWalletOnly,
        embeddedWallet,
        externalWallet,
        signFn,
        linkedWallets,
        lastLinkedExternalWallet,
        unlinkWallets,
    };
}
