"use client";

import { useModal } from "@/context/ModalContext";
import ModalLogin from "@/components/ui/ModalLogin";
import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function GlobalModalsContent() {
    const { isOpen, mode, close, openLogin, openSignup } = useModal();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    // Get callbackUrl from query params
    const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Check if we should open modal based on URL
        if (pathname === '/login') {
            openLogin();
        } else if (pathname === '/register') {
            openSignup();
        }
    }, [pathname, mounted, openLogin, openSignup]);

    // Don't Render modal on grape, dashboard, or other protected routes
    if (pathname === '/grape' || pathname === '/dashboard' || pathname?.startsWith('/dashboard')) {
        return null;
    }

    return (
        <ModalLogin
            open={isOpen}
            onClose={close}
            initialMode={mode}
            callbackUrl={callbackUrl}
        />
    );
}

export default function GlobalModals() {
    return (
        <Suspense fallback={null}>
            <GlobalModalsContent />
        </Suspense>
    );
}
