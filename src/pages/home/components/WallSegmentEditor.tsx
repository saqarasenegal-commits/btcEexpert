import { useState } from 'react';

export interface Opening {
  id: number;
  label: string;
  width: number;
  height: number;
  quantity: number;
}

export interface WallSegment {
  id: number;
  name: string;
  longueur: string;
  hauteur: string;
  epaisseur: string;
  brickL: string;
  brickW: string;
  brickH: string;
  jointThickness: string;
  wastePercent: string;
  layerMode: 'auto' | 'custom';
  customLayers: string;
  openings: Opening[];
  showOpenings: boolean;
  showRebar: boolean;
  rebarDiameter: string;
  numLintels: string;
}

export const DEFAULT_SEGMENT: WallSegment = {
  id: Date.now(),
  name: 'Mur 1',
  longueur: '5',
  hauteur: '3',
  epaisseur: '14',
  brickL: '29',
  brickW: '14',
  brickH: '9',
  jointThickness: '1',
  wastePercent: '5',
  layerMode: 'auto',
  customLayers: '1',
  openings: [{ id: Date.now() + 1, label: 'Porte', width: 0.9, height: 2.1, quantity: 1 }],
  showOpenings: false,
  showRebar: false,
  rebarDiameter: '10',
  numLintels: '0',
};

interface Props {
  segment: WallSegment;
  onChange: (segment: WallSegment) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function WallSegmentEditor({ segment, onChange, onRemove, canRemove }: Props) {
  const update = (field: keyof WallSegment, value: unknown) => {
    onChange({ ...segment, [field]: value });
  };

  const addOpening = () => {
    update('openings', [
      ...segment.openings,
      { id: Date.now(), label: 'Fenêtre', width: 1.2, height: 1.0, quantity: 1 },
    ]);
  };

  const removeOpening = (id: number) => {
    update('openings', segment.openings.filter((o) => o.id !== id));
  };

  const updateOpening = (id: number, field: keyof Opening, value: string | number) => {
    update(
      'openings',
      segment.openings.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const autoLayers = Math.max(
    1,
    Math.round(parseFloat(segment.epaisseur || '14') / 100 / (parseFloat(segment.brickW || '14') / 100))
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
            <i className="ri-ruler-line text-white text-lg"></i>
          </div>
          <input
            type="text"
            value={segment.name}
            onChange={(e) => update('name', e.target.value)}
            className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-transparent focus:border-[#8B4513] focus:outline-none px-1 transition-colors"
            placeholder="Nom du mur"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
            title="Supprimer ce mur"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Wall dimensions */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <i className="ri-ruler-2-line text-[#8B4513]"></i>
            Dimensions du mur (mètres)
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Longueur (m)', val: segment.longueur, field: 'longueur' as const, ph: '5.00' },
              { label: 'Hauteur (m)', val: segment.hauteur, field: 'hauteur' as const, ph: '3.00' },
              { label: 'Épaisseur (cm)', val: segment.epaisseur, field: 'epaisseur' as const, ph: '14' },
            ].map(({ label, val, field, ph }) => (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={ph}
                  value={val}
                  onChange={(e) => update(field, e.target.value)}
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
            Format de brique (cm) — Standard: 29×14×9
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Longueur', val: segment.brickL, field: 'brickL' as const },
              { label: 'Largeur', val: segment.brickW, field: 'brickW' as const },
              { label: 'Hauteur', val: segment.brickH, field: 'brickH' as const },
            ].map(({ label, val, field }) => (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Épaisseur joint (cm)</label>
              <input
                type="number"
                step="0.1"
                value={segment.jointThickness}
                onChange={(e) => update('jointThickness', e.target.value)}
                className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Marge de perte (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={segment.wastePercent}
                onChange={(e) => update('wastePercent', e.target.value)}
                className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Layer Plan */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => update('showOpenings', !segment.showOpenings)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            <i className={`ri-arrow-${segment.showOpenings ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
            Plan de couches (pose de briques)
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs">
              {segment.layerMode === 'auto' ? 'Auto' : `${Math.max(1, parseInt(segment.customLayers) || 1)} couche${Math.max(1, parseInt(segment.customLayers) || 1) !== 1 ? 's' : ''}`}
            </span>
          </button>
          {segment.showOpenings && (
            <div className="space-y-3 pl-4 border-l-2 border-[#8B4513]/20">
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full w-fit">
                <button
                  type="button"
                  onClick={() => update('layerMode', 'auto')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    segment.layerMode === 'auto'
                      ? 'bg-[#8B4513] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => update('layerMode', 'custom')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    segment.layerMode === 'custom'
                      ? 'bg-[#8B4513] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Personnalisé
                </button>
              </div>

              {segment.layerMode === 'auto' ? (
                <div className="rounded-lg bg-[#8B4513]/5 border border-[#8B4513]/10 px-3 py-2.5">
                  <p className="text-xs text-[#8B4513] leading-relaxed">
                    <strong>Mode Auto :</strong> Couches calculées automatiquement.
                    <br />
                    Mur <strong>{segment.epaisseur} cm</strong> ÷ brique <strong>{segment.brickW} cm</strong> = <strong>{autoLayers} couche{autoLayers !== 1 ? 's' : ''}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Nombre de couches</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={segment.customLayers}
                    onChange={(e) => update('customLayers', e.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] transition-all"
                  />
                  <p className="text-xs text-gray-400">
                    Épaisseur totale : {Math.max(1, parseInt(segment.customLayers) || 1) * parseFloat(segment.brickW || '14')} cm
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Openings */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => update('showOpenings', !segment.showOpenings)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            <i className={`ri-arrow-${segment.showOpenings ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
            Ouvertures (portes & fenêtres)
            {segment.openings.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs">
                {segment.openings.reduce((s, o) => s + (o.quantity || 1), 0)} ouverture{segment.openings.reduce((s, o) => s + (o.quantity || 1), 0) !== 1 ? 's' : ''}
              </span>
            )}
          </button>
          {segment.showOpenings && (
            <div className="space-y-2 pl-4 border-l-2 border-[#8B4513]/20">
              <div className="flex items-center gap-2 px-1">
                <span className="w-24 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Label</span>
                <span className="w-14 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Qté</span>
                <span className="w-20 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Larg. (m)</span>
                <span className="text-[10px] text-gray-300">×</span>
                <span className="w-20 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Haut. (m)</span>
                <span className="w-8"></span>
              </div>
              {segment.openings.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={o.label}
                    onChange={(e) => updateOpening(o.id, 'label', e.target.value)}
                    className="w-24 h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={o.quantity ?? 1}
                    onChange={(e) => updateOpening(o.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-14 h-9 rounded-lg border-2 border-[#8B4513]/40 bg-[#8B4513]/5 px-2 text-xs font-semibold text-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-center"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={o.width}
                    onChange={(e) => updateOpening(o.id, 'width', parseFloat(e.target.value))}
                    className="w-20 h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                    placeholder="L (m)"
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
                <i className="ri-add-line"></i> Ajouter une ouverture
              </button>
            </div>
          )}
        </div>

        {/* Reinforcement */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => update('showRebar', !segment.showRebar)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer"
          >
            <i className={`ri-arrow-${segment.showRebar ? 'down' : 'right'}-s-line text-[#8B4513]`}></i>
            Armature (ferraille)
          </button>
          {segment.showRebar && (
            <div className="space-y-3 pl-4 border-l-2 border-[#8B4513]/20">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                <i className="ri-information-line text-amber-600 mt-0.5 shrink-0"></i>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Standard BTC :</strong> Barres de fer tous les <strong>1,20 m</strong> — verticalement et horizontalement.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Diamètre barre (mm)</label>
                  <select
                    value={segment.rebarDiameter}
                    onChange={(e) => update('rebarDiameter', e.target.value)}
                    className="w-full h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513] cursor-pointer"
                  >
                    <option value="6">6 mm</option>
                    <option value="8">8 mm</option>
                    <option value="10">10 mm</option>
                    <option value="12">12 mm</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Nombre de linteaux</label>
                  <input
                    type="number"
                    min="0"
                    value={segment.numLintels}
                    onChange={(e) => update('numLintels', e.target.value)}
                    className="w-full h-9 rounded-lg border-2 border-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}