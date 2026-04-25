export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#6B3410] to-[#8B4513] text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D2691E] to-[#A0522D] flex items-center justify-center shadow-md">
                <i className="ri-building-line text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold">BTC Expert</h3>
                <p className="text-xs text-white/70">Sénégal</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              Expert en construction durable avec la Brique de Terre Compressée. Solutions écologiques adaptées au climat sénégalais.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <i className="ri-map-pin-line text-white"></i>
                Dakar, Sénégal
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <i className="ri-phone-line text-white"></i>
                +221 78 659 9051
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <i className="ri-mail-line text-white"></i>
                contact@btc-expert.sn
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>• Calcul de devis BTC</li>
              <li>• Conseil en ingénierie fluides</li>
              <li>• Formation maçons</li>
              <li>• Accompagnement chantier</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60">
          <p>© 2024 BTC Expert Sénégal. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
