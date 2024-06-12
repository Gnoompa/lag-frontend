import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import useAccount, { TAccount } from "./useAccount";
import useStorage from "./useStorage";

export const currentUserAtom = atom(undefined);
export const isRegisteringAtom = atom(false);
export const hasRegisteredAtom = atom<boolean | undefined>(undefined);

export default function useUser() {
  const { create: storageCreate, read: storageRead } = useStorage();
  const { account } = useAccount();

  const [hasRegistered, setHasRegistered] = useAtom(hasRegisteredAtom);
  const [isRegistering, setIsRegistering] = useAtom(isRegisteringAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    account && getUser(account).then((user) => user && setCurrentUser(user))
  }, [
    account  
  ]);

  const register = async (account: TAccount, { invitedBy }: { invitedBy?: string }) =>
    !isRegistering &&
    (setIsRegistering(true),
    storageCreate("auth", {
      evmAddress: account.wallet.address,
      ...(invitedBy && { invitedBy }),
    }).finally(() => setIsRegistering(false)));

const getUser = async (account: TAccount) => 
    storageRead("")

  return {    
    register,
    hasRegistered,
    isRegistering,
    currentUser,
  };
}
