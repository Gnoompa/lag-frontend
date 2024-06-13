import { EthereumSigner } from "arbundles";
import { Contract, WarpFactory, WriteInteractionOptions } from "warp-contracts/web";
import { atom, useAtom, useSetAtom } from "jotai";
import { accountAtom, TAccount } from "./useAccount";
import { ACTION_TYPES, IState } from "lag-types";
import { Address, Hex } from "viem";
import { useEffect } from "react";
import { privateKeyToAddress } from "viem/accounts";

const LOCAL_STORAGE_PREFIX = "lag_ar_wallet";

export const contractsAtom = atom<{ [contractAddress: string]: Contract }>({});
export const walletAtom = atom<EthereumSigner | undefined>(undefined);
export const walletAddressAtom = atom<Address | undefined>(undefined);
export const isConnectingAccountAtom = atom(false);

export default function useArweave() {
  const setAccount = useSetAtom(accountAtom);
  const [wallet, setWallet] = useAtom(walletAtom);
  const [isConnectingAccount, setIsConnectingAccount] = useAtom(isConnectingAccountAtom);
  const [contracts, setContracts] = useAtom(contractsAtom);

  const connectContract = <S = unknown>(contractAddress: string) =>
    (contracts[contractAddress] as Contract<S>) ||
    ((contract) => (
      setContracts({
        ...contracts,
        [contractAddress]: contract,
      }),
      contract
    ))(WarpFactory.forMainnet().contract<S>(contractAddress));

  const connectAccount = async (account: TAccount) =>
    !isConnectingAccount &&
    account.sign &&
    (setIsConnectingAccount(true),
      (async (sk) => (
        setWallet(new EthereumSigner(sk)),
        _saveWalletSK(account, sk),
        setAccount((old) => ({ ...old, arweaveAddress: privateKeyToAddress(sk as Hex) }))
      ))(
        getWalletSK(account) ||
        (await account.sign(process.env.NEXT_PUBLIC_ARWEAVE_SIGN_MSG!)).substring(0, 66)
      ).then(() => setIsConnectingAccount(false)));

  const getWalletSK = (account: TAccount) =>
    account.evmWallet?.address &&
    localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${account.evmWallet.address}`);

  const _saveWalletSK = (account: TAccount, sk: string) =>
    account.evmWallet?.address &&
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${account.evmWallet.address}`, sk);

  type TInput<P> = P extends undefined
    ? {}
    : {
      [id in keyof P]: P[keyof P];
    } & {
      function: string;
    };

  const read = async <S, A extends (...args: any) => any>(
    contract: Contract<S>,
    action: string,
    input?: Parameters<A>[0]
  ) =>
    contract.viewState<TInput<typeof input>, ReturnType<A>>({ function: action, ...input });

  // const readState = async (
  //   contract: Contract
  // ): Promise<Awaited<ReturnType<Contract["readState"]>>> => contract.readState();

  const write = async (
    contract: Contract,
    action: ACTION_TYPES,
    input?: {},
    options?: WriteInteractionOptions
  ): Promise<Awaited<ReturnType<Contract<IState>["writeInteraction"]>> | undefined> =>
    wallet
      ? contract.connect(wallet).writeInteraction({ function: action, ...(input || {}) }, options)
      : Promise.reject("Connect Arweave account before write interactions");

  return {
    isConnectingAccount,
    connectAccount,
    connectContract,
    contracts,
    read,
    write,
    wallet,
  };
}
