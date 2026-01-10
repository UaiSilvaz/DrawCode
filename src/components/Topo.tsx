import dynamic from 'next/dynamic';
import Link from "next/link";


const Silk = dynamic(() => import('./Silk'), { ssr: true });

export default function Topo() {
    return (
        <section
            id="home"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            <div className="absolute inset-0 z-0">
                <Silk />
            </div>

            <div className="relative z-10 w-full px-4 text-center flex flex-col items-center justify-center">

                {/* Container da logo + texto */}
                <div className="relative flex flex-col items-center">

                    {/* Texto sobreposto */}
                    <h1 className="
  text-2xl md:text-3xl lg:text-4xl font-semibold
  text-gray-800 dark:text-gray-300
  -mb-8
  transform translate-y-50
  z-10
">
                        Bem-vindo ao
                    </h1>


                    <img
                        src="/draw.png"
                        alt="Draw Code"
                        className="w-80 md:w-[420px] lg:w-[520px] h-auto"
                    />

                </div>
                <div className="-mt-10 transform -translate-y-50">
                    {/* Descrição */}
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                        Tornar o aprendizado de Front-End simples, visual e acessível,
                        ajudando iniciantes a criar HTML, CSS e JavaScript sem complicação.
                    </p>

                    {/* Botões */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
                        <Link
                            href="/login"
                            className="
    relative
    px-9 py-3
    rounded-2xl
    text-base font-semibold text-white
    bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600
    shadow-[0_10px_25px_rgba(128,0,255,0.6)]
    transition-all duration-300 ease-out
    hover:scale-105
    hover:brightness-110
    active:scale-95
    inline-flex items-center justify-center
  "
                        >
                            Comece a criar
                        </Link>


                        <button
                            className="
        border-2 border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300
        hover:border-blue-600 hover:text-blue-600
        px-7 py-3 rounded-lg text-base font-semibold
        transition-all duration-300 ease-out
        hover:shadow-[0_10px_25px_rgba(128,0,255,0.6)]
      "
                        >
                            Criar conta
                        </button>
                    </div>
                </div>


            </div>
            {/* Seta */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
                <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </div>
        </section>
    );
}
