import FindMyCarApp from './FindMyCarApp';
import Hero3DCanvasLoader from './Hero3DCanvasLoader';

export default function Page() {
  return (
    <>
      {/* 3D canvas sits fixed behind everything — z-index: -1, pointer-events: none */}
      <Hero3DCanvasLoader />
      {/* Your existing app — completely untouched */}
      <FindMyCarApp />
    </>
  );
}