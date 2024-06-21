import { EthereumSigner } from "arbundles";
import {
  Contract,
  InteractionResult,
  WarpFactory,
  WriteInteractionOptions,
} from "warp-contracts/web";
import { atom, useAtom, useSetAtom } from "jotai";
import { accountAtom, TAccount } from "./useAccount";
import { Address, Hex } from "viem";
import { privateKeyToAddress } from "viem/accounts";

const LOCAL_STORAGE_PREFIX = "lag_ar_wallet";

export const contractsAtom = atom<{ [contractAddress: string]: Contract }>({});
export const walletAtom = atom<EthereumSigner | undefined>(undefined);
export const walletAddressAtom = atom<Address | undefined>(undefined);
export const isConnectingAccountAtom = atom(false);
export const QueueAtom = atom<Record<string, Promise<any>>>({});
export const stateCacheAtom = atom<{} | undefined>(undefined);

export default function useArweave() {
  const setAccount = useSetAtom(accountAtom);
  const [wallet, setWallet] = useAtom(walletAtom);
  const [isConnectingAccount, setIsConnectingAccount] = useAtom(isConnectingAccountAtom);
  const [contracts, setContracts] = useAtom(contractsAtom);
  const [queue, setQueue] = useAtom(QueueAtom);

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
    (async (sk) =>
      sk &&
      (setWallet(
        // @ts-ignore
        ((wallet) => ((wallet.getAddress = () => privateKeyToAddress(sk as Hex)), wallet))(
          new EthereumSigner(sk)
        )
      ),
      _saveWalletSK(account, sk),
      setAccount((old) => ({
        ...old,
        arweaveAddress: privateKeyToAddress(sk as Hex),
        getAddress: () => privateKeyToAddress(sk as Hex),
      }))))(
      getWalletSK(account) ||
        (
          await account.sign(process.env.NEXT_PUBLIC_ARWEAVE_SIGN_MSG!).catch(() => undefined)
        )?.substring(0, 66)
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
    (queue[_getRequestId(action, input)] as Promise<InteractionResult<S, ReturnType<A>>>) ||
    ((request) => (setQueue({ ...queue, [_getRequestId(action, input)]: request }), request))(
      contract
        .viewState<TInput<typeof input>, ReturnType<A>>({ function: action, ...input })
        .finally(
          ((queueId) => () => (_removeQueueItem(queueId), null))(_getRequestId(action, input))
        )
    );

  const readState = async <S>(contract: Contract<S>) => contract.readState();

  const write = async <S, A extends (...args: any) => any>(
    contract: Contract<S>,
    action: string,
    input?: Parameters<A>[0] | null,
    options?: WriteInteractionOptions
  ): Promise<Awaited<ReturnType<Contract<S>["writeInteraction"]>> | undefined> =>
    wallet
      ? contract
          .connect(wallet)
          .writeInteraction<typeof input>({ function: action, ...(input || {}) }, options)
      : Promise.reject("Connect Arweave account before write interactions");

  const _getRequestId = (action: string, input = {}) => `${action}_${JSON.stringify(input)}`;

  const _removeQueueItem = (itemId: string) =>
    setQueue((queue) =>
      Object.keys(queue).reduce(
        (acc, id) => ({ ...acc, ...(id != itemId && { [id]: queue[id] }) }),
        {}
      )
    );

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
