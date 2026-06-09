import FindMyCarApp from './FindMyCarApp';
import HeroSection from './components/HeroSection';
import CountrySection from './components/CountrySection';

export default function Page() {
  return (
    <>
      {/* Premium hero — black background, particle field, search bar, trust stats */}
      <HeroSection />
      {/* Country market cards with auto-rotating 3D cars */}
      <CountrySection />
      {/* Existing app content — unchanged */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: "auto", background: "transparent" }}>
        <FindMyCarApp />
      </div>
    </>
  );
}