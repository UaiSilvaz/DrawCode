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

    return (
        <section id="pricing" className="py-20 bg-gray-50 dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Escolha o seu plano

                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Selecione o plano perfeito para as seu aprendizado
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div key={index} className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
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
                            <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}>
                                Começar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}