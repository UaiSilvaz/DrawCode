'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Precos() {
    const plans = [
        {
            name: 'Inicial',
            price: 'R$0',
            period: '/mês',
            features: [
                'IA Scanner Ilimitado',
                '100 Projetos Inicias',
                'Suporte Basico',
                'Community Access'
            ],
            popular: false
        },
        {
            name: 'Pro',
            price: 'R$9',
            period: '/mês',
            features: [
                'IA Scanner Ilimitado',
                '10000 Projetos',
                'Suporte 24hrs',
                'Elementos Premiuns',
                'Customizações Avançadas'
            ],
            popular: true
        },
        {
            name: 'Mestre',
            price: 'R$99',
            period: '/ano',
            features: [
                'IA Scanner Ilimitado',
                'Projetos Ilimitados',
                'Suporte 24hrs',
                'Elementos Premiuns',
                'Customizações Avançadas'
            ],
            popular: false
        }
    ];

    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Title animation
            gsap.fromTo(titleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
            );

            // Subtitle animation
            gsap.fromTo(subtitleRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: "power3.out" }
            );

            // Cards staggered animation with different effects
            gsap.fromTo(cardsRef.current?.children || [],
                { y: 80, opacity: 0, rotationY: -15 },
                {
                    y: 0,
                    opacity: 1,
                    rotationY: 0,
                    duration: 1,
                    stagger: 0.3,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 75%",
                        toggleActions: "play none none reverse"
                    }
                }
            );

            // Hover effects for cards
            const cards = cardsRef.current?.children;
            if (cards) {
                Array.from(cards).forEach((card, index) => {
                    const button = card.querySelector('button');
                    if (button) {
                        card.addEventListener('mouseenter', () => {
                            gsap.to(card, {
                                y: -10,
                                scale: 1.05,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                            gsap.to(button, {
                                scale: 1.05,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        });
                        card.addEventListener('mouseleave', () => {
                            gsap.to(card, {
                                y: 0,
                                scale: 1,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                            gsap.to(button, {
                                scale: 1,
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        });
                    }
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="pricing" className="py-20 bg-gray-50 dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 ref={titleRef} className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Escolha o seu plano
                    </h2>
                    <p ref={subtitleRef} className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Selecione o plano perfeito para as seu aprendizado
                    </p>
                </div>
                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div key={index} className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transition-all duration-300 ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                            {plan.popular && (
                                <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                                    Mais Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {plan.name}
                            </h3>
                            <div className="text-4xl font-bold text-blue-600 mb-1">
                                {plan.price}
                                <span className="text-lg text-gray-600 dark:text-gray-300">{plan.period}</span>
                            </div>
                            <ul className="mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}>
                                Começar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}