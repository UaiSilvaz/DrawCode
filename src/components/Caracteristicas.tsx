export default function Caracteristicas() {
    const features = [
        {
            icon: '🎨',
            title: 'Editor Visual de Layouts',
            description: 'Crie interfaces de forma visual, arrastando elementos e montando layouts sem escrever código.'
        },
        {
            icon: '💻',
            title: 'Geração Automática de Código',
            description: 'Transforme seus layouts em código HTML, CSS e JavaScript em tempo real.'
        },
        {
            icon: '🤖',
            title: 'Assistente com IA',
            description: 'Receba sugestões inteligentes para melhorar seu código e aprender boas práticas de Front-End.'
        },
        {
            icon: '📚',
            title: 'Aprendizado Prático',
            description: 'Aprenda Front-End na prática, vendo o código nascer conforme você constrói o layout.'
        },
        {
            icon: '🔄',
            title: 'Edição e Visualização em Tempo Real',
            description: 'Edite, teste e visualize suas alterações instantaneamente, sem recarregar a página.'
        },
        {
            icon: '🌐',
            title: 'Exportação e Compartilhamento',
            description: 'Exporte seus projetos ou compartilhe com outros usuários para estudar e evoluir.'
        }
    ];


    return (
        <section id="features" className="py-20 bg-white dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Ferramentas que impulsionam seu aprendizado
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Tudo o que você precisa para aprender Front-End de forma prática e visual
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">{feature.icon}</div>
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