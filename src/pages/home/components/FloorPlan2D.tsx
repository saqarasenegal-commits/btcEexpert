import { useRef, useState, useCallback, useEffect } from 'react';
import type { WallSegment } from './WallSegmentEditor';
import type { RoomWall } from './SketchUp3DViewer';

/* ─── Types ─────────────────────────────────────────────── */
interface Point { x: number; y: number; }

interface PlanWall {
  id: number;
  x1: number; y1: number;
  x2: number; y2: number;
  segmentId: number | null;
}

interface Props {
  segments: WallSegment[];
  onSegmentClick?: (id: number) => void;
  onSyncTo3D?: (walls: RoomWall[], activeWallId: string) => void;
}

/* ─── Constants ─────────────────────────────────────────── */
const GRID = 20;
const M_PER_CELL = 0.5;
const WALL_STROKE = 10;
const CANVAS_W = 700;
const CANVAS_H = 480;

const WALL_COLORS = [
  '#8B4513', '#D2691E', '#A0522D', '#CD853F',
  '#B8860B', '#6B4226', '#C47A45', '#9C5A2D',
];

/* ─── Helpers ───────────────────────────────────────────── */
const snap = (v: number) => Math.round(v / GRID) * GRID;
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);
const mLabel = (px: number) => `${(px / GRID * M_PER_CELL).toFixed(1)} m`;
const pxToMeters = (px: number) => parseFloat((px / GRID * M_PER_CELL).toFixed(1));

/* ─── Component ─────────────────────────────────────────── */
export default function FloorPlan2D({ segments, onSegmentClick, onSyncTo3D }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [walls, setWalls] = useState<PlanWall[]>(() => buildInitialWalls(segments));
  const [drawing, setDrawing] = useState(false);
  const [startPt, setStartPt] = useState<Point | null>(null);
  const [cursorPt, setCursorPt] = useState<Point | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tool, setTool] = useState<'draw' | 'select' | 'erase'>('draw');
  const [showGrid, setShowGrid] = useState(true);
  const [showDims, setShowDims] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [syncFlash, setSyncFlash] = useState(false);
  const panStart = useRef<Point | null>(null);
  const panOrigin = useRef<Point>({ x: 0, y: 0 });

  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!synced && segments.length > 0) {
      setWalls(buildInitialWalls(segments));
      setSynced(true);
    }
  }, [segments, synced]);

  /* ── SVG coordinate helper ── */
  const svgPt = useCallback((e: React.MouseEvent): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: snap((e.clientX - rect.left - pan.x) / zoom),
      y: snap((e.clientY - rect.top - pan.y) / zoom),
    };
  }, [pan, zoom]);

  /* ── Mouse handlers ── */
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
      return;
    }
    if (tool === 'draw') {
      const pt = svgPt(e);
      setStartPt(pt);
      setCursorPt(pt);
      setDrawing(true);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (panning && panStart.current) {
      setPan({
        x: panOrigin.current.x + (e.clientX - panStart.current.x),
        y: panOrigin.current.y + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (drawing && tool === 'draw') {
      const pt = svgPt(e);
      if (startPt) {
        const dx = Math.abs(pt.x - startPt.x);
        const dy = Math.abs(pt.y - startPt.y);
        if (dx < GRID * 1.5) setCursorPt({ x: startPt.x, y: pt.y });
        else if (dy < GRID * 1.5) setCursorPt({ x: pt.x, y: startPt.y });
        else setCursorPt(pt);
      }
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (panning) { setPanning(false); panStart.current = null; return; }
    if (drawing && tool === 'draw' && startPt && cursorPt) {
      if (dist(startPt, cursorPt) > GRID * 0.5) {
        const newWall: PlanWall = {
          id: Date.now(),
          x1: startPt.x, y1: startPt.y,
          x2: cursorPt.x, y2: cursorPt.y,
          segmentId: null,
        };
        setWalls((prev) => [...prev, newWall]);
      }
      setDrawing(false);
      setStartPt(null);
      setCursorPt(null);
    }
  };

  const onWallClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'erase') {
      setWalls((prev) => prev.filter((w) => w.id !== id));
      if (selectedId === id) setSelectedId(null);
      return;
    }
    if (tool === 'select') {
      setSelectedId(id === selectedId ? null : id);
    }
  };

  const onSvgClick = () => {
    if (tool === 'select') setSelectedId(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(3, Math.max(0.3, z * delta)));
  };

  /* ── Link selected wall to a segment ── */
  const linkWallToSegment = (segId: number) => {
    if (selectedId === null) return;
    setWalls((prev) =>
      prev.map((w) => (w.id === selectedId ? { ...w, segmentId: segId } : w))
    );
  };

  /* ── Build RoomWall list from linked plan walls ── */
  const buildRoomWalls = useCallback((planWalls: PlanWall[]): RoomWall[] => {
    return planWalls
      .filter((w) => w.segmentId !== null)
      .map((w, idx) => {
        const seg = segments.find((s) => s.id === w.segmentId);
        const lengthM = pxToMeters(dist({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }));
        const heightM = seg ? parseFloat(seg.hauteur) || 3 : 3;
        const hasOpening = seg ? seg.openings.length > 0 : false;
        const firstOpening = seg?.openings[0];
        return {
          id: String(idx),
          label: seg ? seg.name : `Mur ${idx + 1}`,
          length: lengthM > 0 ? lengthM : 1,
          height: heightM,
          hasOpening,
          openingWidth: hasOpening && firstOpening ? firstOpening.width : 0,
          openingHeight: hasOpening && firstOpening ? firstOpening.height : 0,
        } as RoomWall;
      });
  }, [segments]);

  /* ── Sync to 3D ── */
  const handleSyncTo3D = () => {
    if (!onSyncTo3D) return;
    const roomWalls = buildRoomWalls(walls);
    if (roomWalls.length === 0) return;
    onSyncTo3D(roomWalls, roomWalls[0].id);
    setSyncFlash(true);
    setTimeout(() => setSyncFlash(false), 2000);
    // Scroll to SketchUp section
    setTimeout(() => {
      document.getElementById('sketchup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  /* ── Clear all ── */
  const clearAll = () => {
    setWalls([]);
    setSelectedId(null);
  };

  /* ── Reset to segments ── */
  const resetFromSegments = () => {
    setWalls(buildInitialWalls(segments));
    setSelectedId(null);
    setSynced(false);
  };

  /* ── Zoom controls ── */
  const zoomIn = () => setZoom((z) => Math.min(3, z * 1.2));
  const zoomOut = () => setZoom((z) => Math.max(0.3, z / 1.2));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const selectedWall = walls.find((w) => w.id === selectedId);
  const linkedCount = walls.filter((w) => w.segmentId !== null).length;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
            <i className="ri-layout-2-line text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Plan 2D du Projet</h3>
            <p className="text-xs text-gray-500">
              {walls.length} mur{walls.length !== 1 ? 's' : ''} dessiné{walls.length !== 1 ? 's' : ''} · {linkedCount} lié{linkedCount !== 1 ? 's' : ''} · 1 cellule = {M_PER_CELL} m
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${showGrid ? 'bg-[#8B4513]/10 text-[#8B4513]' : 'bg-gray-100 text-gray-500'}`}
          >
            <i className="ri-grid-line mr-1"></i>Grille
          </button>
          <button
            type="button"
            onClick={() => setShowDims((v) => !v)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${showDims ? 'bg-[#8B4513]/10 text-[#8B4513]' : 'bg-gray-100 text-gray-500'}`}
          >
            <i className="ri-ruler-line mr-1"></i>Cotes
          </button>
          <button
            type="button"
            onClick={resetFromSegments}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-1"></i>Sync
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-delete-bin-line mr-1"></i>Effacer
          </button>
          {/* ── SYNC TO 3D BUTTON ── */}
          {onSyncTo3D && (
            <button
              type="button"
              onClick={handleSyncTo3D}
              disabled={linkedCount === 0}
              className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                syncFlash
                  ? 'bg-green-500 text-white'
                  : linkedCount > 0
                  ? 'bg-gradient-to-r from-[#8B4513] to-[#D2691E] text-white hover:opacity-90'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={linkedCount === 0 ? 'Liez au moins un mur à un segment pour synchroniser' : 'Envoyer le plan vers la vue 3D SketchUp'}
            >
              <i className={`${syncFlash ? 'ri-checkbox-circle-line' : 'ri-box-3-line'} text-sm`}></i>
              {syncFlash ? 'Envoyé !' : `Voir en 3D (${linkedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
          {([
            { id: 'draw', icon: 'ri-pencil-line', label: 'Dessiner' },
            { id: 'select', icon: 'ri-cursor-line', label: 'Sélectionner' },
            { id: 'erase', icon: 'ri-eraser-line', label: 'Effacer' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              title={t.label}
              className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                tool === t.id ? 'bg-[#8B4513] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className={t.icon}></i>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button type="button" onClick={zoomOut} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer text-sm">
            <i className="ri-subtract-line"></i>
          </button>
          <button type="button" onClick={resetView} className="h-7 px-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer text-xs font-semibold whitespace-nowrap">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={zoomIn} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer text-sm">
            <i className="ri-add-line"></i>
          </button>
        </div>

        <p className="text-xs text-gray-400 w-full sm:w-auto">
          {tool === 'draw' && 'Cliquez-glissez pour tracer un mur. Alt+glisser pour déplacer la vue.'}
          {tool === 'select' && 'Cliquez un mur pour le sélectionner, puis liez-le à un segment.'}
          {tool === 'erase' && 'Cliquez un mur pour le supprimer.'}
        </p>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden bg-[#FDFAF7]" style={{ height: CANVAS_H }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className={`select-none ${tool === 'draw' ? 'cursor-crosshair' : tool === 'erase' ? 'cursor-not-allowed' : 'cursor-default'} ${panning ? 'cursor-grabbing' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setDrawing(false); setPanning(false); }}
          onClick={onSvgClick}
          onWheel={onWheel}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Grid */}
            {showGrid && (
              <g opacity="0.35">
                {Array.from({ length: Math.ceil(CANVAS_W / GRID) + 2 }, (_, i) => (
                  <line key={`v${i}`} x1={i * GRID} y1={0} x2={i * GRID} y2={CANVAS_H + GRID} stroke="#D2B48C" strokeWidth="0.5" />
                ))}
                {Array.from({ length: Math.ceil(CANVAS_H / GRID) + 2 }, (_, i) => (
                  <line key={`h${i}`} x1={0} y1={i * GRID} x2={CANVAS_W + GRID} y2={i * GRID} stroke="#D2B48C" strokeWidth="0.5" />
                ))}
                {Array.from({ length: Math.ceil(CANVAS_W / (GRID * 4)) + 2 }, (_, i) => (
                  <line key={`mv${i}`} x1={i * GRID * 4} y1={0} x2={i * GRID * 4} y2={CANVAS_H + GRID} stroke="#C4956A" strokeWidth="1" />
                ))}
                {Array.from({ length: Math.ceil(CANVAS_H / (GRID * 4)) + 2 }, (_, i) => (
                  <line key={`mh${i}`} x1={0} y1={i * GRID * 4} x2={CANVAS_W + GRID} y2={i * GRID * 4} stroke="#C4956A" strokeWidth="1" />
                ))}
              </g>
            )}

            {/* Scale ruler */}
            <g transform="translate(16, 16)">
              <rect x={0} y={0} width={GRID * 4} height={8} fill="#8B4513" rx={2} />
              <rect x={GRID * 4} y={0} width={GRID * 4} height={8} fill="#D2691E" rx={2} />
              <text x={0} y={20} fontSize={9} fill="#8B4513" fontWeight="600">0</text>
              <text x={GRID * 4 - 4} y={20} fontSize={9} fill="#8B4513" fontWeight="600">2m</text>
              <text x={GRID * 8 - 4} y={20} fontSize={9} fill="#8B4513" fontWeight="600">4m</text>
            </g>

            {/* Compass */}
            <g transform={`translate(${CANVAS_W - 36}, 28)`}>
              <circle cx={0} cy={0} r={18} fill="white" stroke="#e5e7eb" strokeWidth={1} />
              <text x={0} y={-6} textAnchor="middle" fontSize={10} fontWeight="800" fill="#8B4513">N</text>
              <line x1={0} y1={-14} x2={0} y2={14} stroke="#8B4513" strokeWidth={1.5} />
              <line x1={-14} y1={0} x2={14} y2={0} stroke="#ccc" strokeWidth={1} />
              <polygon points="0,-14 -4,0 0,-4 4,0" fill="#8B4513" />
            </g>

            {/* Drawn walls */}
            {walls.map((w, idx) => {
              const isSelected = w.id === selectedId;
              const linkedSeg = segments.find((s) => s.id === w.segmentId);
              const colorIdx = linkedSeg ? segments.indexOf(linkedSeg) % WALL_COLORS.length : idx % WALL_COLORS.length;
              const color = WALL_COLORS[colorIdx];
              const length = dist({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
              const mx = (w.x1 + w.x2) / 2;
              const my = (w.y1 + w.y2) / 2;
              const isHoriz = Math.abs(w.y2 - w.y1) < Math.abs(w.x2 - w.x1);

              return (
                <g key={w.id} onClick={(e) => onWallClick(w.id, e)} className="cursor-pointer">
                  <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="transparent" strokeWidth={WALL_STROKE + 12} />
                  <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={isSelected ? '#F59E0B' : color} strokeWidth={WALL_STROKE} strokeLinecap="square" />
                  {isSelected && (
                    <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#F59E0B" strokeWidth={WALL_STROKE + 4} strokeLinecap="square" opacity={0.3} />
                  )}
                  <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="square" />
                  <circle cx={w.x1} cy={w.y1} r={4} fill={isSelected ? '#F59E0B' : color} />
                  <circle cx={w.x2} cy={w.y2} r={4} fill={isSelected ? '#F59E0B' : color} />

                  {/* 3D link indicator */}
                  {linkedSeg && (
                    <circle cx={mx} cy={my} r={7} fill={color} opacity={0.9} />
                  )}
                  {linkedSeg && (
                    <text x={mx} y={my + 3} textAnchor="middle" fontSize={7} fontWeight="800" fill="white">3D</text>
                  )}

                  {showDims && length > GRID * 1.5 && (
                    <g transform={`translate(${mx},${my}) rotate(${isHoriz ? 0 : -90})`}>
                      <rect x={-22} y={linkedSeg ? -22 : -10} width={44} height={14} rx={3} fill="white" stroke={color} strokeWidth={0.8} opacity={0.92} />
                      <text textAnchor="middle" y={linkedSeg ? -11 : 1} fontSize={9} fontWeight="700" fill={color}>
                        {mLabel(length)}
                      </text>
                    </g>
                  )}

                  {linkedSeg && (
                    <g transform={`translate(${mx},${my})`}>
                      <rect x={isHoriz ? -20 : 12} y={isHoriz ? 12 : -8} width={44} height={14} rx={3} fill={color} opacity={0.9} />
                      <text x={isHoriz ? 2 : 34} y={isHoriz ? 22 : 2} textAnchor="middle" fontSize={8} fontWeight="700" fill="white">
                        {linkedSeg.name.length > 7 ? linkedSeg.name.slice(0, 7) + '…' : linkedSeg.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Ghost wall while drawing */}
            {drawing && startPt && cursorPt && (
              <g opacity={0.6}>
                <line x1={startPt.x} y1={startPt.y} x2={cursorPt.x} y2={cursorPt.y} stroke="#8B4513" strokeWidth={WALL_STROKE} strokeLinecap="square" strokeDasharray="8 4" />
                <circle cx={startPt.x} cy={startPt.y} r={5} fill="#8B4513" />
                <circle cx={cursorPt.x} cy={cursorPt.y} r={5} fill="#D2691E" />
                {dist(startPt, cursorPt) > GRID && (() => {
                  const mx2 = (startPt.x + cursorPt.x) / 2;
                  const my2 = (startPt.y + cursorPt.y) / 2;
                  const len = dist(startPt, cursorPt);
                  const isH = Math.abs(cursorPt.y - startPt.y) < Math.abs(cursorPt.x - startPt.x);
                  return (
                    <g transform={`translate(${mx2},${my2}) rotate(${isH ? 0 : -90})`}>
                      <rect x={-24} y={-11} width={48} height={15} rx={3} fill="#8B4513" opacity={0.9} />
                      <text textAnchor="middle" y={1} fontSize={9} fontWeight="700" fill="white">{mLabel(len)}</text>
                    </g>
                  );
                })()}
              </g>
            )}
          </g>
        </svg>

        {walls.length === 0 && !drawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#8B4513]/10 mb-3">
              <i className="ri-pencil-ruler-2-line text-3xl text-[#8B4513]/50"></i>
            </div>
            <p className="text-sm text-gray-400 font-medium">Cliquez-glissez pour tracer vos murs</p>
            <p className="text-xs text-gray-300 mt-1">Outil Dessiner actif · 1 cellule = {M_PER_CELL} m</p>
          </div>
        )}

        {/* Sync hint overlay */}
        {linkedCount > 0 && onSyncTo3D && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4513]/90 text-white rounded-full text-xs font-semibold">
              <i className="ri-box-3-line"></i>
              {linkedCount} mur{linkedCount > 1 ? 's' : ''} prêt{linkedCount > 1 ? 's' : ''} pour la 3D
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="p-4 border-t border-gray-100 bg-[#FDFAF7]">
        {selectedWall ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              <i className="ri-link-m text-[#8B4513]"></i>
              Mur sélectionné — longueur : <strong className="text-[#8B4513]">{mLabel(dist({ x: selectedWall.x1, y: selectedWall.y1 }, { x: selectedWall.x2, y: selectedWall.y2 }))}</strong>
              &nbsp;· Lier à un segment :
            </p>
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, idx) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => linkWallToSegment(seg.id)}
                  className={`h-7 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                    selectedWall.segmentId === seg.id ? 'text-white' : 'bg-white text-gray-700 border-gray-200 hover:border-[#8B4513] hover:text-[#8B4513]'
                  }`}
                  style={selectedWall.segmentId === seg.id ? { backgroundColor: WALL_COLORS[idx % WALL_COLORS.length], borderColor: WALL_COLORS[idx % WALL_COLORS.length] } : {}}
                >
                  {seg.name}
                </button>
              ))}
              {selectedWall.segmentId !== null && (
                <button
                  type="button"
                  onClick={() => setWalls((prev) => prev.map((w) => w.id === selectedId ? { ...w, segmentId: null } : w))}
                  className="h-7 px-3 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 cursor-pointer whitespace-nowrap"
                >
                  Délier
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: WALL_COLORS[idx % WALL_COLORS.length] + '20', color: WALL_COLORS[idx % WALL_COLORS.length] }}
                >
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: WALL_COLORS[idx % WALL_COLORS.length] }}></span>
                  {seg.name} · {seg.longueur}m
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {linkedCount > 0
                ? `${linkedCount} mur${linkedCount > 1 ? 's' : ''} lié${linkedCount > 1 ? 's' : ''} — cliquez "Voir en 3D" pour visualiser`
                : 'Sélectionnez un mur pour le lier à un segment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Build initial walls from segments ─────────────────── */
function buildInitialWalls(segments: WallSegment[]): PlanWall[] {
  const walls: PlanWall[] = [];
  const startX = 60;
  const startY = 60;
  const rowHeight = 120;
  const maxPerRow = 3;

  segments.forEach((seg, idx) => {
    const L = parseFloat(seg.longueur) || 5;
    const px = Math.round((L / M_PER_CELL) * GRID / GRID) * GRID;

    const col = idx % maxPerRow;
    const row = Math.floor(idx / maxPerRow);

    const x1 = startX + col * 240;
    const y1 = startY + row * rowHeight;
    const x2 = x1 + px;
    const y2 = y1;

    walls.push({
      id: seg.id * 100 + idx,
      x1, y1, x2, y2,
      segmentId: seg.id,
    });
  });

  return walls;
}
