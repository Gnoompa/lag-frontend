"use client";

import { ConnectedWallet, User, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export default function useWallet() {
    const { ready, user, authenticated, unlinkWallet } = usePrivy();
    const { wallets } = useWallets();

    const [wallet, setWallet] = useState<ConnectedWallet>();
    const [linkedWallets, setLinkedWallets] = useState<User["linkedAccounts"]>();

    // @ts-ignore
    const isEmbeddedWalletOnly = global.Telegram ? !!global.Telegram?.WebApp?.initData : undefined;
    const lastLinkedExternalWallet = ready && authenticated ? wallets.filter(
        (wallet) => wallet.walletClientType !== "privy"
    )[0] : undefined

    useEffect(() => {
        user &&
            wallets &&
            ready &&
            authenticated &&
            (setWallet(wallets.filter((wallet) => wallet.walletClientType == "privy")[0]),
                setLinkedWallets(user?.linkedAccounts.filter((account) => account.type == "wallet")));
    }, [ready, wallets, user]);

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
        wallet,
        linkedWallets,
        lastLinkedExternalWallet,
        unlinkWallets,
    };
}
