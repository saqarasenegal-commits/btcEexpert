import { useState, useEffect } from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B4513] to-[#D2691E] flex items-center justify-center shadow-md">
            <i className="ri-building-line text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">BTC Expert</h1>
            <p className="text-xs text-gray-500">Sénégal</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#calculator"
            className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            Calculateur
          </a>
          <a
            href="#expertise"
            className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            Expertise
          </a>
          <a
            href="#sketchup"
            className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            Vision 3D
          </a>
          <a
            href="#process"
            className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            Process
          </a>
          <a
            href="#formation"
            className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            Formation
          </a>
        </nav>

        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#8B4513] text-[#8B4513] rounded-lg hover:bg-[#8B4513] hover:text-white transition-all duration-300 text-sm font-medium whitespace-nowrap cursor-pointer">
          Se connecter
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-[#8B4513] cursor-pointer"
        >
          <i className={`ri-${isMobileMenuOpen ? 'close' : 'menu'}-line text-2xl`}></i>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <a
              href="#calculator"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors py-2 cursor-pointer"
            >
              Calculateur
            </a>
            <a
              href="#expertise"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors py-2 cursor-pointer"
            >
              Expertise
            </a>
            <a
              href="#sketchup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors py-2 cursor-pointer"
            >
              Vision 3D
            </a>
            <a
              href="#process"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors py-2 cursor-pointer"
            >
              Process
            </a>
            <a
              href="#formation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-[#8B4513] transition-colors py-2 cursor-pointer"
            >
              Formation
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}