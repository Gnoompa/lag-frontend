import { createContext } from "react";

interface IPeerContext {
    // Functions
    //   createPeer: (id?: string, peerOptions?: Peer.PeerJSOption) => void;
    //   connect: (id: string, peerConnectionOptions?: Peer.PeerConnectOption) => void;
    //   disconnect: () => void;

    //   // Properties
    //   isConnected: boolean;
}

export const PeerContext = createContext<IPeerContext | undefined>(undefined);
