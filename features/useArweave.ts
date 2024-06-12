import { EthereumSigner } from "arbundles";
import { Contract, WarpFactory, WriteInteractionOptions } from "warp-contracts/web";
import { atom, useAtom } from "jotai";
import useAccount, { TAccount } from "./useAccount";
import { useEffect } from "react";

const LOCAL_STORAGE_PREFIX = "lag_ar_wallet";

const contractsAtom = atom<{ [contractAddress: string]: Contract }>({});
const walletAtom = atom<EthereumSigner | undefined>(undefined);
const isConnectingAccountAtom = atom(false);

export default function useArweave() {
  const { account } = useAccount();

  const [wallet, setWallet] = useAtom(walletAtom);
  const [isConnectingAccount, setIsConnectingAccount] = useAtom(isConnectingAccountAtom);
  const [contracts, setContracts] = useAtom(contractsAtom);

  useEffect(() => {
    account && connectAccount(account, process.env.NEXT_PUBLIC_ARWEAVE_SIGN_MSG!);
  }, [account]);

  const connectContract = (contractAddress: string) =>
    contracts[contractAddress] ||
    ((contract) => (
      setContracts({
        ...contracts,
        [contractAddress]: contract,
      }),
      contract
    ))(WarpFactory.forMainnet().contract(contractAddress));

  const connectAccount = async (account: TAccount, msgToSign: string) =>
    !isConnectingAccount &&
    (setIsConnectingAccount(true),
    (async (sk) => (setWallet(new EthereumSigner(sk)), _saveWalletSK(account, sk)))(
      getWalletSK(account) || (await account.sign(msgToSign)).substring(0, 66)
    ).then(() => setIsConnectingAccount(false)));

  const getWalletSK = (account: TAccount) =>
    localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${account.wallet.address}`);

  const _saveWalletSK = (account: TAccount, sk: string) =>
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${account.wallet.address}`, sk);

  const read = async (contract: Contract, input: {}): Promise<ReturnType<Contract["viewState"]>> =>
    contract.viewState(input);

  const readState = async (contract: Contract): Promise<ReturnType<Contract["readState"]>> =>
    contract.readState();

  const write = async (
    contract: Contract,
    input: unknown,
    options: WriteInteractionOptions
  ): Promise<ReturnType<Contract["writeInteraction"]> | undefined> =>
    wallet
      ? contract.connect(wallet).writeInteraction(input, options)
      : Promise.reject("Connect Arweave account before write interactions");

  return {
    isConnectingAccount,
    connectAccount,
    connectContract,
    contracts,
    read,
    readState,
    write,
    wallet,
  };
}
