"use client"

import {
    motion,
    type SpringOptions,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface BubbleBackgroundProps {
    className?: string
    children?: React.ReactNode
    interactive?: boolean
    fixed?: boolean
    performanceMode?: "auto" | "smooth" | "rich"
    interactiveMaxScrollY?: number
    transition?: SpringOptions
    colors?: {
        first: string
        second: string
        third: string
        fourth: string
        fifth: string
        sixth: string
    }
}

export function BubbleBackground({
    className,
    children,
    interactive = false,
    fixed = true,
    performanceMode = "auto",
    interactiveMaxScrollY,
    transition = { stiffness: 120, damping: 26, mass: 0.2 },
    colors = {
        first: "109,40,217",
        second: "147,51,234",
        third: "126,34,206",
        fourth: "91,33,182",
        fifth: "67,26,130",
        sixth: "168,85,247",
    },
}: BubbleBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const centerRef = useRef({ x: 0, y: 0 })
    const pointerRef = useRef({ x: 0, y: 0 })
    const scrollYRef = useRef(0)
    const frameRef = useRef<number | null>(null)
    const [isCompactMode, setIsCompactMode] = useState(false)
    const [isLowSpecDevice, setIsLowSpecDevice] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springX = useSpring(mouseX, transition)
    const springY = useSpring(mouseY, transition)

    const updateCenter = useCallback(() => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        centerRef.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        }
    }, [])

    const flushPointerPosition = useCallback(() => {
        frameRef.current = null
        mouseX.set(pointerRef.current.x - centerRef.current.x)
        mouseY.set(pointerRef.current.y - centerRef.current.y)
    }, [mouseX, mouseY])

    const handlePointerMove = useCallback(
        (event: PointerEvent) => {
            if (interactiveMaxScrollY !== undefined && scrollYRef.current > interactiveMaxScrollY) {
                return
            }
            pointerRef.current = { x: event.clientX, y: event.clientY }
            if (frameRef.current === null) {
                frameRef.current = window.requestAnimationFrame(flushPointerPosition)
            }
        },
        [flushPointerPosition, interactiveMaxScrollY],
    )

    useEffect(() => {
        updateCenter()
        const container = containerRef.current
        if (!container) return

        const resizeObserver =
            typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateCenter) : null
        resizeObserver?.observe(container)
        window.addEventListener("resize", updateCenter, { passive: true })
        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener("resize", updateCenter)
        }
    }, [updateCenter])

    useEffect(() => {
        if (typeof window.matchMedia !== "function") return
        const mediaQuery = window.matchMedia("(max-width: 768px)")
        const syncMode = () => setIsCompactMode(mediaQuery.matches)
        syncMode()
        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", syncMode)
            return () => mediaQuery.removeEventListener("change", syncMode)
        }

        mediaQuery.addListener(syncMode)
        return () => mediaQuery.removeListener(syncMode)
    }, [])

    useEffect(() => {
        const detectDeviceBudget = () => {
            const nav = navigator as Navigator & {
                deviceMemory?: number
                connection?: { saveData?: boolean }
            }
            const lowCpu = nav.hardwareConcurrency ? nav.hardwareConcurrency <= 4 : false
            const lowMemory = nav.deviceMemory ? nav.deviceMemory <= 4 : false
            const saveData = Boolean(nav.connection?.saveData)
            setIsLowSpecDevice(lowCpu || lowMemory || saveData)
        }

        const timeoutId = window.setTimeout(detectDeviceBudget, 0)
        return () => window.clearTimeout(timeoutId)
    }, [])

    useEffect(() => {
        if (interactiveMaxScrollY === undefined) {
            return
        }

        const syncScrollValue = () => {
            scrollYRef.current = window.scrollY
        }

        syncScrollValue()
        window.addEventListener("scroll", syncScrollValue, { passive: true })
        return () => window.removeEventListener("scroll", syncScrollValue)
    }, [interactiveMaxScrollY])

    const isSmoothMode =
        performanceMode === "smooth" ||
        (performanceMode === "auto" && (isCompactMode || Boolean(shouldReduceMotion) || isLowSpecDevice))
    const isInteractiveEnabled = interactive

    useEffect(() => {
        if (!isInteractiveEnabled) return
        window.addEventListener("pointermove", handlePointerMove, { passive: true })
        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [isInteractiveEnabled, handlePointerMove])

    useEffect(() => {
        if (interactiveMaxScrollY === undefined) return
        scrollYRef.current = window.scrollY
    }, [interactiveMaxScrollY])

    const makeGradient = (color: string) =>
        `radial-gradient(circle at center, rgba(${color}, 0.72) 0%, rgba(${color}, 0) 56%)`

    const lowFxMode = isSmoothMode || Boolean(shouldReduceMotion)
    const baseBubbleSize = lowFxMode ? "62%" : "80%"
    const interactiveBubbleSize = lowFxMode ? "84%" : "100%"
    const filterStyle = lowFxMode ? "blur(18px)" : "url(#bubble-goo) blur(30px)"

    return (
        <div
            ref={containerRef}
            className={cn(
                fixed
                    ? "fixed inset-0 overflow-hidden bg-gradient-to-br from-[#140721] via-[#0b0518] to-[#05030c]"
                    : "absolute inset-0 overflow-hidden bg-gradient-to-br from-[#140721] via-[#0b0518] to-[#05030c]",
                className,
            )}
        >
            <svg className="hidden" aria-hidden="true">
                <defs>
                    <filter id="bubble-goo">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="8" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            result="goo"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -7"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            <div
                className="absolute inset-0 pointer-events-none"
                style={{ filter: filterStyle, transform: "translateZ(0)", willChange: "transform" }}
            >
                <motion.div
                    className="absolute rounded-full mix-blend-hard-light"
                    style={{
                        width: baseBubbleSize,
                        height: baseBubbleSize,
                        top: "10%",
                        left: "10%",
                        background: makeGradient(colors.first),
                        willChange: "transform",
                    }}
                    animate={shouldReduceMotion ? undefined : { y: [-36, 36, -36] }}
                    transition={{ duration: 30, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
                />

                <motion.div
                    className="absolute inset-0 flex justify-center items-center"
                    style={{
                        transformOrigin: lowFxMode ? "calc(50% - 260px) center" : "calc(50% - 400px) center",
                        willChange: "transform",
                    }}
                    animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: lowFxMode ? 30 : 22, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                >
                    <div
                        className="rounded-full mix-blend-hard-light"
                        style={{
                            width: baseBubbleSize,
                            height: baseBubbleSize,
                            background: makeGradient(colors.second),
                        }}
                    />
                </motion.div>

                <motion.div
                    className="absolute inset-0 flex justify-center items-center"
                    style={{
                        transformOrigin: lowFxMode ? "calc(50% + 260px) center" : "calc(50% + 400px) center",
                        willChange: "transform",
                    }}
                    animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: lowFxMode ? 46 : 40, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                >
                    <div
                        className="absolute rounded-full mix-blend-hard-light"
                        style={{
                            width: baseBubbleSize,
                            height: baseBubbleSize,
                            top: lowFxMode ? "calc(50% + 120px)" : "calc(50% + 200px)",
                            left: lowFxMode ? "calc(50% - 320px)" : "calc(50% - 500px)",
                            background: makeGradient(colors.third),
                        }}
                    />
                </motion.div>

                <motion.div
                    className="absolute rounded-full mix-blend-hard-light opacity-70"
                    style={{
                        width: baseBubbleSize,
                        height: baseBubbleSize,
                        top: "10%",
                        left: "10%",
                        background: makeGradient(colors.fourth),
                        willChange: "transform",
                    }}
                    animate={shouldReduceMotion ? undefined : { x: [-34, 34, -34] }}
                    transition={{ duration: 40, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
                />

                {!lowFxMode && (
                    <motion.div
                        className="absolute inset-0 flex justify-center items-center"
                        style={{
                            transformOrigin: "calc(50% - 800px) calc(50% + 200px)",
                            willChange: "transform",
                        }}
                        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                        transition={{ duration: 24, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                    >
                        <div
                            className="absolute rounded-full mix-blend-hard-light"
                            style={{
                                width: "150%",
                                height: "150%",
                                top: "calc(50% - 75%)",
                                left: "calc(50% - 75%)",
                                background: makeGradient(colors.fifth),
                            }}
                        />
                    </motion.div>
                )}

                {isInteractiveEnabled && (
                    <motion.div
                        className="absolute rounded-full mix-blend-hard-light opacity-70"
                        style={{
                            width: interactiveBubbleSize,
                            height: interactiveBubbleSize,
                            background: makeGradient(colors.sixth),
                            x: springX,
                            y: springY,
                            willChange: "transform",
                        }}
                    />
                )}
            </div>

            {children && <div className="relative z-10 h-full w-full">{children}</div>}
        </div>
    )
}

export default BubbleBackground

