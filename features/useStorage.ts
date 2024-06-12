import useArweave from "./useArweave";

export default function useStorage() {
    const {
        connectContract: arweaveConnectContract,
        write: arweaveWrite,
        read: arweaveRead,
    } = useArweave();

    const arweaveStorageContract = arweaveConnectContract(
        process.env.NEXT_PUBLIC_ARWEAVE_STORAGE_CONTRACT_ADDRESS!
    );

    const create = (type: string, payload: {}) => arweaveWrite(arweaveStorageContract, type, payload);

    const read = (type: string) => arweaveRead(arweaveStorageContract, type);

    const update = (type: string, payload: {}) => arweaveWrite(arweaveStorageContract, type, payload);

    const remove = (type: string, payload: {}) => arweaveWrite(arweaveStorageContract, type, payload);

    return {
        create,
        read,
        update,
        remove,
    };
}
