export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `repeating-linear-gradient(0deg, #8B4513 0px, #8B4513 1px, transparent 1px, transparent 10px),
                         repeating-linear-gradient(90deg, #8B4513 0px, #8B4513 1px, transparent 1px, transparent 10px)`
      }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/95 via-[#FAF8F5]/90 to-[#FAF8F5]"></div>
      
      <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-[#8B4513]/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-10 w-40 h-40 rounded-full bg-[#D2691E]/10 blur-3xl"></div>
      
      <div className="relative container mx-auto px-4 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-sm font-medium mb-6 animate-fade-in">
          <i className="ri-sparkling-line"></i>
          <span>Expert Consultant IA</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Construction en <span className="bg-gradient-to-r from-[#8B4513] to-[#D2691E] bg-clip-text text-transparent">Brique de Terre</span><br />
          Compressée au Sénégal
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Calculez vos devis, planifiez vos installations techniques et formez vos équipes avec notre assistant IA spécialisé en construction BTC.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a 
            href="#calculator" 
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold h-14 rounded-xl px-8 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            Commencer le calcul
          </a>
          <a 
            href="#expertise" 
            className="inline-flex items-center justify-center gap-2 border-2 border-[#8B4513] bg-transparent text-[#8B4513] font-medium h-14 rounded-xl px-8 text-lg hover:bg-[#8B4513] hover:text-white transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            Découvrir nos services
          </a>
        </div>
        
        <a 
          href="#calculator" 
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 animate-bounce cursor-pointer"
        >
          <i className="ri-arrow-down-line text-xl text-[#8B4513]"></i>
        </a>
      </div>
    </section>
  );
}