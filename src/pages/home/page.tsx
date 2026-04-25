import { useState } from 'react';
import Hero from './components/Hero';
import Calculator from './components/Calculator';
import ExpertiseCards from './components/ExpertiseCards';
import SketchUp3DViewer from './components/SketchUp3DViewer';
import ConstructionProcess from './components/ConstructionProcess';
import VideosSection from './components/VideosSection';
import FormationSection from './components/FormationSection';
import type { RoomWall } from './components/SketchUp3DViewer';

export default function HomePage() {
  const [syncedWalls, setSyncedWalls] = useState<RoomWall[] | undefined>(undefined);
  const [syncedWallId, setSyncedWallId] = useState<string | null>(null);

  const handleSyncTo3D = (walls: RoomWall[], activeWallId: string) => {
    setSyncedWalls(walls);
    setSyncedWallId(activeWallId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-[#F5F1EB] to-[#FAF8F5]">
      <Hero />
      <Calculator onSyncTo3D={handleSyncTo3D} />
      <ExpertiseCards />
      <SketchUp3DViewer externalWalls={syncedWalls} syncedWallId={syncedWallId} />
      <ConstructionProcess />
      <VideosSection />
      <FormationSection />
    </div>
  );
}
