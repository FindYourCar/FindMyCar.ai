import FindMyCarApp from './FindMyCarApp';
import Hero3DCanvasLoader from './Hero3DCanvasLoader';

export default function Page() {
  return (
    <>
      {/* 3D canvas sits fixed behind everything — z-index: -1, pointer-events: none */}
      <Hero3DCanvasLoader />
      {/* Content wrapper — sits above the canvas, all pointer events work normally */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: "auto", background: "transparent" }}>
        <FindMyCarApp />
      </div>
    </>
  );
}