import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import useAccount, { TAccount } from "./useAccount";
import useStorage from "./useStorage";
import { ACTION_TYPES, TUser } from "lag-types";

export const currentUserAtom = atom<TUser | undefined>(undefined);
export const isRegisteringAtom = atom(false);
export const hasRegisteredAtom = atom<boolean | undefined>(undefined);

export default function useUser() {
  const { create: storageCreate, read: storageRead } = useStorage();
  const { account } = useAccount();

  const [hasRegistered, setHasRegistered] = useAtom(hasRegisteredAtom);
  const [isRegistering, setIsRegistering] = useAtom(isRegisteringAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    account && getUser(account).then((user) => user && setCurrentUser(user));
  }, [account]);

  const register = async (account: TAccount, { invitedBy }: { invitedBy?: string }) =>
    !isRegistering &&
    account.evmWallet?.address &&
    (setIsRegistering(true),
    storageCreate(ACTION_TYPES.CREATE_USER, {
      evmAddress: account.evmWallet.address,
      ...(invitedBy && { invitedBy }),
    })
      .then(() => setHasRegistered(true))
      .finally(() => setIsRegistering(false)));

  const getUser = async (account: TAccount) =>
    account.arweaveAddress &&
    storageRead(ACTION_TYPES.GET_USER, { userId: account.arweaveAddress }).then((a) => a.result);

  return {
    register,
    hasRegistered,
    isRegistering,
    currentUser,
  };
}
