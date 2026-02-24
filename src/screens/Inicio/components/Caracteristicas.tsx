"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Caracteristicas() {
    const features = [
        {
            img: "/paintbrush.png",
            title: "Editor Visual de Layouts",
            description:
                "Crie interfaces de forma visual, arrastando elementos e montando layouts sem escrever código.",
        },
        {
            img: "/monitor.png",
            title: "Geração Automática de Código",
            description:
                "Transforme seus layouts em código HTML, CSS e JavaScript em tempo real.",
        },
        {
            img: "/robo.png",
            title: "Assistente com IA",
            description:
                "Receba sugestões inteligentes para melhorar seu código e aprender boas práticas de Front-End.",
        },
        {
            img: "/reading-book.png",
            title: "Aprendizado Prático",
            description:
                "Aprenda Front-End na prática, vendo o código nascer conforme você constrói o layout.",
        },
        {
            img: "/hourglass.png",
            title: "Edição e Visualização em Tempo Real",
            description:
                "Edite, teste e visualize suas alterações instantaneamente, sem recarregar a página.",
        },
        {
            img: "/globalization.png",
            title: "Exportação e Compartilhamento",
            description:
                "Exporte seus projetos ou compartilhe com outros usuários para estudar e evoluir.",
        },
    ];

    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                titleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
            );

            gsap.fromTo(
                subtitleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: "power3.out" },
            );

            gsap.fromTo(
                cardsRef.current?.children || [],
                { y: 60, opacity: 0, scale: 0.9 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                },
            );

            const cards = cardsRef.current?.children;
            if (cards) {
                Array.from(cards).forEach((card, index) => {
                    const icon = card.querySelector(".feature-icon img");
                    if (icon) {
                        card.addEventListener("mouseenter", () => {
                            gsap.to(icon, {
                                scale: 1.2,
                                rotation: 10,
                                duration: 0.3,
                                ease: "power2.out",
                            });
                        });
                        card.addEventListener("mouseleave", () => {
                            gsap.to(icon, {
                                scale: 1,
                                rotation: 0,
                                duration: 0.3,
                                ease: "power2.out",
                            });
                        });
                    }
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="features"
            className="py-20 bg-white dark:bg-dark"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2
                        ref={titleRef}
                        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                    >
                        Ferramentas que impulsionam seu aprendizado
                    </h2>
                    <p
                        ref={subtitleRef}
                        className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
                    >
                        Tudo o que você precisa para aprender Front-End de forma prática e
                        visual
                    </p>
                </div>
                <div
                    ref={cardsRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            <div className="feature-icon mb-4 flex justify-center">
                                <img
                                    src={feature.img}
                                    alt={feature.title}
                                    className="w-16 h-16 object-contain filter brightness-0 invert"
                                />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
