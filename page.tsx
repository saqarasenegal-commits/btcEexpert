import Hero from './components/Hero';
import Calculator from './components/Calculator';
import ExpertiseCards from './components/ExpertiseCards';
import SketchUp3DViewer from './components/SketchUp3DViewer';
import ConstructionProcess from './components/ConstructionProcess';
import VideosSection from './components/VideosSection';
import FormationSection from './components/FormationSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-[#F5F1EB] to-[#FAF8F5]">
      <Hero />
      <Calculator />
      <ExpertiseCards />
      <SketchUp3DViewer />
      <ConstructionProcess />
      <VideosSection />
      <FormationSection />
    </div>
  );
}