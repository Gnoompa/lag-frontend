import { createContext } from "react";

interface IModalContext {
    isOpen: boolean,
    open: Function,
    close: Function
}

export const ModalContext = createContext<IModalContext | undefined>(undefined);
