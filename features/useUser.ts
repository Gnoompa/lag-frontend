import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";
import useAccount, { TAccount } from "./useAccount";
import useStorage from "./useStorage";
import { ACTION_TYPES, EActivityTypes, TGang, TUser } from "lag-types";
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";

export const currentUserAtom = atom<TUser | undefined>(undefined);
export const isRegisteringAtom = atom(false);
export const hasRegisteredAtom = atom<boolean | undefined>(undefined);

export default function useUser(options?: { autoLogin: boolean }) {
  const { create: storageCreate, read: storageRead } = useStorage();
  const { account, login, authenticated, ready } = useAccount();

  const [isLoading, setIsLoading] = useState(true);
  const [hasRegistered, setHasRegistered] = useAtom(hasRegisteredAtom);
  const [isRegistering, setIsRegistering] = useAtom(isRegisteringAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  const [isWriting, setIsWriting] = useState(false);

  const currentUserScore =
    currentUser?.currentGang &&
    currentUser?.score[`${EActivityTypes.GANG}_${currentUser.currentGang}`];

  useDeepCompareEffectNoCheck(() => {
    options?.autoLogin && ready && login();
  }, [options, ready]);

  useEffect(() => {
    console.log(currentUser);
    account &&
      (!currentUser || currentUser.id !== account.arweaveAddress) &&
      !isRegistering &&
      (setIsLoading(true),
      getUser(account).then((user) =>
        user ? setCurrentUser(user) : (register(account).then(loadCurrentUser), user)
      ));

    ready && !account && (setHasRegistered(false), setCurrentUser(undefined), setIsLoading(false));

    currentUser && (setHasRegistered(true), setIsLoading(false));
  }, [account, currentUser, ready]);

  const register = async (account: TAccount, { invitedBy }: { invitedBy?: string } = {}) =>
    !isRegistering &&
    account.evmWallet?.address &&
    (setIsRegistering(true),
    setIsWriting(true),
    storageCreate(ACTION_TYPES.CREATE_USER, {
      evmAddress: account.evmWallet.address,
      ...(invitedBy && { invitedBy }),
    })
      .then(() => setHasRegistered(true))
      .catch(console.error)
      .finally(() => (setIsRegistering(false), setIsWriting(true))));

  const getUser = async (account: TAccount) =>
    account.arweaveAddress &&
    storageRead(ACTION_TYPES.GET_USER, { userId: account.arweaveAddress });

  const getScore = (user: TUser, gangId: TGang["id"], activity = EActivityTypes.GANG) =>
    user.score[`${activity}_${gangId}`];

  const setGang = async (gangId: TGang["id"]) =>
    currentUser &&
    (setIsWriting(true),
    storageCreate(ACTION_TYPES.SET_USER_GANG, {
      gang: gangId,
    })
      .then(loadCurrentUser)
      .finally(() => setIsWriting(false)));

  const getGang = async (user: TUser) => user.currentGang;

  const getCurrentGang = async (user: TUser) => user.currentGang && getGang(user);

  const loadCurrentUser = () =>
    account && getUser(account).then((user) => user && (setCurrentUser(user), user));

  return {
    ready,
    isLoading,
    login,
    register,
    authenticated,
    hasRegistered,
    isRegistering,
    isWriting,
    setGang,
    getGang,
    getCurrentGang,
    getScore,
    currentUser,
    currentUserScore,
    loadCurrentUser,
  };
}
