export default function ExpertiseCards() {
  const cards = [
    {
      icon: 'ri-lightbulb-flash-line',
      title: 'Simuler (IA)',
      description: "L'IA calcule le devis précis et génère la liste complète des matériaux nécessaires.",
      buttonText: 'Lancer la simulation',
      buttonStyle: 'primary'
    },
    {
      icon: 'ri-eye-line',
      title: 'Vision 3D',
      description: "Visualisez vos murs en 'Rayons X' avec les câbles électriques et tuyaux positionnés.",
      buttonText: 'Ouvrir SketchUp',
      buttonStyle: 'secondary'
    },
    {
      icon: 'ri-file-text-line',
      title: 'Guide de Pose',
      description: 'Générez un document PDF personnalisé avec plans techniques et tutoriels pour maçons.',
      buttonText: 'Générer le PDF',
      buttonStyle: 'secondary',
      disabled: true
    }
  ];

  return (
    <section id="expertise" className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-[#8B4513]/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="p-6">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-[#8B4513]/10 transition-colors">
                  <i className={`${card.icon} text-2xl text-[#8B4513]`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {card.description}
                </p>
                <button
                  disabled={card.disabled}
                  className={`w-full h-11 rounded-lg font-medium transition-all duration-300 whitespace-nowrap cursor-pointer ${
                    card.buttonStyle === 'primary'
                      ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#8B4513]/30 hover:bg-gray-50'
                  } ${card.disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                >
                  {card.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}