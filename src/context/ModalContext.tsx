"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ModalMode = "login" | "signup";

interface ModalContextType {
    isOpen: boolean;
    mode: ModalMode;
    openLogin: () => void;
    openSignup: () => void;
    close: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<ModalMode>("login");

    const openLogin = useCallback(() => {
        setMode("login");
        setIsOpen(true);
    }, []);

    const openSignup = useCallback(() => {
        setMode("signup");
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ModalContext.Provider value={{ isOpen, mode, openLogin, openSignup, close }}>
            {children}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
}
