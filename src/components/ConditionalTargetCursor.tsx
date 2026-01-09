'use client';

import { usePathname } from 'next/navigation';
import TargetCursor from './TargetCursor';

export default function ConditionalTargetCursor() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    if (!isHomePage) {
        return null;
    }

    return (
        <TargetCursor
            spinDuration={2}
            hideDefaultCursor={true}
            parallaxOn={true}
        />
    );
}
