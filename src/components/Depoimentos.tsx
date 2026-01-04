export default function Depoimentos() {
    const testimonials = [
        {
            name: 'Luis Felipe Guedes',
            role: 'Tecnico em Informática to internt',
            company: 'Etec',
            content: 'Esta plataforma transforma o aprendizado de Front-End em uma experiência visual e prática. As ferramentas facilitam a compreensão do código na prática.',
            avatar: 'LF'
        },
        {
            name: 'Júlia Linda Rufato',
            role: 'Tecnico em Informática to internt',
            company: 'ETEC',
            content: 'Esta plataforma transforma o aprendizado de Front-End em uma experiência visual e prática. As ferramentas facilitam a compreensão do código na prática.',
            avatar: 'JU'
        },
        {
            name: 'Emanuel da Matad Brandrão',
            role: 'Desocupado',
            company: 'ETEC',
            content: 'Esta plataforma transforma o aprendizado de Front-End em uma experiência visual e prática.',
            avatar: 'EM'
        }
    ];

    return (
        <section id="testimonials" className="py-20 bg-white dark:bg-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        O que nossos usuários dizem
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Junte-se a quem está transformando layouts em código real com o DRAW CODE.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {testimonial.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {testimonial.role} at {testimonial.company}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 italic">
                                "{testimonial.content}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}