'use client';

import ConditionalTargetCursor from './ConditionalTargetCursor';
import GlobalModals from './GlobalModals';
import { ModalProvider } from '@/context/ModalContext';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ModalProvider>
            {children}
            <ConditionalTargetCursor />
            <GlobalModals />
        </ModalProvider>
    );
}
