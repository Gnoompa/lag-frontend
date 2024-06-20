import { ACTION_TYPES, IActions, IState } from "lag-types";
import useArweave from "./useArweave";
import { useMemo } from "react";

export default function useStorage() {
  const {
    connectContract: arweaveConnectContract,
    write: arweaveWrite,
    read: arweaveRead,
  } = useArweave();

  const arweaveStorageContract = useMemo(
    () => arweaveConnectContract<IState>(process.env.NEXT_PUBLIC_ARWEAVE_STORAGE_CONTRACT_ADDRESS!),
    []
  );

  const read = <A extends keyof IActions>(
    action: A,
    payload?: Parameters<IActions[typeof action]>[0]
  ) =>
    arweaveRead<IState, IActions[A]>(arweaveStorageContract, action, payload).then(
      (response) => response?.result
    );

  const _arWrite = <A extends keyof IActions>(
    action: ACTION_TYPES,
    payload: Parameters<IActions[typeof action]>[0] | null | undefined,
    options?: {}
  ) => arweaveWrite<IState, IActions[A]>(arweaveStorageContract, action, payload, options);

  const create = _arWrite;
  const update = _arWrite;
  const remove = _arWrite;

  return {
    create,
    read,
    update,
    remove,
  };
}
