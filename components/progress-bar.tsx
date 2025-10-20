'use client'

import NextNProgress from 'nextjs-progressbar'

export default function ProgressBar() {
    return (
        <NextNProgress
            color="#2563eb"
            startPosition={0.3}
            stopDelayMs={200}
            height={3}
            showOnShallow={false}
            options={{ showSpinner: false }}
        />
    )
}
