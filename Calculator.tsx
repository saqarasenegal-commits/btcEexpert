import { useState } from 'react';
import ChatAssistant from './ChatAssistant';
import WallPreview3D from './WallPreview3D';

interface Opening {
  id: number;
  label: string;
  width: number;
  height: number;
}

interface Results {
  netArea: number;
  grossArea: number;
  bricksNeeded: number;
  bricksWithWaste: number;
  mortarVolume: number;
  soilKg: number;
  cementBags: number;
  waterLiters: number;
  totalCost: number;
  brickCost: number;
  cementCost: number;
  laborCost: number;
  rebarLength?: number;
  rebarWeight?: number;
  rebarCost?: number;
}

const DEFAULT_PRICES = {
  brickUnit: 250,
  cementBag: 7500,
  laborPerM2: 3500,
  rebarPerKg: 650,
};

export default function Calculator() {
  const [longueur, setLongueur] = useState('');
  const [hauteur, setHauteur] = useState('');
  const [epaisseur, setEpaisseur] = useState('14');
  const [brickL, setBrickL] = useState('29');
  const [brickW, setBrickW] = useState('14');
  const [brickH, setBrickH] = useState('9');
  const [jointThickness, setJointThickness] = useState('1');
  const [wastePercent, setWastePercent] = useState('5');
  const [showOpenings, setShowOpenings] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRebar, setShowRebar] = useState(false);
  const [openings, setOpenings] = useState<Opening[]>([
    { id: 1, label: 'Porte', width: 0.9, height: 2.1 },
  ]);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [results, setResults] = useState<Results | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Rebar inputs
  const [rebarDiameter, setRebarDiameter] = useState('10');
  const [horizontalSpacing, setHorizontalSpacing] = useState('120');
  const [verticalSpacing, setVerticalSpacing] = useState('120');
  const [numLintels, setNumLintels] = useState('0');

  const addOpening = () => {
    setOpenings((prev) => [
      ...prev,
      { id: Date.now(), label: 'Fenêtre', width: 1.2, height: 1.0 },
    ]);
  };

  const removeOpening = (id: number) => {
    setOpenings((prev) => prev.filter((o) => o.id !== id));
  };

  const updateOpening = (id: number, field: keyof Opening, value: string | number) => {
    setOpenings((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!longueur || parseFloat(longueur) <= 0) errs.push('Wall length must be greater than 0.');
    if (!hauteur || parseFloat(hauteur) <= 0) errs.push('Wall height must be greater than 0.');
    if (!epaisseur || parseFloat(epaisseur) <= 0) errs.push('Wall thickness must be greater than 0.');
    if (parseFloat(brickL) <= 0 || parseFloat(brickW) <= 0 || parseFloat(brickH) <= 0)
      errs.push('Brick dimensions must be greater than 0.');
    return errs;
  };

  const compute = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); setResults(null); return; }
    setErrors([]);

    const L = parseFloat(longueur);
    const H = parseFloat(hauteur);
    const E = parseFloat(epaisseur) / 100; // cm → m
    const bL = parseFloat(brickL) / 100;
    const bW = parseFloat(brickW) / 100;
    const bHt = parseFloat(brickH) / 100;
    const joint = parseFloat(jointThickness) / 100;
    const waste = parseFloat(wastePercent) / 100;

    const grossArea = L * H;

    // Subtract openings
    const openingsArea = showOpenings
      ? openings.reduce((sum, o) => sum + o.width * o.height, 0)
      : 0;
    const netArea = Math.max(0, grossArea - openingsArea);

    // Bricks per m² — one layer thick (wall thickness handled by layers)
    const layers = Math.round(E / bW); // how many brick widths fit in wall thickness
    const bricksPerM2 = (1 / ((bL + joint) * (bHt + joint))) * Math.max(1, layers);
    const bricksNeeded = Math.ceil(netArea * bricksPerM2);
    const bricksWithWaste = Math.ceil(bricksNeeded * (1 + waste));

    // Mortar volume (joint volume)
    const wallVolume = netArea * E;
    const brickVolume = bricksNeeded * bL * bW * bHt;
    const mortarVolume = Math.max(0, wallVolume - brickVolume);

    // Soil & cement (BTC mix: ~90% soil, ~10% cement by volume)
    const soilVolume = mortarVolume * 0.9;
    const soilKg = Math.ceil(soilVolume * 1600); // bulk density ~1600 kg/m³
    const cementVolume = mortarVolume * 0.1;
    const cementBags = Math.ceil((cementVolume * 1500) / 50); // 50 kg bags

    // Water: ~10% of dry mix weight
    const dryMixKg = soilKg + cementBags * 50;
    const waterLiters = Math.ceil(dryMixKg * 0.1);

    // Rebar calculations
    let rebarLength = 0;
    let rebarWeight = 0;
    let rebarCost = 0;

    if (showRebar) {
      const diameter = parseFloat(rebarDiameter); // mm
      // BTC standard: 1 iron bar every 1.20m (matches brick hole spacing)
      const btcSpacing = 1.20; // metres — fixed by BTC brick module
      const lintels = parseInt(numLintels) || 0;

      // Vertical bars every 1.20m along the wall length
      const numVerticalBars = Math.ceil(L / btcSpacing) + 1;
      const verticalLength = numVerticalBars * H;

      // Horizontal bars every 1.20m along the wall height
      const numHorizontalBars = Math.ceil(H / btcSpacing) + 1;
      const horizontalLength = numHorizontalBars * L;

      // Lintel bars (2 bars per lintel, length = opening width + 0.3m overlap each side)
      const lintelLength = showOpenings
        ? openings.slice(0, lintels).reduce((sum, o) => sum + 2 * (o.width + 0.6), 0)
        : 0;

      rebarLength = horizontalLength + verticalLength + lintelLength;

      // Weight formula: kg/m = (diameter² / 162)
      const weightPerMeter = (diameter * diameter) / 162;
      rebarWeight = rebarLength * weightPerMeter;

      rebarCost = Math.ceil(rebarWeight * prices.rebarPerKg);
    }

    // Costs
    const brickCost = bricksWithWaste * prices.brickUnit;
    const cementCost = cementBags * prices.cementBag;
    const laborCost = Math.ceil(netArea * prices.laborPerM2);
    const totalCost = brickCost + cementCost + laborCost + rebarCost;

    setResults({
      netArea: parseFloat(netArea.toFixed(2)),
      grossArea: parseFloat(grossArea.toFixed(2)),
      bricksNeeded,
      bricksWithWaste,
      mortarVolume: parseFloat(mortarVolume.toFixed(3)),
      soilKg,
      cementBags,
      waterLiters,
      totalCost,
      brickCost,
      cementCost,
      laborCost,
      rebarLength: showRebar ? parseFloat(rebarLength.toFixed(2)) : undefined,
      rebarWeight: showRebar ? parseFloat(rebarWeight.toFixed(2)) : undefined,
      rebarCost: showRebar ? rebarCost : undefined,
    });

    setTimeout(() => {
      document.getElementById('calc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  const printEstimate = () => {
    if (!results) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rebarSection = showRebar && results.rebarLength ? `
      <div class="section">
        <div class="section-header rebar-header">🔩 Reinforcement (Iron Bars)</div>
        <div class="section-body">
          <div class="row"><span class="label">Bar diameter</span><span class="value">${rebarDiameter} mm</span></div>
          <div class="row"><span class="label">Total bar length</span><span class="value highlight">${fmt(results.rebarLength)} m</span></div>
          <div class="row"><span class="label">Total weight</span><span class="value highlight">${fmt(results.rebarWeight!)} kg</span></div>
          <div class="row"><span class="label">Estimated cost</span><span class="value">${fmt(results.rebarCost!)} FCFA</span></div>
        </div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>BTC Expert — Material Estimate</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #8B4513; padding-bottom: 16px; margin-bottom: 28px; }
          .logo { font-size: 24px; font-weight: 800; color: #8B4513; letter-spacing: -0.5px; }
          .logo span { color: #D2691E; }
          .meta { text-align: right; font-size: 12px; color: #666; }
          .meta strong { display: block; font-size: 14px; color: #333; margin-bottom: 2px; }
          h2 { font-size: 20px; font-weight: 700; color: #8B4513; margin-bottom: 6px; }
          .subtitle { font-size: 13px; color: #888; margin-bottom: 24px; }
          .section { margin-bottom: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; }
          .section-header { padding: 10px 16px; font-size: 13px; font-weight: 700; color: #fff; }
          .bricks-header { background: linear-gradient(to right, #8B4513, #D2691E); }
          .mortar-header { background: linear-gradient(to right, #b45309, #f59e0b); }
          .rebar-header { background: linear-gradient(to right, #475569, #64748b); }
          .cost-header { background: linear-gradient(to right, #15803d, #22c55e); }
          .section-body { padding: 12px 16px; }
          .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #555; }
          .row .value { font-weight: 600; color: #1a1a1a; }
          .row .value.highlight { color: #8B4513; }
          .total-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #fdf8f5; border-top: 2px solid #8B4513; margin-top: 4px; }
          .total-row .label { font-size: 15px; font-weight: 700; color: #1a1a1a; }
          .total-row .value { font-size: 20px; font-weight: 800; color: #8B4513; }
          .disclaimer { margin-top: 24px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 14px; }
          .params { background: #faf8f5; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .param { font-size: 12px; color: #666; }
          .param strong { display: block; font-size: 13px; color: #333; }
          @media print {
            body { padding: 20px; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">BTC<span>Expert</span></div>
          <div class="meta">
            <strong>Material Estimate</strong>
            Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <h2>Estimate Summary</h2>
        <p class="subtitle">Net area: ${results.netArea} m² &nbsp;|&nbsp; Gross area: ${results.grossArea} m² &nbsp;|&nbsp; Waste margin: ${wastePercent}%</p>

        <div class="params">
          <div class="param"><strong>${longueur} m</strong>Wall length</div>
          <div class="param"><strong>${hauteur} m</strong>Wall height</div>
          <div class="param"><strong>${epaisseur} cm</strong>Wall thickness</div>
          <div class="param"><strong>${brickL}×${brickW}×${brickH} cm</strong>Brick format</div>
          <div class="param"><strong>${jointThickness} cm</strong>Joint thickness</div>
          <div class="param"><strong>${wastePercent}%</strong>Waste margin</div>
        </div>

        <div class="section">
          <div class="section-header bricks-header">🧱 Bricks</div>
          <div class="section-body">
            <div class="row"><span class="label">Bricks needed (net)</span><span class="value">${fmt(results.bricksNeeded)} units</span></div>
            <div class="row"><span class="label">With ${wastePercent}% waste margin</span><span class="value highlight">${fmt(results.bricksWithWaste)} units</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header mortar-header">💧 Mortar &amp; Materials</div>
          <div class="section-body">
            <div class="row"><span class="label">Mortar volume</span><span class="value">${results.mortarVolume} m³</span></div>
            <div class="row"><span class="label">Compressed soil</span><span class="value">${fmt(results.soilKg)} kg</span></div>
            <div class="row"><span class="label">Cement bags (50 kg)</span><span class="value highlight">${results.cementBags} bags</span></div>
            <div class="row"><span class="label">Water</span><span class="value">${fmt(results.waterLiters)} L</span></div>
          </div>
        </div>

        ${rebarSection}

        <div class="section">
          <div class="section-header cost-header">💰 Cost Estimate (FCFA)</div>
          <div class="section-body">
            <div class="row"><span class="label">Bricks</span><span class="value">${fmt(results.brickCost)} FCFA</span></div>
            <div class="row"><span class="label">Cement</span><span class="value">${fmt(results.cementCost)} FCFA</span></div>
            <div class="row"><span class="label">Labour</span><span class="value">${fmt(results.laborCost)} FCFA</span></div>
            ${showRebar && results.rebarCost ? `<div class="row"><span class="label">Iron bars</span><span class="value">${fmt(results.rebarCost)} FCFA</span></div>` : ''}
          </div>
          <div class="total-row">
            <span class="label">Total Estimate</span>
            <span class="value">${fmt(results.totalCost)} FCFA</span>
          </div>
        </div>

        <p class="disclaimer">* These are estimates only. Actual quantities and prices may vary by region and supplier. — BTC Expert</p>

        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <section id="calculator" className="py-20 bg-[#FAF8F5]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            BTC Quote Calculator
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Enter your wall dimensions to get an instant, precise estimate of materials and costs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* ── Form ── */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
                  <i className="ri-ruler-line text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Wall Dimensions</h3>
                  <p className="text-sm text-gray-500">Fill in the fields to calculate your needs</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={compute} className="space-y-6">

                {/* Wall dims */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <i className="ri-ruler-2-line text-[#8B4513]"></i>
                    Wall dimensions (metres)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Length (m)', val: longueur, set: setLongueur, ph: '5.00' },
                      { label: 'Height (m)', val: hauteur, set: setHauteur, ph: '3.00' },
                      { label: 'Thickness (cm)', val: epaisseur, set: setEpaisseur, ph: '14' },
                    ].map(({ label, val, set, ph }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">{label}</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={ph}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brick format */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <i className="ri-layout-grid-line text-[#8B4513]"></i>
                    Brick format (cm) — Standard: 29×14×9
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Length', val: brickL, set: setBrickL },
                      { label: 'Width', val: brickW, set: setBrickW },
                      { label: 'Height', val: brickH, set: setBrickH },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Joint thickness (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={jointThickness}
                        onChange={(e) => setJointThickness(e.target.value)}
                        className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Waste margin (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="30"
                        value={wastePercent}
                        onChange={(e) => setWastePercent(e.target.value)}
                        className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Openings */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenings(!showOpenings)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
                  >
                    <i className={`ri-arrow-${showOpenings ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
                    Openings (doors &amp; windows)
                    {openings.length > 0 && showOpenings && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs">
                        {openings.length}
                      </span>
                    )}
                  </button>
                  {showOpenings && (
                    <div className="space-y-2 pl-4 border-l-2 border-[#8B4513]/20">
                      {openings.map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={o.label}
                            onChange={(e) => updateOpening(o.id, 'label', e.target.value)}
                            className="w-24 h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={o.width}
                            onChange={(e) => updateOpening(o.id, 'width', parseFloat(e.target.value))}
                            className="w-20 h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                            placeholder="W (m)"
                          />
                          <span className="text-gray-400 text-xs">×</span>
                          <input
                            type="number"
                            step="0.01"
                            value={o.height}
                            onChange={(e) => updateOpening(o.id, 'height', parseFloat(e.target.value))}
                            className="w-20 h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                            placeholder="H (m)"
                          />
                          <button
                            type="button"
                            onClick={() => removeOpening(o.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOpening}
                        className="flex items-center gap-1 text-xs text-[#8B4513] hover:underline cursor-pointer"
                      >
                        <i className="ri-add-line"></i> Add opening
                      </button>
                    </div>
                  )}
                </div>

                {/* Reinforcement (Iron Bars) */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowRebar(!showRebar)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
                  >
                    <i className={`ri-arrow-${showRebar ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
                    Reinforcement (Iron Bars)
                  </button>
                  {showRebar && (
                    <div className="space-y-3 pl-4 border-l-2 border-[#8B4513]/20">

                      {/* BTC standard notice */}
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                        <i className="ri-information-line text-amber-600 mt-0.5 shrink-0"></i>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <strong>BTC standard:</strong> Iron bars are placed every <strong>1.20 m</strong> — both vertically and horizontally — to align with the brick hole spacing shown in the BTC module.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Bar diameter (mm)</label>
                          <select
                            value={rebarDiameter}
                            onChange={(e) => setRebarDiameter(e.target.value)}
                            className="w-full h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513] cursor-pointer"
                          >
                            <option value="6">6 mm</option>
                            <option value="8">8 mm</option>
                            <option value="10">10 mm</option>
                            <option value="12">12 mm</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Number of lintels</label>
                          <input
                            type="number"
                            min="0"
                            value={numLintels}
                            onChange={(e) => setNumLintels(e.target.value)}
                            className="w-full h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          />
                        </div>
                      </div>

                      {/* Spacing display (read-only) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500">Horizontal spacing</label>
                          <div className="w-full h-9 rounded-lg border-2 border-dashed border-gray-200 px-3 text-xs flex items-center text-gray-500 bg-gray-50">
                            120 cm (BTC standard)
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500">Vertical spacing</label>
                          <div className="w-full h-9 rounded-lg border-2 border-dashed border-gray-200 px-3 text-xs flex items-center text-gray-500 bg-gray-50">
                            120 cm (BTC standard)
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowPricing(!showPricing)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
                  >
                    <i className={`ri-arrow-${showPricing ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
                    Unit prices (FCFA) — click to edit
                  </button>
                  {showPricing && (
                    <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-[#8B4513]/20">
                      {[
                        { label: 'Brick / unit', key: 'brickUnit' as const },
                        { label: 'Cement bag (50 kg)', key: 'cementBag' as const },
                        { label: 'Labour / m²', key: 'laborPerM2' as const },
                        { label: 'Iron bar / kg', key: 'rebarPerKg' as const },
                      ].map(({ label, key }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">{label}</label>
                          <input
                            type="number"
                            value={prices[key]}
                            onChange={(e) =>
                              setPrices((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))
                            }
                            className="w-full h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-1">
                    {errors.map((err) => (
                      <p key={err} className="text-sm text-red-600 flex items-center gap-2">
                        <i className="ri-error-warning-line"></i> {err}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="ri-calculator-line text-lg"></i>
                    Calculate my estimate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`h-12 px-5 rounded-xl font-semibold whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 ${
                      showPreview
                        ? 'bg-[#8B4513] text-white shadow-md'
                        : 'bg-white text-[#8B4513] border-2 border-[#8B4513] hover:bg-[#8B4513]/5'
                    }`}
                  >
                    <i className="ri-3d-cube-line text-lg"></i>
                    {showPreview ? 'Hide' : 'Preview'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right column: Results or Chat ── */}
          <div className="flex flex-col gap-6">
            {results ? (
              <div id="calc-results" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
                      <i className="ri-file-list-3-line text-white"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Estimate Results</h3>
                      <p className="text-xs text-gray-500">
                        Net area: {results.netArea} m² (gross: {results.grossArea} m²)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={printEstimate}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#8B4513] text-white text-xs font-semibold hover:bg-[#A0522D] transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                      title="Print or save as PDF"
                    >
                      <i className="ri-printer-line text-sm"></i>
                      Print / PDF
                    </button>
                    <button
                      onClick={() => setResults(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Bricks */}
                  <ResultBlock
                    icon="ri-layout-grid-line"
                    title="Bricks"
                    color="from-[#8B4513] to-[#D2691E]"
                    items={[
                      { label: 'Bricks needed (net)', value: `${fmt(results.bricksNeeded)} units` },
                      { label: `With ${wastePercent}% waste margin`, value: `${fmt(results.bricksWithWaste)} units`, highlight: true },
                    ]}
                  />

                  {/* Mortar & materials */}
                  <ResultBlock
                    icon="ri-drop-line"
                    title="Mortar & Materials"
                    color="from-amber-600 to-amber-400"
                    items={[
                      { label: 'Mortar volume', value: `${results.mortarVolume} m³` },
                      { label: 'Compressed soil', value: `${fmt(results.soilKg)} kg` },
                      { label: 'Cement bags (50 kg)', value: `${results.cementBags} bags`, highlight: true },
                      { label: 'Water', value: `${fmt(results.waterLiters)} L` },
                    ]}
                  />

                  {/* Reinforcement (Iron Bars) */}
                  {showRebar && results.rebarLength && (
                    <ResultBlock
                      icon="ri-hammer-line"
                      title="Reinforcement (Iron Bars)"
                      color="from-slate-600 to-slate-400"
                      items={[
                        { label: 'Bar diameter', value: `${rebarDiameter} mm` },
                        { label: 'Spacing (BTC standard)', value: '1.20 m' },
                        { label: 'Total bar length', value: `${fmt(results.rebarLength)} m`, highlight: true },
                        { label: 'Total weight', value: `${fmt(results.rebarWeight!)} kg`, highlight: true },
                        { label: 'Estimated cost', value: `${fmt(results.rebarCost!)} FCFA` },
                      ]}
                    />
                  )}

                  {/* Costs */}
                  <ResultBlock
                    icon="ri-money-cny-circle-line"
                    title="Cost Estimate (FCFA)"
                    color="from-green-700 to-green-500"
                    items={[
                      { label: 'Bricks', value: `${fmt(results.brickCost)} FCFA` },
                      { label: 'Cement', value: `${fmt(results.cementCost)} FCFA` },
                      { label: 'Labour', value: `${fmt(results.laborCost)} FCFA` },
                      ...(showRebar && results.rebarCost ? [{ label: 'Iron bars', value: `${fmt(results.rebarCost)} FCFA` }] : []),
                    ]}
                    footer={
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                        <span className="font-bold text-gray-900">Total estimate</span>
                        <span className="text-xl font-bold text-[#8B4513]">
                          {fmt(results.totalCost)} FCFA
                        </span>
                      </div>
                    }
                  />

                  <p className="text-xs text-gray-400 text-center">
                    * Estimates only. Prices may vary by region and supplier.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[260px]">
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[#8B4513]/10">
                  <i className="ri-calculator-line text-3xl text-[#8B4513]"></i>
                </div>
                <p className="text-gray-500 text-sm max-w-xs">
                  Fill in the form on the left and click <strong>Calculate my estimate</strong> to see your detailed material quantities and costs here.
                </p>
              </div>
            )}

            <ChatAssistant />
          </div>
        </div>

        {/* ── 3D Preview Panel (full width below) ── */}
        {showPreview && longueur && hauteur && (
          <div className="mt-8 max-w-7xl mx-auto">
            <WallPreview3D
              longueur={longueur}
              hauteur={hauteur}
              epaisseur={epaisseur}
              brickL={brickL}
              brickW={brickW}
              brickH={brickH}
              jointThickness={jointThickness}
              openings={openings}
              showOpenings={showOpenings}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Small helper component ── */
interface ResultItem { label: string; value: string; highlight?: boolean; }
interface ResultBlockProps {
  icon: string;
  title: string;
  color: string;
  items: ResultItem[];
  footer?: React.ReactNode;
}

function ResultBlock({ icon, title, color, items, footer }: ResultBlockProps) {
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${color} text-white`}>
        <i className={`${icon} text-sm`}></i>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className={`text-sm font-semibold ${item.highlight ? 'text-[#8B4513]' : 'text-gray-800'}`}>
              {item.value}
            </span>
          </div>
        ))}
        {footer}
      </div>
    </div>
  );
}
