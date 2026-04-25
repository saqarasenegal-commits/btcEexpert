import type { WallSegment } from './WallSegmentEditor';

export interface SegmentResult {
  segmentId: number;
  name: string;
  netArea: number;
  grossArea: number;
  bricksNeeded: number;
  bricksWithWaste: number;
  mortarVolume: number;
  soilKg: number;
  cementBags: number;
  waterLiters: number;
  brickCost: number;
  cementCost: number;
  laborCost: number;
  rebarLength?: number;
  rebarWeight?: number;
  rebarCost?: number;
  totalCost: number;
  layerCount: number;
}

export interface ProjectTotals {
  segments: SegmentResult[];
  totalNetArea: number;
  totalGrossArea: number;
  totalBricksNeeded: number;
  totalBricksWithWaste: number;
  totalMortarVolume: number;
  totalSoilKg: number;
  totalCementBags: number;
  totalWaterLiters: number;
  totalBrickCost: number;
  totalCementCost: number;
  totalLaborCost: number;
  totalRebarLength: number;
  totalRebarWeight: number;
  totalRebarCost: number;
  grandTotal: number;
}

interface Props {
  totals: ProjectTotals;
  prices: { brickUnit: number; cementBag: number; laborPerM2: number; rebarPerKg: number };
  onPrint: () => void;
  onClear: () => void;
}

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function ProjectResults({ totals, prices, onPrint, onClear }: Props) {
  return (
    <div id="calc-results" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
            <i className="ri-file-list-3-line text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Résultats du Projet</h3>
            <p className="text-xs text-gray-500">
              {totals.segments.length} mur{totals.segments.length !== 1 ? 's' : ''} · {fmt(totals.totalNetArea)} m² net
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#8B4513] text-white text-xs font-semibold hover:bg-[#A0522D] transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <i className="ri-printer-line text-sm"></i>
            Imprimer / PDF
          </button>
          <button
            onClick={onClear}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
            title="Effacer les résultats"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Per-segment breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i className="ri-stack-line text-[#8B4513]"></i>
            Détail par mur
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {totals.segments.map((seg) => (
              <div
                key={seg.segmentId}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded bg-[#8B4513]/10 text-[#8B4513] text-xs font-bold">
                    {seg.segmentId}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{seg.name}</p>
                    <p className="text-xs text-gray-400">
                      {seg.layerCount} couche{seg.layerCount !== 1 ? 's' : ''} · {seg.netArea} m² · {fmt(seg.bricksWithWaste)} briques
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#8B4513]">{fmt(seg.totalCost)} FCFA</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <ResultBlock
          icon="ri-layout-grid-line"
          title="Briques — Total Projet"
          color="from-[#8B4513] to-[#D2691E]"
          items={[
            { label: 'Briques nécessaires (net)', value: `${fmt(totals.totalBricksNeeded)} unités` },
            { label: 'Avec marge de perte', value: `${fmt(totals.totalBricksWithWaste)} unités`, highlight: true },
          ]}
        />

        <ResultBlock
          icon="ri-drop-line"
          title="Mortier & Matériaux — Total"
          color="from-amber-600 to-amber-400"
          items={[
            { label: 'Volume mortier', value: `${totals.totalMortarVolume.toFixed(3)} m³` },
            { label: 'Terre compressée', value: `${fmt(totals.totalSoilKg)} kg` },
            { label: 'Sacs ciment (50 kg)', value: `${totals.totalCementBags} sacs`, highlight: true },
            { label: 'Eau', value: `${fmt(totals.totalWaterLiters)} L` },
          ]}
        />

        {totals.totalRebarLength > 0 && (
          <ResultBlock
            icon="ri-hammer-line"
            title="Armature (Ferraille) — Total"
            color="from-slate-600 to-slate-400"
            items={[
              { label: 'Longueur totale barres', value: `${fmt(totals.totalRebarLength)} m`, highlight: true },
              { label: 'Poids total', value: `${fmt(totals.totalRebarWeight)} kg`, highlight: true },
              { label: 'Coût estimé', value: `${fmt(totals.totalRebarCost)} FCFA` },
            ]}
          />
        )}

        <ResultBlock
          icon="ri-money-cny-circle-line"
          title="Coût Total du Projet (FCFA)"
          color="from-green-700 to-green-500"
          items={[
            { label: 'Briques', value: `${fmt(totals.totalBrickCost)} FCFA` },
            { label: 'Ciment', value: `${fmt(totals.totalCementCost)} FCFA` },
            { label: 'Main-d\'œuvre', value: `${fmt(totals.totalLaborCost)} FCFA` },
            ...(totals.totalRebarCost > 0 ? [{ label: 'Ferraille', value: `${fmt(totals.totalRebarCost)} FCFA` }] : []),
          ]}
          footer={
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
              <span className="font-bold text-gray-900">Coût total du projet</span>
              <span className="text-2xl font-bold text-[#8B4513]">{fmt(totals.grandTotal)} FCFA</span>
            </div>
          }
        />

        <p className="text-xs text-gray-400 text-center">
          * Estimations indicatives. Les prix réels peuvent varier selon la région et le fournisseur.
        </p>
      </div>
    </div>
  );
}

/* ── Helper ── */
interface ResultItem { label: string; value: string; highlight?: boolean; }

function ResultBlock({
  icon,
  title,
  color,
  items,
  footer,
}: {
  icon: string;
  title: string;
  color: string;
  items: ResultItem[];
  footer?: React.ReactNode;
}) {
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