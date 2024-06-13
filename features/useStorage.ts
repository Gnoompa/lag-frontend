import { ACTION_TYPES, IActions, IState } from "lag-types";
import useArweave from "./useArweave";

export default function useStorage() {
  const {
    connectContract: arweaveConnectContract,
    write: arweaveWrite,
    read: arweaveRead,
  } = useArweave();

  const arweaveStorageContract = arweaveConnectContract<IState>(
    process.env.NEXT_PUBLIC_ARWEAVE_STORAGE_CONTRACT_ADDRESS!
  );

  const create = (action: ACTION_TYPES, payload?: {}) =>
    arweaveWrite(arweaveStorageContract, action, payload);

  const read = <A extends keyof IActions>(
    action: A,
    payload?: Parameters<IActions[typeof action]>[0]
  ) => arweaveRead<IState, IActions[A]>(arweaveStorageContract, action, payload);

  const update = (action: ACTION_TYPES, payload?: {}) =>
    arweaveWrite(arweaveStorageContract, action, payload);

  const remove = (action: ACTION_TYPES, payload?: {}) =>
    arweaveWrite(arweaveStorageContract, action, payload);

  return {
    create,
    read,
    update,
    remove,
  };
}
