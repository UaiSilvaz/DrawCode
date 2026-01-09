'use client';

import ConditionalTargetCursor from './ConditionalTargetCursor';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
            <ConditionalTargetCursor />
        </>
    );
}
