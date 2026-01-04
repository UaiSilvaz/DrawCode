export default function Features() {
    const features = [
        {
            icon: '🤖',
            title: 'AI Chatbots',
            description: 'Create intelligent chatbots that understand context and provide human-like responses.'
        },
        {
            icon: '🎨',
            title: 'Image Generation',
            description: 'Generate stunning images from text descriptions using advanced AI models.'
        },
        {
            icon: '📝',
            title: 'Content Creation',
            description: 'Automate content creation with AI-powered writing assistants and editors.'
        },
        {
            icon: '🔍',
            title: 'Data Analysis',
            description: 'Extract insights from your data with powerful AI analytics tools.'
        },
        {
            icon: '🎵',
            title: 'Audio Processing',
            description: 'Convert text to speech and analyze audio with cutting-edge AI technology.'
        },
        {
            icon: '🌐',
            title: 'API Integration',
            description: 'Seamlessly integrate AI capabilities into your existing applications.'
        }
    ];

    return (
        <section id="features" className="py-20 bg-white dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Powerful Features
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Everything you need to build next-generation AI applications
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