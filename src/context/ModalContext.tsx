"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

    const openLogin = () => {
        setMode("login");
        setIsOpen(true);
    };

    const openSignup = () => {
        setMode("signup");
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

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
