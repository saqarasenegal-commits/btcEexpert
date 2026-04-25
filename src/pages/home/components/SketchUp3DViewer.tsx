import { useEffect, useRef, useState, useCallback } from 'react';

type BondPattern = 'running' | 'stack' | 'flemish' | 'english';
type ViewMode = '3d-wall' | 'floor-plan' | 'elevation' | 'section';

export interface RoomWall {
  id: string;
  label: string;
  length: number;
  height: number;
  hasOpening: boolean;
  openingWidth: number;
  openingHeight: number;
}

const BOND_PATTERNS: { id: BondPattern; label: string; desc: string; icon: string }[] = [
  { id: 'running', label: 'Running Bond', desc: 'Décalage ½ brique — le plus courant', icon: 'ri-layout-row-line' },
  { id: 'stack', label: 'Stack Bond', desc: 'Joints alignés verticalement', icon: 'ri-layout-grid-line' },
  { id: 'flemish', label: 'Flemish Bond', desc: 'Alternance boutisse/panneresse', icon: 'ri-layout-masonry-line' },
  { id: 'english', label: 'English Bond', desc: 'Rangées alternées panneresse/boutisse', icon: 'ri-layout-column-line' },
];

export const DEFAULT_WALLS: RoomWall[] = [
  { id: 'N', label: 'Mur Nord', length: 8, height: 3, hasOpening: false, openingWidth: 0, openingHeight: 0 },
  { id: 'S', label: 'Mur Sud', length: 8, height: 3, hasOpening: true, openingWidth: 2.1, openingHeight: 2.4 },
  { id: 'E', label: 'Mur Est', length: 6, height: 3, hasOpening: true, openingWidth: 1.2, openingHeight: 1.4 },
  { id: 'W', label: 'Mur Ouest', length: 6, height: 3, hasOpening: false, openingWidth: 0, openingHeight: 0 },
];

const BRICK_COLORS = {
  face: '#C8763A',
  faceLight: '#D98B50',
  faceDark: '#A05A28',
  top: '#B06030',
  side: '#8B4513',
  joint: '#E8D5B0',
  jointDark: '#C4A882',
  opening: '#D6EAF8',
  openingBorder: '#85C1E9',
  rebar: '#607D8B',
  rebarHighlight: '#90A4AE',
  ground: '#8D6E63',
  groundLight: '#A1887F',
};

// ─── Floor Plan Canvas ────────────────────────────────────────────────────────
function FloorPlanCanvas({ walls, pattern, brickL, brickW }: {
  walls: RoomWall[];
  pattern: BondPattern;
  brickL: number;
  brickW: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.fillStyle = '#F8F5F0';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#E8DDD0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const northWall = walls.find(w => w.id === 'N') || walls[0];
    const southWall = walls.find(w => w.id === 'S') || walls[1];
    const eastWall = walls.find(w => w.id === 'E') || walls[2];
    const westWall = walls.find(w => w.id === 'W') || walls[3];

    const roomW = Math.max(northWall.length, southWall.length, 4);
    const roomD = Math.max(eastWall.length, westWall.length, 4);
    const wallThick = brickW / 100;

    const padding = 80;
    const scaleX = (W - padding * 2) / (roomW + wallThick * 2);
    const scaleY = (H - padding * 2) / (roomD + wallThick * 2);
    const scale = Math.min(scaleX, scaleY, 60);

    const ox = W / 2 - (roomW / 2) * scale;
    const oy = H / 2 - (roomD / 2) * scale;

    const toX = (x: number) => ox + x * scale;
    const toY = (y: number) => oy + y * scale;
    const tw = wallThick * scale;

    // Draw floor fill
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(toX(0), toY(0), roomW * scale, roomD * scale);

    // Draw brick pattern on floor (top view)
    const bL = brickL / 100;
    const bW = brickW / 100;
    const joint = 0.01;

    const drawFloorBricks = () => {
      const brickPxL = bL * scale;
      const brickPxW = bW * scale;
      const jointPx = joint * scale;

      ctx.save();
      ctx.beginPath();
      ctx.rect(toX(0), toY(0), roomW * scale, roomD * scale);
      ctx.clip();

      let row = 0;
      for (let y = toY(0); y < toY(roomD); y += brickPxW + jointPx) {
        const offset = (pattern === 'running' && row % 2 === 1) ? brickPxL / 2 :
          (pattern === 'flemish' && row % 2 === 1) ? brickPxL * 0.75 : 0;
        for (let x = toX(0) - offset; x < toX(roomW); x += brickPxL + jointPx) {
          ctx.fillStyle = row % 2 === 0 ? '#E8C9A0' : '#DFC090';
          ctx.fillRect(x + jointPx / 2, y + jointPx / 2, brickPxL - jointPx, brickPxW - jointPx);
          ctx.strokeStyle = '#C4A882';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + jointPx / 2, y + jointPx / 2, brickPxL - jointPx, brickPxW - jointPx);
        }
        row++;
      }
      ctx.restore();
    };
    drawFloorBricks();

    // Draw walls (thick lines)
    const drawWallSection = (
      x1: number, y1: number, x2: number, y2: number,
      wall: RoomWall, isHorizontal: boolean
    ) => {
      const wx1 = toX(x1), wy1 = toY(y1), wx2 = toX(x2), wy2 = toY(y2);

      // Wall fill with brick pattern
      ctx.fillStyle = '#8B4513';
      if (isHorizontal) {
        ctx.fillRect(wx1, wy1 - tw, wx2 - wx1, tw);
        // Brick joints in wall
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        const bPx = bL * scale;
        let bx = wx1;
        while (bx < wx2) {
          ctx.beginPath(); ctx.moveTo(bx, wy1 - tw); ctx.lineTo(bx, wy1); ctx.stroke();
          bx += bPx;
        }
        // Opening
        if (wall.hasOpening && wall.openingWidth > 0) {
          const oStart = toX((wall.length - wall.openingWidth) / 2);
          const oEnd = toX((wall.length - wall.openingWidth) / 2 + wall.openingWidth);
          ctx.fillStyle = '#D6EAF8';
          ctx.fillRect(oStart, wy1 - tw, oEnd - oStart, tw);
          ctx.strokeStyle = '#85C1E9';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(oStart, wy1 - tw, oEnd - oStart, tw);
        }
      } else {
        ctx.fillRect(wx1, wy1, tw, wy2 - wy1);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.8;
        const bPx = bL * scale;
        let by = wy1;
        while (by < wy2) {
          ctx.beginPath(); ctx.moveTo(wx1, by); ctx.lineTo(wx1 + tw, by); ctx.stroke();
          by += bPx;
        }
        if (wall.hasOpening && wall.openingWidth > 0) {
          const oStart = toY((wall.length - wall.openingWidth) / 2);
          const oEnd = toY((wall.length - wall.openingWidth) / 2 + wall.openingWidth);
          ctx.fillStyle = '#D6EAF8';
          ctx.fillRect(wx1, oStart, tw, oEnd - oStart);
          ctx.strokeStyle = '#85C1E9';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(wx1, oStart, tw, oEnd - oStart);
        }
      }
    };

    // North wall (top)
    drawWallSection(0, 0, northWall.length, 0, northWall, true);
    // South wall (bottom)
    drawWallSection(0, roomD, southWall.length, roomD, southWall, true);
    // West wall (left)
    drawWallSection(0, 0, 0, westWall.length, westWall, false);
    // East wall (right)
    drawWallSection(roomW, 0, roomW, eastWall.length, eastWall, false);

    // Corners
    ctx.fillStyle = '#654321';
    ctx.fillRect(toX(0) - tw, toY(0) - tw, tw, tw);
    ctx.fillRect(toX(roomW), toY(0) - tw, tw, tw);
    ctx.fillRect(toX(0) - tw, toY(roomD), tw, tw);
    ctx.fillRect(toX(roomW), toY(roomD), tw, tw);

    // Dimension arrows
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // Width dimension
    const dimY = toY(roomD) + tw + 25;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(toX(0), dimY); ctx.lineTo(toX(roomW), dimY); ctx.stroke();
    ctx.fillText(`${roomW.toFixed(1)} m`, (toX(0) + toX(roomW)) / 2, dimY - 5);

    // Depth dimension
    const dimX = toX(0) - tw - 30;
    ctx.save();
    ctx.translate(dimX, (toY(0) + toY(roomD)) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${roomD.toFixed(1)} m`, 0, 0);
    ctx.restore();

    // Compass rose
    const cx = W - 45, cy = 45;
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - 18);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';
    ctx.fill();

    // Legend
    ctx.fillStyle = '#666';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(15, H - 45, 12, 12);
    ctx.fillStyle = '#555';
    ctx.fillText('Mur BTC', 32, H - 35);
    ctx.fillStyle = '#D6EAF8';
    ctx.fillRect(15, H - 28, 12, 12);
    ctx.strokeStyle = '#85C1E9';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, H - 28, 12, 12);
    ctx.fillStyle = '#555';
    ctx.fillText('Ouverture', 32, H - 18);

  }, [walls, pattern, brickL, brickW]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={500}
      className="w-full h-auto rounded-xl bg-white shadow-inner"
    />
  );
}

// ─── 3D Isometric Wall Canvas ─────────────────────────────────────────────────
function Wall3DCanvas({ wall, pattern, brickL, brickH, brickW, jointThickness }: {
  wall: RoomWall;
  pattern: BondPattern;
  brickL: number;
  brickH: number;
  brickW: number;
  jointThickness: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#EEE8E0');
    grad.addColorStop(1, '#D8CFC4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const wallLength = wall.length;
    const wallHeight = wall.height;
    const wallThick = brickW / 100;
    const bL = brickL / 100;
    const bH = brickH / 100;
    const joint = jointThickness / 100;

    const padding = 60;
    const isoAngle = Math.PI / 6;
    const scale = Math.min(
      (W - padding * 2) / (wallLength + wallThick * Math.cos(isoAngle) * 2),
      (H - padding * 2) / (wallHeight + wallThick * Math.sin(isoAngle) * 2 + 0.5)
    );

    const offsetX = W / 2 - (wallLength * scale) / 2 + (wallThick * Math.cos(isoAngle) * scale) / 2;
    const offsetY = H / 2 + (wallHeight * scale) / 2 + (wallThick * Math.sin(isoAngle) * scale) / 2;

    const toIso = (x: number, y: number, z: number) => ({
      x: (x - z) * Math.cos(isoAngle) * scale + offsetX,
      y: offsetY - y * scale - (x + z) * Math.sin(isoAngle) * scale,
    });

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    const g1 = toIso(0, 0, 0);
    const g2 = toIso(wallLength, 0, 0);
    const g3 = toIso(wallLength, 0, wallThick);
    const g4 = toIso(0, 0, wallThick);
    ctx.moveTo(g1.x + 4, g1.y + 6);
    ctx.lineTo(g2.x + 4, g2.y + 6);
    ctx.lineTo(g3.x + 4, g3.y + 6);
    ctx.lineTo(g4.x + 4, g4.y + 6);
    ctx.closePath();
    ctx.fill();

    // ── Draw individual bricks ──────────────────────────────────────────────
    const bLJ = bL + joint;
    const bHJ = bH + joint;

    const isInOpening = (bx: number, by: number): boolean => {
      if (!wall.hasOpening || wall.openingWidth <= 0) return false;
      const oStart = (wallLength - wall.openingWidth) / 2;
      const oEnd = oStart + wall.openingWidth;
      return bx + bL > oStart && bx < oEnd && by < wall.openingHeight;
    };

    const getPatternOffset = (row: number): number => {
      switch (pattern) {
        case 'running': return (row % 2) * (bLJ / 2);
        case 'stack': return 0;
        case 'flemish': return (row % 2) * (bLJ * 0.75);
        case 'english': return (row % 2) * (bLJ / 2);
        default: return 0;
      }
    };

    // Draw bricks row by row (bottom to top for correct overlap)
    let row = 0;
    for (let by = 0; by < wallHeight; by += bHJ) {
      const offset = getPatternOffset(row);
      for (let bx = -offset; bx < wallLength; bx += bLJ) {
        if (bx + bL <= 0) { continue; }
        const actualBx = Math.max(0, bx);
        const actualBL = Math.min(bx + bL, wallLength) - actualBx;
        if (actualBL <= 0) continue;

        if (isInOpening(actualBx, by)) continue;

        const isEnglishHeader = pattern === 'english' && row % 2 === 1;
        const brickDepth = isEnglishHeader ? wallThick : bL;

        // Shade variation per brick
        const shade = ((row + Math.floor(bx / bLJ)) % 3) * 8;
        const r = Math.min(200 + shade, 220);
        const g = Math.min(118 + shade, 140);
        const b = Math.max(58 - shade, 40);

        // Front face
        const p1 = toIso(actualBx, by, 0);
        const p2 = toIso(actualBx + actualBL, by, 0);
        const p3 = toIso(actualBx + actualBL, by + bH, 0);
        const p4 = toIso(actualBx, by + bH, 0);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        // Joint lines on front
        ctx.strokeStyle = BRICK_COLORS.jointDark;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Top face
        const t1 = toIso(actualBx, by + bH, 0);
        const t2 = toIso(actualBx + actualBL, by + bH, 0);
        const t3 = toIso(actualBx + actualBL, by + bH, brickDepth);
        const t4 = toIso(actualBx, by + bH, brickDepth);

        ctx.fillStyle = `rgb(${Math.min(r + 20, 255)},${Math.min(g + 15, 255)},${Math.min(b + 10, 255)})`;
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(t4.x, t4.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = BRICK_COLORS.jointDark;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Right side face (only for rightmost visible brick)
        if (bx + bLJ >= wallLength || isInOpening(bx + bLJ, by)) {
          const r1 = toIso(actualBx + actualBL, by, 0);
          const r2 = toIso(actualBx + actualBL, by, brickDepth);
          const r3 = toIso(actualBx + actualBL, by + bH, brickDepth);
          const r4 = toIso(actualBx + actualBL, by + bH, 0);

          ctx.fillStyle = `rgb(${Math.max(r - 30, 0)},${Math.max(g - 25, 0)},${Math.max(b - 15, 0)})`;
          ctx.beginPath();
          ctx.moveTo(r1.x, r1.y);
          ctx.lineTo(r2.x, r2.y);
          ctx.lineTo(r3.x, r3.y);
          ctx.lineTo(r4.x, r4.y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = BRICK_COLORS.jointDark;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      row++;
    }

    // Draw opening frame
    if (wall.hasOpening && wall.openingWidth > 0) {
      const oStart = (wallLength - wall.openingWidth) / 2;
      const oEnd = oStart + wall.openingWidth;
      const oH = wall.openingHeight;

      // Opening void (sky/interior)
      const o1 = toIso(oStart, 0, 0);
      const o2 = toIso(oEnd, 0, 0);
      const o3 = toIso(oEnd, oH, 0);
      const o4 = toIso(oStart, oH, 0);

      ctx.fillStyle = 'rgba(180,220,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(o1.x, o1.y);
      ctx.lineTo(o2.x, o2.y);
      ctx.lineTo(o3.x, o3.y);
      ctx.lineTo(o4.x, o4.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#85C1E9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lintel label
      ctx.fillStyle = '#2980B9';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      const lintMid = toIso((oStart + oEnd) / 2, oH + 0.05, 0);
      ctx.fillText('Linteau', lintMid.x, lintMid.y - 4);
    }

    // Draw rebar lines (every 1.2m)
    const rebarSpacing = 1.2;
    ctx.strokeStyle = BRICK_COLORS.rebar;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);

    // Horizontal rebars
    for (let ry = rebarSpacing; ry < wallHeight; ry += rebarSpacing) {
      const rb1 = toIso(0, ry, 0);
      const rb2 = toIso(wallLength, ry, 0);
      ctx.beginPath();
      ctx.moveTo(rb1.x, rb1.y);
      ctx.lineTo(rb2.x, rb2.y);
      ctx.stroke();
    }

    // Vertical rebars
    for (let rx = rebarSpacing; rx < wallLength; rx += rebarSpacing) {
      const rv1 = toIso(rx, 0, 0);
      const rv2 = toIso(rx, wallHeight, 0);
      ctx.beginPath();
      ctx.moveTo(rv1.x, rv1.y);
      ctx.lineTo(rv2.x, rv2.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Dimension labels
    ctx.fillStyle = '#222';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';

    const lenS = toIso(0, 0, 0);
    const lenE = toIso(wallLength, 0, 0);
    ctx.fillText(`${wallLength.toFixed(1)} m`, (lenS.x + lenE.x) / 2, lenS.y + 22);

    const hS = toIso(0, 0, 0);
    const hE = toIso(0, wallHeight, 0);
    ctx.save();
    ctx.translate(hS.x - 28, (hS.y + hE.y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${wallHeight.toFixed(1)} m`, 0, 0);
    ctx.restore();

    const thS = toIso(wallLength, wallHeight, 0);
    const thE = toIso(wallLength, wallHeight, wallThick);
    ctx.fillText(`${brickW} cm`, (thS.x + thE.x) / 2, thS.y - 12);

    // Rebar legend
    ctx.strokeStyle = BRICK_COLORS.rebar;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(12, H - 22);
    ctx.lineTo(36, H - 22);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#555';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Armature ∅ (1.20 m)', 42, H - 18);

    // Pattern label
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Appareillage: ${BOND_PATTERNS.find(p => p.id === pattern)?.label}`, W - 12, H - 18);

  }, [wall, pattern, brickL, brickH, brickW, jointThickness]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={480}
      className="w-full h-auto rounded-xl shadow-inner"
    />
  );
}

// ─── Section Cut Canvas ───────────────────────────────────────────────────────
function SectionCutCanvas({ wall, brickL, brickH, brickW, jointThickness }: {
  wall: RoomWall;
  brickL: number;
  brickH: number;
  brickW: number;
  jointThickness: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#F0EBE3');
    bg.addColorStop(1, '#E0D8CE');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const wallH = wall.height;
    const wallThick = brickW / 100;
    const bH = brickH / 100;
    const joint = jointThickness / 100;
    const bHJ = bH + joint;

    const padding = 60;
    const scaleY = (H - padding * 2) / (wallH + 0.5);
    const scaleX = Math.min((W - padding * 2) / (wallThick * 3), scaleY * 3);
    const scale = Math.min(scaleX, scaleY);

    const cx = W / 2;
    const baseY = H - padding;
    const wallPxW = wallThick * scale;
    const startX = cx - wallPxW / 2;

    // Ground
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(0, baseY, W, H - baseY);
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(0, baseY, W, 4);

    // Draw brick courses in section
    let row = 0;
    for (let by = 0; by < wallH; by += bHJ) {
      const y = baseY - (by + bH) * scale;
      const brickH_px = bH * scale;

      // Alternate brick shade
      const shade = row % 2 === 0 ? 0 : 12;
      ctx.fillStyle = `rgb(${200 + shade},${118 + shade},${58 + shade})`;
      ctx.fillRect(startX, y, wallPxW, brickH_px);

      // Joint
      ctx.fillStyle = BRICK_COLORS.joint;
      ctx.fillRect(startX, y + brickH_px, wallPxW, joint * scale);

      // Brick outline
      ctx.strokeStyle = '#A0522D';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(startX, y, wallPxW, brickH_px);

      // Rebar hole (every 1.2m)
      const rebarSpacing = 1.2;
      if (Math.abs((by % rebarSpacing) - 0) < bHJ || by === 0) {
        const holeR = 4;
        const holeCX = cx;
        const holeCY = y + brickH_px / 2;
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(holeCX, holeCY, holeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = BRICK_COLORS.rebar;
        ctx.beginPath();
        ctx.arc(holeCX, holeCY, holeR - 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      row++;
    }

    // Dimension arrows
    // Height
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX - 20, baseY);
    ctx.lineTo(startX - 20, baseY - wallH * scale);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(startX - 35, baseY - (wallH * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${wallH.toFixed(1)} m`, 0, 0);
    ctx.restore();

    // Width
    ctx.beginPath();
    ctx.moveTo(startX, baseY + 20);
    ctx.lineTo(startX + wallPxW, baseY + 20);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`${brickW} cm`, cx, baseY + 35);

    // Labels
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Coupe transversale — Mur BTC', W / 2, 28);

    ctx.fillStyle = '#555';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Brique: ${brickL}×${brickW}×${brickH} cm | Joint: ${jointThickness} cm`, W / 2, H - 10);

    // Rebar legend
    ctx.fillStyle = BRICK_COLORS.rebar;
    ctx.beginPath();
    ctx.arc(cx + wallPxW / 2 + 30, baseY - wallH * scale / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Armature ∅', cx + wallPxW / 2 + 40, baseY - wallH * scale / 2 + 4);

  }, [wall, brickL, brickH, brickW, jointThickness]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={480}
      className="w-full h-auto rounded-xl shadow-inner"
    />
  );
}

interface SketchUpProps {
  externalWalls?: RoomWall[];
  syncedWallId?: string | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SketchUp3DViewer({ externalWalls, syncedWallId }: SketchUpProps = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>('3d-wall');
  const [selectedWallId, setSelectedWallId] = useState<string>('S');
  const [pattern, setPattern] = useState<BondPattern>('running');
  const [walls, setWalls] = useState<RoomWall[]>(DEFAULT_WALLS);
  const [brickL, setBrickL] = useState(29);
  const [brickH, setBrickH] = useState(9);
  const [brickW, setBrickW] = useState(14);
  const [jointThickness, setJointThickness] = useState(1);
  const [showRebarOverlay, setShowRebarOverlay] = useState(true);
  const [syncFlash, setSyncFlash] = useState(false);

  // Sync external walls from 2D plan
  useEffect(() => {
    if (externalWalls && externalWalls.length > 0) {
      setWalls(externalWalls);
      setSyncFlash(true);
      setTimeout(() => setSyncFlash(false), 1500);
    }
  }, [externalWalls]);

  // Auto-select synced wall
  useEffect(() => {
    if (syncedWallId) {
      setSelectedWallId(syncedWallId);
      setViewMode('3d-wall');
    }
  }, [syncedWallId]);

  const selectedWall = walls.find(w => w.id === selectedWallId) || walls[0];

  const updateWall = useCallback((id: string, field: keyof RoomWall, value: number | boolean) => {
    setWalls(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }, []);

  const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
    { id: '3d-wall', label: 'Vue 3D Mur', icon: 'ri-building-2-line' },
    { id: 'floor-plan', label: 'Plan de Sol', icon: 'ri-map-2-line' },
    { id: 'section', label: 'Coupe', icon: 'ri-scissors-cut-line' },
  ];

  return (
    <section id="sketchup" className="py-20 bg-gradient-to-b from-[#F5F1EB] to-[#FAF8F5]">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B4513]/10 rounded-full mb-4">
            <i className="ri-3d-cube-sphere-line text-[#8B4513]"></i>
            <span className="text-sm font-semibold text-[#8B4513] uppercase tracking-wider">Visualisation BTC</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Plan & Vision 3D SketchUp
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Visualisez votre construction BTC en 3D isométrique, plan de sol et coupe transversale — avec appareillage et armatures.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">

          {/* ── Left Panel: Controls ── */}
          <div className="space-y-5">

            {/* View Mode Selector */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="ri-eye-line text-[#8B4513]"></i> Vue
              </h3>
              <div className="space-y-2">
                {VIEW_MODES.map(vm => (
                  <button
                    key={vm.id}
                    onClick={() => setViewMode(vm.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === vm.id
                        ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-[#8B4513]/10 hover:text-[#8B4513]'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className={`${vm.icon} text-base`}></i>
                    </div>
                    {vm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wall Selector */}
            {(viewMode === '3d-wall' || viewMode === 'section') && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="ri-layout-4-line text-[#8B4513]"></i> Sélectionner le Mur
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {walls.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWallId(w.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        selectedWallId === w.id
                          ? 'bg-[#8B4513] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-[#8B4513]/10'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {/* Wall dimensions */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Longueur (m)</label>
                    <input
                      type="number"
                      value={selectedWall.length}
                      min={1} max={20} step={0.1}
                      onChange={e => updateWall(selectedWallId, 'length', parseFloat(e.target.value) || 1)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Hauteur (m)</label>
                    <input
                      type="number"
                      value={selectedWall.height}
                      min={1} max={6} step={0.1}
                      onChange={e => updateWall(selectedWallId, 'height', parseFloat(e.target.value) || 1)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasOpening"
                      checked={selectedWall.hasOpening}
                      onChange={e => updateWall(selectedWallId, 'hasOpening', e.target.checked)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="hasOpening" className="text-xs text-gray-600 cursor-pointer">Ouverture (porte/fenêtre)</label>
                  </div>
                  {selectedWall.hasOpening && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Larg. ouv. (m)</label>
                        <input
                          type="number"
                          value={selectedWall.openingWidth}
                          min={0.5} max={selectedWall.length - 0.5} step={0.1}
                          onChange={e => updateWall(selectedWallId, 'openingWidth', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Haut. ouv. (m)</label>
                        <input
                          type="number"
                          value={selectedWall.openingHeight}
                          min={0.5} max={selectedWall.height - 0.2} step={0.1}
                          onChange={e => updateWall(selectedWallId, 'openingHeight', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bond Pattern */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="ri-layout-masonry-line text-[#8B4513]"></i> Appareillage
              </h3>
              <div className="space-y-2">
                {BOND_PATTERNS.map(bp => (
                  <button
                    key={bp.id}
                    onClick={() => setPattern(bp.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      pattern === bp.id
                        ? 'bg-[#8B4513]/10 border border-[#8B4513]/30'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                      <i className={`${bp.icon} text-[#8B4513] text-sm`}></i>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${pattern === bp.id ? 'text-[#8B4513]' : 'text-gray-700'}`}>{bp.label}</p>
                      <p className="text-xs text-gray-400 leading-tight">{bp.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brick Dimensions */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="ri-stack-line text-[#8B4513]"></i> Format Brique (cm)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'L', value: brickL, setter: setBrickL, min: 15, max: 40 },
                  { label: 'l', value: brickW, setter: setBrickW, min: 10, max: 30 },
                  { label: 'H', value: brickH, setter: setBrickH, min: 5, max: 20 },
                ].map(dim => (
                  <div key={dim.label}>
                    <label className="text-xs text-gray-500 mb-1 block text-center">{dim.label}</label>
                    <input
                      type="number"
                      value={dim.value}
                      min={dim.min} max={dim.max}
                      onChange={e => dim.setter(parseInt(e.target.value) || dim.min)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#8B4513] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Joint (cm)</label>
                <input
                  type="number"
                  value={jointThickness}
                  min={0.5} max={3} step={0.5}
                  onChange={e => setJointThickness(parseFloat(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] cursor-pointer"
                />
              </div>
            </div>

            {/* Rebar toggle */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-git-branch-line text-[#8B4513]"></i>
                  <span className="text-sm font-semibold text-gray-700">Armatures (1.20 m)</span>
                </div>
                <button
                  onClick={() => setShowRebarOverlay(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showRebarOverlay ? 'bg-[#8B4513]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${showRebarOverlay ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Affiche les lignes d'armature tous les 1.20 m (standard BTC)</p>
            </div>

          </div>

          {/* ── Right Panel: Canvas ── */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
                  <i className="ri-3d-cube-sphere-line text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {viewMode === '3d-wall' && `Vue 3D — ${selectedWall.label}`}
                    {viewMode === 'floor-plan' && 'Plan de Sol — Vue de Dessus'}
                    {viewMode === 'section' && `Coupe Transversale — ${selectedWall.label}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {viewMode === '3d-wall' && `Appareillage: ${BOND_PATTERNS.find(p => p.id === pattern)?.label} · Armatures: ${showRebarOverlay ? 'visibles' : 'masquées'}`}
                    {viewMode === 'floor-plan' && `${walls.find(w => w.id === 'N')?.length ?? 8} × ${walls.find(w => w.id === 'E')?.length ?? 6} m · Pose: ${BOND_PATTERNS.find(p => p.id === pattern)?.label}`}
                    {viewMode === 'section' && `Épaisseur: ${brickW} cm · Brique: ${brickL}×${brickW}×${brickH} cm`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {syncFlash && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full animate-pulse">
                    <i className="ri-refresh-line mr-1"></i>Synchronisé depuis le plan 2D
                  </span>
                )}
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  <i className="ri-checkbox-circle-line mr-1"></i>Temps réel
                </span>
              </div>
            </div>

            <div className="p-5 bg-[#FAF8F5]">
              {viewMode === '3d-wall' && (
                <Wall3DCanvas
                  wall={selectedWall}
                  pattern={pattern}
                  brickL={brickL}
                  brickH={brickH}
                  brickW={brickW}
                  jointThickness={jointThickness}
                />
              )}
              {viewMode === 'floor-plan' && (
                <FloorPlanCanvas
                  walls={walls}
                  pattern={pattern}
                  brickL={brickL}
                  brickW={brickW}
                />
              )}
              {viewMode === 'section' && (
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <SectionCutCanvas
                      wall={selectedWall}
                      brickL={brickL}
                      brickH={brickH}
                      brickW={brickW}
                      jointThickness={jointThickness}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="px-5 py-3 bg-white border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <i className="ri-ruler-line text-[#8B4513]"></i>
                Brique: {brickL}×{brickW}×{brickH} cm
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-git-branch-line text-[#8B4513]"></i>
                Armature: ∅ tous les 1.20 m
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-layout-masonry-line text-[#8B4513]"></i>
                {BOND_PATTERNS.find(p => p.id === pattern)?.label}
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-door-open-line text-[#8B4513]"></i>
                {walls.filter(w => w.hasOpening).length} ouverture(s)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: 'ri-building-2-line', label: 'Vue 3D Isométrique', desc: 'Rendu brique par brique avec ombres et joints' },
            { icon: 'ri-map-2-line', label: 'Plan de Sol', desc: 'Vue de dessus avec pose des briques au sol' },
            { icon: 'ri-scissors-cut-line', label: 'Coupe Transversale', desc: 'Section du mur avec armatures intégrées' },
            { icon: 'ri-git-branch-line', label: 'Armatures BTC', desc: 'Standard 1.20 m horizontal et vertical' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#8B4513]/10 shrink-0">
                <i className={`${item.icon} text-[#8B4513] text-base`}></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
