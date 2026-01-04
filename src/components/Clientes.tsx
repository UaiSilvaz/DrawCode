export default function Clientes() {
    const clients = [
        'Company 1',
        'Company 2',
        'Company 3',
        'Company 4',
        'Company 5',
        'Company 6'
    ];

    return (
        <section id="clients" className="py-20 bg-white dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Aprovado por empresas líderes
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Junte-se a quem está construindo o futuro do Front-End de forma prática e visual.
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {clients.map((client, index) => (
                        <div key={index} className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-gray-600 dark:text-gray-300 font-semibold">
                                {client}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}