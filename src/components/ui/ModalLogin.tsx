"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Login from "@/screens/Login";
import "./modal.css";

type ModalLoginProps = {
    open: boolean;
    onClose: () => void;
    initialMode?: "login" | "signup";
};

export default function ModalLogin({ open, onClose, initialMode = "login" }: ModalLoginProps) {
    const [mode, setMode] = useState<"login" | "signup">(initialMode);
    const prevOpenRef = useRef(open);
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            startTransition(() => {
                setMode(initialMode);
            });
        }
        prevOpenRef.current = open;
    }, [open, initialMode]);

    function handleClose() {
        setTimeout(() => {
            onClose();
        }, 300);
    }

    function handleSwitchToSignUp() {
        setMode("signup");
    }

    function handleSwitchToLogin() {
        setMode("login");
    }

    if (!open) return null;

    return (
        <div
            className={`modal-overlay ${open ? "show" : "hide"}`}
            onClick={handleClose}
        >
            <div
                className={`modal-box ${open ? "show" : "hide"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <Login
                    initialMode={mode}
                    onSwitchToSignUp={handleSwitchToSignUp}
                    onSwitchToLogin={handleSwitchToLogin}
                    onClose={handleClose}
                />
            </div>
        </div>
    );
}
