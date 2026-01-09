'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Cabecalho() {
    const navRef = useRef<HTMLElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const linksRef = useRef<HTMLDivElement>(null);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // Navbar entrance
            gsap.fromTo(
                navRef.current,
                { y: -80, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
            );

            // Logo animation
            gsap.fromTo(
                logoRef.current,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, delay: 0.2, ease: 'back.out(1.7)' }
            );

            // Links stagger
            gsap.fromTo(
                linksRef.current?.children || [],
                { y: -20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    delay: 0.4,
                    ease: 'power2.out'
                }
            );

            // Actions buttons
            gsap.fromTo(
                actionsRef.current?.children || [],
                { y: -20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.15,
                    delay: 0.6,
                    ease: 'power2.out'
                }
            );

            // Navbar scroll effect
            ScrollTrigger.create({
                start: 0,
                onUpdate: (self) => {
                    gsap.to(navRef.current, {
                        backgroundColor: self.scroll() > 10 ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.33)',
                        backdropFilter: 'blur(12px)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });

            // Hover animations (links & buttons)
            const hoverItems = document.querySelectorAll('.nav-hover');
            hoverItems.forEach((item) => {
                item.addEventListener('mouseenter', () => {
                    gsap.to(item, { y: -2, duration: 0.3, ease: 'power2.out' });
                });
                item.addEventListener('mouseleave', () => {
                    gsap.to(item, { y: 0, duration: 0.3, ease: 'power2.out' });
                });
            });

            // Light animation for login button
            const loginButton = document.querySelector('.login-button');
            if (loginButton) {
                loginButton.addEventListener('mouseenter', () => {
                    gsap.to(loginButton, {
                        boxShadow: '0 12px 30px rgba(128, 0, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.3)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                    // Add subtle pulsing light effect
                    gsap.to(loginButton, {
                        filter: 'brightness(1.2) saturate(1.1)',
                        duration: 0.3,
                        ease: 'power2.out',
                        yoyo: true,
                        repeat: -1,
                        repeatDelay: 0.5
                    });
                });
                loginButton.addEventListener('mouseleave', () => {
                    gsap.to(loginButton, {
                        boxShadow: '0 12px 30px rgba(128, 0, 255, 0.6)',
                        filter: 'brightness(1)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                    gsap.killTweensOf(loginButton, { filter: true });
                });
            }

        }, navRef);

        return () => ctx.revert();
    }, []);

    return (
        <nav
            ref={navRef}
            className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-dark/80 dark:border-gray-800"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div ref={logoRef}>
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <img
                                    src="/IconD.png"
                                    alt="Icon"
                                    className="w-full h-full object-cover scale-150"
                                />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    Draw Code
                                </span>

                            </div>
                        </Link>
                    </div>

                    {/* Links */}
                    <div
                        ref={linksRef}
                        className="hidden md:flex items-center space-x-8"
                    >
                        {['Inicio', 'Funções', 'Preços', 'Depoimentos', 'Contato'].map((item, index) => (
                            <Link
                                key={index}
                                href={`#${item.toLowerCase()}`}
                                className="nav-hover cursor-target text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div
                        ref={actionsRef}
                        className="flex items-center space-x-4"
                    >
                        <button className="nav-hover cursor-target text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                            Cadastrar
                        </button>
                        <Link href="/login" className="
  login-button
  cursor-target
  relative
  px-10 py-2
  rounded-2xl
  text-lg font-semibold text-white
  bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
  shadow-[0_8px_30px_rgba(128,0,255,0.6)]
  transition-all duration-300 ease-out
  hover:scale-105
  hover:shadow-[0_12px_30px_rgba(128,0,255,0.6)]
  hover:brightness-110
  active:scale-95
">
                            Login                        </Link>
                    </div>

                </div>
            </div>
        </nav>
    );
}
