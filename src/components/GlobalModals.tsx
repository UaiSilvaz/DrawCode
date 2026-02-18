"use client";

import { useModal } from "@/context/ModalContext";
import ModalLogin from "@/components/ui/ModalLogin";

export default function GlobalModals() {
    const { isOpen, mode, close } = useModal();

    return (
        <ModalLogin open={isOpen} onClose={close} initialMode={mode} />
    );
}
