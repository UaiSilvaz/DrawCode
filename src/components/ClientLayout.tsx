'use client';

import ConditionalTargetCursor from './ConditionalTargetCursor';
import GlobalModals from './GlobalModals';
import { ModalProvider } from '@/context/ModalContext';
import AuthSessionProvider from './AuthSessionProvider';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthSessionProvider>
            <ModalProvider>
                {children}
                <ConditionalTargetCursor />
                <GlobalModals />
            </ModalProvider>
        </AuthSessionProvider>
    );
}
