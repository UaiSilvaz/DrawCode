'use client';

import TargetCursor from './TargetCursor';

export default function ConditionalTargetCursor() {
    return (
        <TargetCursor
            spinDuration={2}
            hideDefaultCursor={true}
            parallaxOn={true}
            enableCaretAnimation={true}
        />
    );
}
