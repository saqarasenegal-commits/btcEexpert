import { useEffect, useRef } from 'react';

interface Opening {
  id: number;
  label: string;
  width: number;
  height: number;
}

interface WallPreview3DProps {
  longueur: string;
  hauteur: string;
  epaisseur: string;
  brickL: string;
  brickW: string;
  brickH: string;
  jointThickness: string;
  openings: Opening[];
  showOpenings: boolean;
}

export default function WallPreview3D({
  longueur,
  hauteur,
  epaisseur,
  brickL,
  brickW,
  brickH,
  jointThickness,
  openings,
  showOpenings,
}: WallPreview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Parse dimensions
    const wallLength = parseFloat(longueur) || 5;
    const wallHeight = parseFloat(hauteur) || 3;
    const wallThickness = parseFloat(epaisseur) / 100 || 0.14;
    const brickLength = parseFloat(brickL) / 100 || 0.29;
    const brickHeight = parseFloat(brickH) / 100 || 0.09;
    const joint = parseFloat(jointThickness) / 100 || 0.01;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale to fit canvas
    const padding = 40;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    // Isometric projection angles
    const isoAngle = Math.PI / 6; // 30 degrees
    const scale = Math.min(
      availableWidth / (wallLength + wallThickness * Math.cos(isoAngle)),
      availableHeight / (wallHeight + wallThickness * Math.sin(isoAngle))
    );

    // Center the drawing
    const offsetX = canvas.width / 2 - (wallLength * scale) / 2;
    const offsetY = canvas.height / 2 + (wallHeight * scale) / 2;

    // Helper function to convert 3D to isometric 2D
    const toIso = (x: number, y: number, z: number) => {
      const isoX = (x - z) * Math.cos(isoAngle) * scale + offsetX;
      const isoY = offsetY - y * scale - (x + z) * Math.sin(isoAngle) * scale;
      return { x: isoX, y: isoY };
    };

    // Draw wall faces
    const drawWallFace = () => {
      // Front face
      ctx.fillStyle = '#D2691E';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;

      const p1 = toIso(0, 0, 0);
      const p2 = toIso(wallLength, 0, 0);
      const p3 = toIso(wallLength, wallHeight, 0);
      const p4 = toIso(0, wallHeight, 0);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw openings on front face
      if (showOpenings && openings.length > 0) {
        ctx.fillStyle = '#FAF8F5';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;

        let currentX = 0.5; // Start 0.5m from left edge
        openings.forEach((opening) => {
          const oWidth = opening.width;
          const oHeight = opening.height;
          const oY = 0; // Openings start from ground

          const o1 = toIso(currentX, oY, 0);
          const o2 = toIso(currentX + oWidth, oY, 0);
          const o3 = toIso(currentX + oWidth, oY + oHeight, 0);
          const o4 = toIso(currentX, oY + oHeight, 0);

          ctx.beginPath();
          ctx.moveTo(o1.x, o1.y);
          ctx.lineTo(o2.x, o2.y);
          ctx.lineTo(o3.x, o3.y);
          ctx.lineTo(o4.x, o4.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Label
          ctx.fillStyle = '#666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opening.label, (o1.x + o2.x) / 2, (o3.y + o4.y) / 2);

          currentX += oWidth + 0.3; // Space between openings
        });
      }

      // Top face
      ctx.fillStyle = '#A0522D';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;

      const t1 = toIso(0, wallHeight, 0);
      const t2 = toIso(wallLength, wallHeight, 0);
      const t3 = toIso(wallLength, wallHeight, wallThickness);
      const t4 = toIso(0, wallHeight, wallThickness);

      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.lineTo(t4.x, t4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right side face (thickness)
      ctx.fillStyle = '#8B4513';
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;

      const r1 = toIso(wallLength, 0, 0);
      const r2 = toIso(wallLength, 0, wallThickness);
      const r3 = toIso(wallLength, wallHeight, wallThickness);
      const r4 = toIso(wallLength, wallHeight, 0);

      ctx.beginPath();
      ctx.moveTo(r1.x, r1.y);
      ctx.lineTo(r2.x, r2.y);
      ctx.lineTo(r3.x, r3.y);
      ctx.lineTo(r4.x, r4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Draw brick pattern on front face
    const drawBrickPattern = () => {
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 0.5;

      const brickWithJoint = brickLength + joint;
      const brickHeightWithJoint = brickHeight + joint;

      // Draw horizontal lines (rows)
      let y = 0;
      let rowIndex = 0;
      while (y < wallHeight) {
        const p1 = toIso(0, y, 0);
        const p2 = toIso(wallLength, y, 0);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw vertical lines (columns) with offset for running bond
        const offset = (rowIndex % 2) * (brickWithJoint / 2);
        let x = -offset;
        while (x < wallLength) {
          if (x >= 0) {
            const v1 = toIso(x, y, 0);
            const v2 = toIso(x, Math.min(y + brickHeightWithJoint, wallHeight), 0);

            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.stroke();
          }
          x += brickWithJoint;
        }

        y += brickHeightWithJoint;
        rowIndex++;
      }
    };

    // Draw dimension labels
    const drawDimensions = () => {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';

      // Length label (bottom)
      const lenStart = toIso(0, 0, 0);
      const lenEnd = toIso(wallLength, 0, 0);
      ctx.fillText(
        `${wallLength.toFixed(2)} m`,
        (lenStart.x + lenEnd.x) / 2,
        lenStart.y + 20
      );

      // Height label (left)
      const heightStart = toIso(0, 0, 0);
      const heightEnd = toIso(0, wallHeight, 0);
      ctx.save();
      ctx.translate(heightStart.x - 25, (heightStart.y + heightEnd.y) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${wallHeight.toFixed(2)} m`, 0, 0);
      ctx.restore();

      // Thickness label (right side)
      const thickStart = toIso(wallLength, wallHeight, 0);
      const thickEnd = toIso(wallLength, wallHeight, wallThickness);
      ctx.fillText(
        `${(wallThickness * 100).toFixed(0)} cm`,
        (thickStart.x + thickEnd.x) / 2,
        thickStart.y - 10
      );
    };

    // Render
    drawWallFace();
    drawBrickPattern();
    drawDimensions();

    // Draw legend
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Brick: ${brickL}×${brickW}×${brickH} cm | Joint: ${jointThickness} cm`,
      10,
      canvas.height - 10
    );
  }, [longueur, hauteur, epaisseur, brickL, brickW, brickH, jointThickness, openings, showOpenings]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#8B4513]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8B4513] to-[#D2691E]">
            <i className="ri-3d-cube-line text-white"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">3D Wall Preview</h3>
            <p className="text-xs text-gray-500">Isometric view with brick pattern</p>
          </div>
        </div>
      </div>
      <div className="p-5 bg-[#FAF8F5]">
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="w-full h-auto rounded-lg bg-white shadow-inner"
        />
      </div>
    </div>
  );
}