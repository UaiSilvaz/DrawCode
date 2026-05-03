import TiltedCard from './TiltedCard';

const founders = [
  {
    name: 'Guilherme',
    imageSrc: '/GUILHERMEEE.jpg',
  },
  {
    name: 'Júlia',
    imageSrc: '/Julia.png',
  },
  {
    name: 'Leandra',
    imageSrc: '/LEANDRA.jpeg',
  },
  {
    name: 'Antônio',
    imageSrc: '/Antonio.jpeg',
  },
];

export default function Founders() {
  return (
    <section id="founders" className="py-20 bg-gray-50 dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Founders
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Time fundador do projeto
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
          {founders.map((founder) => (
            <TiltedCard
              key={founder.name}
              imageSrc={founder.imageSrc}
              altText={founder.name}
              captionText={founder.name}
              containerHeight="300px"
              containerWidth="300px"
              imageHeight="300px"
              imageWidth="300px"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <p className="text-white text-sm font-semibold bg-black/45 px-3 py-1 rounded-md m-3 inline-block">
                  {founder.name}
                </p>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
