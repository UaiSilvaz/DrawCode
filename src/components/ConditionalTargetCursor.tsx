'use client';

import { usePathname } from 'next/navigation';
import TargetCursor from './TargetCursor';

export default function ConditionalTargetCursor() {
    const pathname = usePathname();

    if (
        pathname === '/grape' ||
        pathname?.startsWith('/grape/') ||
        pathname === '/dashboard' ||
        pathname?.startsWith('/dashboard/')
    ) {
        return null;
    }

    return (
        <TargetCursor
            spinDuration={2}
            hideDefaultCursor={true}
            parallaxOn={true}
            enableCaretAnimation={true}
        />
    );
}
