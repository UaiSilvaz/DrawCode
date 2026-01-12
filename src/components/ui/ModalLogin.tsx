"use client";

import { useEffect, useState } from "react";
import Login from "@/screens/Login";
import "./modal.css";

type ModalLoginProps = {
    open: boolean;
    onClose: () => void;
};

export default function ModalLogin({ open, onClose }: ModalLoginProps) {
    const [visible, setVisible] = useState(open);

    useEffect(() => {
        if (open) {
            setVisible(true);
        }
    }, [open]);

    function handleClose() {
        setVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    }

    if (!open && !visible) return null;

    return (
        <div
            className={`modal-overlay ${open ? "show" : "hide"}`}
            onClick={handleClose}
        >
            <div
                className={`modal-box ${open ? "show" : "hide"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close" onClick={handleClose}>✕</button>
                <Login />
            </div>
        </div>
    );
}
