import { useState, useCallback } from 'react';
import ChatAssistant from './ChatAssistant';
import WallPreview3D from './WallPreview3D';
import WallSegmentEditor, { DEFAULT_SEGMENT, type WallSegment } from './WallSegmentEditor';
import ProjectResults, { type ProjectTotals, type SegmentResult } from './ProjectResults';
import FloorPlan2D from './FloorPlan2D';
import type { RoomWall } from './SketchUp3DViewer';

interface CalculatorProps {
  onSyncTo3D?: (walls: RoomWall[], activeWallId: string) => void;
}

const DEFAULT_PRICES = {
  brickUnit: 250,
  cementBag: 7500,
  laborPerM2: 3500,
  rebarPerKg: 650,
};

export default function Calculator({ onSyncTo3D }: CalculatorProps = {}) {
  const [segments, setSegments] = useState<WallSegment[]>([{ ...DEFAULT_SEGMENT, id: Date.now() }]);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [showPricing, setShowPricing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSegmentId, setPreviewSegmentId] = useState<number | null>(null);
  const [planImage, setPlanImage] = useState<string | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [results, setResults] = useState<ProjectTotals | null>(null);
  const [errors, setErrors] = useState<string[]>([]);


  const addSegment = () => {
    setSegments((prev) => [
      ...prev,
      { ...DEFAULT_SEGMENT, id: Date.now(), name: `Mur ${prev.length + 1}` },
    ]);
  };

  const removeSegment = (id: number) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSegment = (id: number, segment: WallSegment) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? segment : s)));
  };

  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPlanImage(url);
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    segments.forEach((seg, idx) => {
      if (!seg.longueur || parseFloat(seg.longueur) <= 0)
        errs.push(`Mur "${seg.name}" : la longueur doit être > 0.`);
      if (!seg.hauteur || parseFloat(seg.hauteur) <= 0)
        errs.push(`Mur "${seg.name}" : la hauteur doit être > 0.`);
      if (!seg.epaisseur || parseFloat(seg.epaisseur) <= 0)
        errs.push(`Mur "${seg.name}" : l'épaisseur doit être > 0.`);
      if (parseFloat(seg.brickL) <= 0 || parseFloat(seg.brickW) <= 0 || parseFloat(seg.brickH) <= 0)
        errs.push(`Mur "${seg.name}" : les dimensions de brique doivent être > 0.`);
    });
    return errs;
  };

  const computeSegment = (seg: WallSegment): SegmentResult => {
    const L = parseFloat(seg.longueur);
    const H = parseFloat(seg.hauteur);
    const E = parseFloat(seg.epaisseur) / 100;
    const bL = parseFloat(seg.brickL) / 100;
    const bW = parseFloat(seg.brickW) / 100;
    const bHt = parseFloat(seg.brickH) / 100;
    const joint = parseFloat(seg.jointThickness) / 100;
    const waste = parseFloat(seg.wastePercent) / 100;

    const grossArea = L * H;
    const openingsArea = seg.openings.reduce(
      (sum, o) => sum + o.width * o.height * (o.quantity || 1),
      0
    );
    const netArea = Math.max(0, grossArea - openingsArea);

    const autoLayers = Math.max(1, Math.round(E / bW));
    const layers = seg.layerMode === 'custom'
      ? Math.max(1, parseInt(seg.customLayers) || 1)
      : autoLayers;

    const bricksPerM2 = (1 / ((bL + joint) * (bHt + joint))) * layers;
    const bricksNeeded = Math.ceil(netArea * bricksPerM2);
    const bricksWithWaste = Math.ceil(bricksNeeded * (1 + waste));

    const wallVolume = netArea * E;
    const brickVolume = bricksNeeded * bL * bW * bHt;
    const mortarVolume = Math.max(0, wallVolume - brickVolume);

    const soilVolume = mortarVolume * 0.9;
    const soilKg = Math.ceil(soilVolume * 1600);
    const cementVolume = mortarVolume * 0.1;
    const cementBags = Math.ceil((cementVolume * 1500) / 50);

    const dryMixKg = soilKg + cementBags * 50;
    const waterLiters = Math.ceil(dryMixKg * 0.1);

    let rebarLength = 0;
    let rebarWeight = 0;
    let rebarCost = 0;

    if (seg.showRebar) {
      const diameter = parseFloat(seg.rebarDiameter);
      const btcSpacing = 1.20;
      const lintels = parseInt(seg.numLintels) || 0;

      const numVerticalBars = Math.ceil(L / btcSpacing) + 1;
      const verticalLength = numVerticalBars * H;
      const numHorizontalBars = Math.ceil(H / btcSpacing) + 1;
      const horizontalLength = numHorizontalBars * L;

      const lintelLength = seg.openings
        .slice(0, lintels)
        .reduce((sum, o) => sum + 2 * (o.width + 0.6), 0);

      rebarLength = horizontalLength + verticalLength + lintelLength;
      const weightPerMeter = (diameter * diameter) / 162;
      rebarWeight = rebarLength * weightPerMeter;
      rebarCost = Math.ceil(rebarWeight * prices.rebarPerKg);
    }

    const brickCost = bricksWithWaste * prices.brickUnit;
    const cementCost = cementBags * prices.cementBag;
    const laborCost = Math.ceil(netArea * prices.laborPerM2);
    const totalCost = brickCost + cementCost + laborCost + rebarCost;

    return {
      segmentId: seg.id,
      name: seg.name,
      netArea: parseFloat(netArea.toFixed(2)),
      grossArea: parseFloat(grossArea.toFixed(2)),
      bricksNeeded,
      bricksWithWaste,
      mortarVolume: parseFloat(mortarVolume.toFixed(3)),
      soilKg,
      cementBags,
      waterLiters,
      brickCost,
      cementCost,
      laborCost,
      rebarLength: seg.showRebar ? parseFloat(rebarLength.toFixed(2)) : undefined,
      rebarWeight: seg.showRebar ? parseFloat(rebarWeight.toFixed(2)) : undefined,
      rebarCost: seg.showRebar ? rebarCost : undefined,
      totalCost,
      layerCount: layers,
    };
  };

  const compute = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      setResults(null);
      return;
    }
    setErrors([]);

    const segmentResults = segments.map(computeSegment);

    const totals: ProjectTotals = {
      segments: segmentResults,
      totalNetArea: parseFloat(segmentResults.reduce((s, r) => s + r.netArea, 0).toFixed(2)),
      totalGrossArea: parseFloat(segmentResults.reduce((s, r) => s + r.grossArea, 0).toFixed(2)),
      totalBricksNeeded: segmentResults.reduce((s, r) => s + r.bricksNeeded, 0),
      totalBricksWithWaste: segmentResults.reduce((s, r) => s + r.bricksWithWaste, 0),
      totalMortarVolume: parseFloat(segmentResults.reduce((s, r) => s + r.mortarVolume, 0).toFixed(3)),
      totalSoilKg: segmentResults.reduce((s, r) => s + r.soilKg, 0),
      totalCementBags: segmentResults.reduce((s, r) => s + r.cementBags, 0),
      totalWaterLiters: segmentResults.reduce((s, r) => s + r.waterLiters, 0),
      totalBrickCost: segmentResults.reduce((s, r) => s + r.brickCost, 0),
      totalCementCost: segmentResults.reduce((s, r) => s + r.cementCost, 0),
      totalLaborCost: segmentResults.reduce((s, r) => s + r.laborCost, 0),
      totalRebarLength: segmentResults.reduce((s, r) => s + (r.rebarLength || 0), 0),
      totalRebarWeight: parseFloat(segmentResults.reduce((s, r) => s + (r.rebarWeight || 0), 0).toFixed(2)),
      totalRebarCost: segmentResults.reduce((s, r) => s + (r.rebarCost || 0), 0),
      grandTotal: segmentResults.reduce((s, r) => s + r.totalCost, 0),
    };

    setResults(totals);

    setTimeout(() => {
      document.getElementById('calc-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const fmt = useCallback((n: number) => n.toLocaleString('fr-FR'), []);

  const printEstimate = () => {
    if (!results) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const segmentRows = results.segments
      .map(
        (seg) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#333;font-weight:600;">${seg.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#666;text-align:center;">${seg.layerCount}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#666;text-align:center;">${seg.netArea} m²</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#666;text-align:center;">${fmt(seg.bricksWithWaste)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#8B4513;font-weight:700;text-align:right;">${fmt(seg.totalCost)} FCFA</td>
        </tr>
      `
      )
      .join('');

    const rebarSection = results.totalRebarLength > 0
      ? `
      <div class="section">
        <div class="section-header rebar-header">🔩 Armature (Ferraille)</div>
        <div class="section-body">
          <div class="row"><span class="label">Longueur totale barres</span><span class="value highlight">${fmt(results.totalRebarLength)} m</span></div>
          <div class="row"><span class="label">Poids total</span><span class="value highlight">${fmt(results.totalRebarWeight)} kg</span></div>
          <div class="row"><span class="label">Coût estimé</span><span class="value">${fmt(results.totalRebarCost)} FCFA</span></div>
        </div>
      </div>
    `
      : '';

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>BTC Expert — Devis Projet</title>
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
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #faf8f5; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #8B4513; text-transform: uppercase; text-align: left; border-bottom: 2px solid #8B4513; }
          th:last-child { text-align: right; }
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
            <strong>Devis Projet</strong>
            Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <h2>Résumé du Projet</h2>
        <p class="subtitle">${results.segments.length} mur${results.segments.length !== 1 ? 's' : ''} · Surface nette: ${results.totalNetArea} m² · Surface brute: ${results.totalGrossArea} m²</p>

        <table>
          <thead>
            <tr>
              <th>Mur</th>
              <th style="text-align:center;">Couches</th>
              <th style="text-align:center;">Surface</th>
              <th style="text-align:center;">Briques</th>
              <th style="text-align:right;">Coût</th>
            </tr>
          </thead>
          <tbody>
            ${segmentRows}
          </tbody>
        </table>

        <div class="section">
          <div class="section-header bricks-header">🧱 Briques — Total</div>
          <div class="section-body">
            <div class="row"><span class="label">Briques nécessaires (net)</span><span class="value">${fmt(results.totalBricksNeeded)} unités</span></div>
            <div class="row"><span class="label">Avec marge de perte</span><span class="value highlight">${fmt(results.totalBricksWithWaste)} unités</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header mortar-header">💧 Mortier & Matériaux</div>
          <div class="section-body">
            <div class="row"><span class="label">Volume mortier</span><span class="value">${results.totalMortarVolume} m³</span></div>
            <div class="row"><span class="label">Terre compressée</span><span class="value">${fmt(results.totalSoilKg)} kg</span></div>
            <div class="row"><span class="label">Sacs ciment (50 kg)</span><span class="value highlight">${results.totalCementBags} sacs</span></div>
            <div class="row"><span class="label">Eau</span><span class="value">${fmt(results.totalWaterLiters)} L</span></div>
          </div>
        </div>

        ${rebarSection}

        <div class="section">
          <div class="section-header cost-header">💰 Coût Total (FCFA)</div>
          <div class="section-body">
            <div class="row"><span class="label">Briques</span><span class="value">${fmt(results.totalBrickCost)} FCFA</span></div>
            <div class="row"><span class="label">Ciment</span><span class="value">${fmt(results.totalCementCost)} FCFA</span></div>
            <div class="row"><span class="label">Main-d'œuvre</span><span class="value">${fmt(results.totalLaborCost)} FCFA</span></div>
            ${results.totalRebarCost > 0 ? `<div class="row"><span class="label">Ferraille</span><span class="value">${fmt(results.totalRebarCost)} FCFA</span></div>` : ''}
          </div>
          <div class="total-row">
            <span class="label">Coût Total du Projet</span>
            <span class="value">${fmt(results.grandTotal)} FCFA</span>
          </div>
        </div>

        <p class="disclaimer">* Ce sont des estimations indicatives. Les quantités et prix réels peuvent varier selon la région et le fournisseur. — BTC Expert</p>

        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const activePreviewSegment = previewSegmentId
    ? segments.find((s) => s.id === previewSegmentId)
    : segments[0];

  return (
    <section id="calculator" className="py-20 bg-[#FAF8F5]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Calculateur de Devis BTC
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Ajoutez votre plan architectural et définissez chaque mur de votre projet pour un devis précis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* ── Left: Form ── */}
          <div className="flex flex-col gap-6">
            {/* Plan upload */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
                    <i className="ri-map-2-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Plan Architectural</h3>
                    <p className="text-sm text-gray-500">Importez votre plan pour référence</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {planImage ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={planImage}
                        alt="Plan architectural"
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => { setPlanImage(null); }}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 text-red-500 hover:bg-red-50 transition-colors cursor-pointer shadow-sm"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Utilisez ce plan comme référence pour définir vos murs ci-dessous.
                    </p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#8B4513] hover:bg-[#8B4513]/5 transition-all cursor-pointer">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#8B4513]/10">
                      <i className="ri-upload-cloud-2-line text-2xl text-[#8B4513]"></i>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Cliquez pour importer un plan</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG — max 5 Mo</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePlanUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2D Floor Plan */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowFloorPlan((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
              >
                {showFloorPlan ? <i className="ri-arrow-down-s-line text-[#8B4513]"></i> : <i className="ri-arrow-right-s-line text-[#8B4513]"></i>}
                Schéma 2D du plan
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs">
                  {showFloorPlan ? 'Visible' : 'Masqué'}
                </span>
              </button>
              {showFloorPlan && (
                <FloorPlan2D segments={segments} onSyncTo3D={onSyncTo3D} />
              )}
            </div>

            {/* Wall segments */}
            <form onSubmit={compute} className="space-y-6">
              {segments.map((seg, idx) => (
                <WallSegmentEditor
                  key={seg.id}
                  segment={seg}
                  onChange={(s) => updateSegment(seg.id, s)}
                  onRemove={() => removeSegment(seg.id)}
                  canRemove={segments.length > 1}
                />
              ))}

              {/* Add wall button */}
              <button
                type="button"
                onClick={addSegment}
                className="w-full h-12 rounded-xl border-2 border-dashed border-[#8B4513]/30 text-[#8B4513] font-semibold hover:bg-[#8B4513]/5 hover:border-[#8B4513]/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-add-circle-line text-lg"></i>
                Ajouter un mur
              </button>

              {/* Pricing */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPricing(!showPricing)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
                >
                  {showPricing ? <i className="ri-arrow-down-s-line text-[#8B4513]"></i> : <i className="ri-arrow-right-s-line text-[#8B4513]"></i>}
                  Prix unitaires (FCFA) — cliquez pour modifier
                </button>
                {showPricing && (
                  <div className="grid grid-cols-2 gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    {[
                      { label: 'Brique / unité', key: 'brickUnit' as const },
                      { label: 'Sac ciment (50 kg)', key: 'cementBag' as const },
                      { label: 'Main-d\'œuvre / m²', key: 'laborPerM2' as const },
                      { label: 'Fer / kg', key: 'rebarPerKg' as const },
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
                  {errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600 flex items-center gap-2">
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
                  Calculer le devis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreview(!showPreview);
                    if (!showPreview) setPreviewSegmentId(segments[0]?.id || null);
                  }}
                  className={`h-12 px-5 rounded-xl font-semibold whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 ${
                    showPreview
                      ? 'bg-[#8B4513] text-white shadow-md'
                      : 'bg-white text-[#8B4513] border-2 border-[#8B4513] hover:bg-[#8B4513]/5'
                  }`}
                >
                  <i className="ri-box-3-line text-lg"></i>
                  {showPreview ? 'Masquer' : 'Aperçu 3D'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right: Results ── */}
          <div className="flex flex-col gap-6">
            {results ? (
              <ProjectResults
                totals={results}
                prices={prices}
                onPrint={printEstimate}
                onClear={() => setResults(null)}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[260px]">
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[#8B4513]/10">
                  <i className="ri-calculator-line text-3xl text-[#8B4513]"></i>
                </div>
                <p className="text-gray-500 text-sm max-w-xs">
                  Remplissez les murs à gauche et cliquez sur <strong>Calculer le devis</strong> pour voir le total du projet.
                </p>
              </div>
            )}

            <ChatAssistant />
          </div>
        </div>

        {/* ── 3D Preview ── */}
        {showPreview && activePreviewSegment && (
          <div className="mt-8 max-w-7xl mx-auto">
            {/* Segment selector for preview */}
            {segments.length > 1 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm font-semibold text-gray-700">Aperçu :</span>
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setPreviewSegmentId(seg.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      previewSegmentId === seg.id || (!previewSegmentId && seg.id === segments[0].id)
                        ? 'bg-[#8B4513] text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#8B4513]'
                    }`}
                  >
                    {seg.name}
                  </button>
                ))}
              </div>
            )}
            <WallPreview3D
              longueur={activePreviewSegment.longueur}
              hauteur={activePreviewSegment.hauteur}
              epaisseur={activePreviewSegment.epaisseur}
              brickL={activePreviewSegment.brickL}
              brickW={activePreviewSegment.brickW}
              brickH={activePreviewSegment.brickH}
              jointThickness={activePreviewSegment.jointThickness}
              openings={activePreviewSegment.openings}
              showOpenings={true}
            />
          </div>
        )}
      </div>
    </section>
  );
}
