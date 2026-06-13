// Cost-of-ownership data + calculation, shared between the full Cost Calculator
// page (CostCalculator in FindMyCarApp.jsx) and the hero-strip Cost Calculator
// modal (MarketTools.jsx). Single source of truth — figures based on official
// April 2026 data across NL, DE, BE and PL. All money is EUR internally.

export const CALC_DATA = {
  fuelPrices: {
    NL: { Petrol: 2.26, Diesel: 2.26, Electric: 0.27, Hybrid: 2.26 },
    DE: { Petrol: 2.16, Diesel: 2.36, Electric: 0.32, Hybrid: 2.16 },
    BE: { Petrol: 1.86, Diesel: 2.28, Electric: 0.28, Hybrid: 1.86 },
    PL: { Petrol: 1.55, Diesel: 1.58, Electric: 0.19, Hybrid: 1.55 },
  },
  consumption: { Petrol: 7.0, Diesel: 5.5, Electric: 18, Hybrid: 5.0 }, // per 100km
  roadTax: {
    NL: {
      Petrol:   { Small: 264, Compact: 402, "Mid-Range": 594, Premium: 822 },
      Diesel:   { Small: 370, Compact: 560, "Mid-Range": 830, Premium: 1150 },
      Hybrid:   { Small: 132, Compact: 201, "Mid-Range": 297, Premium: 411 },
      Electric: { Small: 0,   Compact: 0,   "Mid-Range": 0,   Premium: 0 },
    },
    DE: {
      Petrol:   { Small: 100, Compact: 150, "Mid-Range": 210, Premium: 340 },
      Diesel:   { Small: 280, Compact: 380, "Mid-Range": 500, Premium: 700 },
      Hybrid:   { Small: 80,  Compact: 120, "Mid-Range": 170, Premium: 270 },
      Electric: { Small: 0,   Compact: 0,   "Mid-Range": 0,   Premium: 0 },
    },
    BE: {
      Petrol:   { Small: 150, Compact: 300, "Mid-Range": 550, Premium: 900 },
      Diesel:   { Small: 200, Compact: 400, "Mid-Range": 750, Premium: 1200 },
      Hybrid:   { Small: 75,  Compact: 150, "Mid-Range": 275, Premium: 450 },
      Electric: { Small: 25,  Compact: 50,  "Mid-Range": 100, Premium: 150 },
    },
    PL: {
      Petrol:   { Small: 0, Compact: 0, "Mid-Range": 0, Premium: 0 },
      Diesel:   { Small: 0, Compact: 0, "Mid-Range": 0, Premium: 0 },
      Hybrid:   { Small: 0, Compact: 0, "Mid-Range": 0, Premium: 0 },
      Electric: { Small: 0, Compact: 0, "Mid-Range": 0, Premium: 0 },
    },
  },
  maintenance: {
    NL: { Small: 846, Compact: 948, "Mid-Range": 1128, Premium: 1440 },
    DE: { Small: 660, Compact: 930, "Mid-Range": 1200, Premium: 1560 },
    BE: { Small: 720, Compact: 870, "Mid-Range": 1080, Premium: 1440 },
    PL: { Small: 420, Compact: 570, "Mid-Range": 780,  Premium: 1050 },
  },
  maintenanceMultiplier: { Petrol: 1.0, Diesel: 1.0, Hybrid: 0.75, Electric: 0.35 },
  inspection: {
    NL: { Petrol: 40, Diesel: 60, Electric: 30, Hybrid: 40 },
    DE: { Petrol: 35, Diesel: 35, Electric: 25, Hybrid: 35 },
    BE: { Petrol: 23, Diesel: 23, Electric: 23, Hybrid: 23 },
    PL: { Petrol: 12, Diesel: 12, Electric: 12, Hybrid: 12 },
  },
  depreciationRate: {
    New:        { Petrol: 0.20,  Diesel: 0.20,  Hybrid: 0.20,  Electric: 0.25 },
    "Nearly New": { Petrol: 0.135, Diesel: 0.135, Hybrid: 0.135, Electric: 0.165 },
    Used:       { Petrol: 0.09,  Diesel: 0.09,  Hybrid: 0.09,  Electric: 0.11 },
    Old:        { Petrol: 0.06,  Diesel: 0.06,  Hybrid: 0.06,  Electric: 0.06 },
  },
  officialLinks: {
    NL: "https://www.belastingdienst.nl",
    DE: "https://kfz-steuer.wiki/en/car-tax-germany",
    BE: "https://www.myminfin.be",
    PL: null,
  },
};

export function calculateOwnership({ country, size, fuel, price, age, km }) {
  const d = CALC_DATA;

  // Fuel cost
  const consumption = d.consumption[fuel];
  const fuelPrice = d.fuelPrices[country][fuel];
  const fuelYearly = (km / 100) * consumption * fuelPrice;

  // Road tax
  const roadTaxYearly = d.roadTax[country][fuel][size] || 0;

  // Maintenance = base × fuel multiplier + inspection
  const maintBase = d.maintenance[country][size];
  const maintMult = d.maintenanceMultiplier[fuel];
  const inspection = d.inspection[country][fuel];
  const maintenanceYearly = maintBase * maintMult + inspection;

  // Depreciation
  const depRate = d.depreciationRate[age][fuel];
  let depreciationYearly = price * depRate;
  if (country === "BE") depreciationYearly *= 1.10;

  const totalYearly = fuelYearly + roadTaxYearly + maintenanceYearly + depreciationYearly;

  return {
    fuel: { yearly: fuelYearly, monthly: fuelYearly / 12 },
    roadTax: { yearly: roadTaxYearly, monthly: roadTaxYearly / 12 },
    maintenance: { yearly: maintenanceYearly, monthly: maintenanceYearly / 12 },
    depreciation: { yearly: depreciationYearly, monthly: depreciationYearly / 12 },
    total: { yearly: totalYearly, monthly: totalYearly / 12 },
  };
}

// Structural VIN decode (ISO 3779) — make from WMI, region, model year, and
// check-digit validation. Demo-grade: no live registry lookup.
export function decodeVin(raw) {
  const vin = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (vin.length !== 17) return null;

  const wmi = vin.substring(0, 3);
  const makes = {
    WBA: "BMW", WBS: "BMW M", WBY: "BMW i", WDB: "Mercedes-Benz", WDD: "Mercedes-Benz",
    WAU: "Audi", WUA: "Audi Sport", WVW: "Volkswagen", WV1: "VW Commercial",
    WP0: "Porsche", WP1: "Porsche SUV", TMB: "Škoda", VSS: "SEAT", VF1: "Renault",
    VF3: "Peugeot", VF7: "Citroën", ZFA: "Fiat", YV1: "Volvo", SAL: "Land Rover",
    SAJ: "Jaguar", JTD: "Toyota", SB1: "Toyota EU", VNK: "Toyota EU", KNA: "Kia", KMH: "Hyundai",
  };
  const make = makes[wmi] || "Unknown / niche (WMI " + wmi + ")";

  const regions = {
    W: "Germany", T: "Europe (Cz/Hu)", V: "Europe (Fr/Es)", Z: "Italy",
    Y: "Sweden/Finland", S: "United Kingdom", J: "Japan", K: "Korea",
    "1": "United States", "2": "Canada", "3": "Mexico", "4": "United States", "5": "United States",
  };
  const region = regions[vin[0]] || "Unknown";

  const yearMap = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018,
    K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027,
    W: 2028, X: 2029, Y: 2030, "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005,
    "6": 2006, "7": 2007, "8": 2008, "9": 2009,
  };
  const year = yearMap[vin[9]] || "Indeterminate";

  // ISO 3779 check digit (position 9)
  const translit = { A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9 };
  const weights = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
  let sum = 0, ok = true;
  for (let k = 0; k < 17; k++) {
    const c = vin[k];
    const v = /[0-9]/.test(c) ? +c : translit[c];
    if (v === undefined) { ok = false; break; }
    sum += v * weights[k];
  }
  let checkText = "Unverifiable";
  if (ok) {
    const r = sum % 11;
    const expect = r === 10 ? "X" : String(r);
    checkText = expect === vin[8] ? "Valid ✓" : "Mismatch ✗";
  }

  return { vin, make, region, year, checkText };
}
