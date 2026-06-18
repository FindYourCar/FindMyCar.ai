"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Sparkles, Heart, GitCompare, ArrowRight, ArrowLeft, ArrowDown, Check, X,
  Car, Zap, Fuel, Gauge, Users, DoorOpen, MapPin, Star, PlusCircle,
  ChevronDown, Globe, Filter, Info, Shield, MessageCircle,
  TrendingUp, Lightbulb, ThumbsUp, Mail, Send, Settings, LogIn, UserPlus,
  Clock, History, Bookmark, Phone, MessageSquare, Plus, Trash2, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CALC_DATA, calculateOwnership } from "@/lib/ownership";
import CinematicIntro from "./components/CinematicIntro";
import MarketsBento from "./components/MarketsBento";
import HowItWorksSection from "./components/HowItWorksSection";
import Showroom from "./components/Showroom";
import TrustSection from "./components/TrustSection";
import LuxCursor from "./components/LuxCursor";
import TourMode from "./components/TourMode";
import MarketTools from "./components/MarketTools";
import CostCalculatorSection from "./components/CostCalculatorSection";
import LiveMarketCard from "./components/LiveMarketCard";

/* ============================================================
   VEHICLE TAXONOMY — generalised make / model / trim classification
   All pure data and helpers; defined once at module level.
   ============================================================ */

// ─── Make registry ────────────────────────────────────────────────────────────
// Key = any user-input variant (lowercase); value = { name, slug }.
// Multi-word brands must come first so MAKE_REGEX matches them before aliases.
const CANONICAL_MAKES = {
  "mercedes-benz":  { name: "Mercedes-Benz", slug: "mercedes-benz" },
  "mercedes benz":  { name: "Mercedes-Benz", slug: "mercedes-benz" },
  "mercedes":       { name: "Mercedes-Benz", slug: "mercedes-benz" },
  "alfa romeo":     { name: "Alfa Romeo",    slug: "alfa-romeo"    },
  "aston martin":   { name: "Aston Martin",  slug: "aston-martin"  },
  "land rover":     { name: "Land Rover",    slug: "land-rover"    },
  "range rover":    { name: "Land Rover",    slug: "land-rover"    },
  "rolls royce":    { name: "Rolls-Royce",   slug: "rolls-royce"   },
  "rolls-royce":    { name: "Rolls-Royce",   slug: "rolls-royce"   },
  "volkswagen":     { name: "Volkswagen",    slug: "volkswagen"    },
  "landrover":      { name: "Land Rover",    slug: "land-rover"    },
  "alfa":           { name: "Alfa Romeo",    slug: "alfa-romeo"    },
  "chevy":          { name: "Chevrolet",     slug: "chevrolet"     },
  "vauxhall":       { name: "Opel",          slug: "opel"          },
  "citroën":        { name: "Citroën",       slug: "citroen"       },
  "citroen":        { name: "Citroën",       slug: "citroen"       },
  "bmw":            { name: "BMW",           slug: "bmw"           },
  "vw":             { name: "Volkswagen",    slug: "volkswagen"    },
  "audi":           { name: "Audi",          slug: "audi"          },
  "toyota":         { name: "Toyota",        slug: "toyota"        },
  "volvo":          { name: "Volvo",         slug: "volvo"         },
  "ford":           { name: "Ford",          slug: "ford"          },
  "skoda":          { name: "Škoda",         slug: "skoda"         },
  "seat":           { name: "SEAT",          slug: "seat"          },
  "peugeot":        { name: "Peugeot",       slug: "peugeot"       },
  "renault":        { name: "Renault",       slug: "renault"       },
  "nissan":         { name: "Nissan",        slug: "nissan"        },
  "kia":            { name: "Kia",           slug: "kia"           },
  "hyundai":        { name: "Hyundai",       slug: "hyundai"       },
  "mazda":          { name: "Mazda",         slug: "mazda"         },
  "tesla":          { name: "Tesla",         slug: "tesla"         },
  "fiat":           { name: "Fiat",          slug: "fiat"          },
  "opel":           { name: "Opel",          slug: "opel"          },
  "dacia":          { name: "Dacia",         slug: "dacia"         },
  "mini":           { name: "MINI",          slug: "mini"          },
  "honda":          { name: "Honda",         slug: "honda"         },
  "mitsubishi":     { name: "Mitsubishi",    slug: "mitsubishi"    },
  "subaru":         { name: "Subaru",        slug: "subaru"        },
  "suzuki":         { name: "Suzuki",        slug: "suzuki"        },
  "jeep":           { name: "Jeep",          slug: "jeep"          },
  "chevrolet":      { name: "Chevrolet",     slug: "chevrolet"     },
  "lexus":          { name: "Lexus",         slug: "lexus"         },
  "porsche":        { name: "Porsche",       slug: "porsche"       },
  "bentley":        { name: "Bentley",       slug: "bentley"       },
  "maserati":       { name: "Maserati",      slug: "maserati"      },
  "cupra":          { name: "Cupra",         slug: "cupra"         },
};

// ─── Model family slug map ─────────────────────────────────────────────────────
// Key: "{makeSlug}:{user model key normalised to lowercase}" → AutoScout24 URL slug.
// Only MODEL FAMILY names live here — no trims, badges, or drivetrains.
// If a query resolves here the URL path is safe; otherwise → make-only fallback.
const MODEL_FAMILY_MAP = {
  // Volkswagen
  "volkswagen:golf":"golf","volkswagen:polo":"polo","volkswagen:passat":"passat",
  "volkswagen:tiguan":"tiguan","volkswagen:t-roc":"t-roc","volkswagen:troc":"t-roc",
  "volkswagen:arteon":"arteon","volkswagen:touareg":"touareg",
  "volkswagen:id3":"id-3","volkswagen:id4":"id-4","volkswagen:id.3":"id-3","volkswagen:id.4":"id-4",
  // BMW
  "bmw:1 series":"1er","bmw:1-series":"1er","bmw:1er":"1er",
  "bmw:2 series":"2er","bmw:2-series":"2er","bmw:2er":"2er",
  "bmw:3 series":"3er","bmw:3-series":"3er","bmw:3er":"3er",
  "bmw:4 series":"4er","bmw:4-series":"4er","bmw:4er":"4er",
  "bmw:5 series":"5er","bmw:5-series":"5er","bmw:5er":"5er",
  "bmw:6 series":"6er","bmw:6er":"6er",
  "bmw:7 series":"7er","bmw:7-series":"7er","bmw:7er":"7er",
  "bmw:8 series":"8er","bmw:8er":"8er",
  "bmw:x1":"x1","bmw:x2":"x2","bmw:x3":"x3","bmw:x4":"x4",
  "bmw:x5":"x5","bmw:x6":"x6","bmw:x7":"x7",
  "bmw:z3":"z3","bmw:z4":"z4","bmw:i3":"i3","bmw:i4":"i4","bmw:i8":"i8","bmw:ix":"ix",
  // Mercedes-Benz
  "mercedes-benz:a class":"a-klasse","mercedes-benz:a-class":"a-klasse",
  "mercedes-benz:b class":"b-klasse","mercedes-benz:b-class":"b-klasse",
  "mercedes-benz:c class":"c-klasse","mercedes-benz:c-class":"c-klasse",
  "mercedes-benz:e class":"e-klasse","mercedes-benz:e-class":"e-klasse",
  "mercedes-benz:s class":"s-klasse","mercedes-benz:s-class":"s-klasse",
  "mercedes-benz:g class":"g-klasse","mercedes-benz:g-class":"g-klasse",
  "mercedes-benz:gla":"gla","mercedes-benz:glb":"glb","mercedes-benz:glc":"glc",
  "mercedes-benz:gle":"gle","mercedes-benz:gls":"gls","mercedes-benz:gl":"gl",
  "mercedes-benz:cla":"cla","mercedes-benz:cls":"cls","mercedes-benz:sl":"sl","mercedes-benz:slk":"slk",
  "mercedes-benz:eqc":"eqc","mercedes-benz:eqa":"eqa","mercedes-benz:eqb":"eqb","mercedes-benz:eqs":"eqs",
  // Audi
  "audi:a1":"a1","audi:a2":"a2","audi:a3":"a3","audi:a4":"a4","audi:a5":"a5",
  "audi:a6":"a6","audi:a7":"a7","audi:a8":"a8",
  "audi:q2":"q2","audi:q3":"q3","audi:q4":"q4","audi:q5":"q5","audi:q7":"q7","audi:q8":"q8",
  "audi:tt":"tt","audi:r8":"r8","audi:e-tron":"e-tron","audi:etron":"e-tron",
  // Renault
  "renault:megane":"megane","renault:clio":"clio","renault:captur":"captur",
  "renault:kadjar":"kadjar","renault:zoe":"zoe","renault:twingo":"twingo",
  "renault:scenic":"scenic","renault:arkana":"arkana","renault:austral":"austral",
  // Peugeot
  "peugeot:208":"208","peugeot:308":"308","peugeot:408":"408","peugeot:508":"508",
  "peugeot:2008":"2008","peugeot:3008":"3008","peugeot:5008":"5008",
  // Toyota
  "toyota:yaris":"yaris","toyota:corolla":"corolla","toyota:camry":"camry",
  "toyota:rav4":"rav4","toyota:prius":"prius","toyota:c-hr":"c-hr","toyota:chr":"c-hr",
  "toyota:aygo":"aygo","toyota:supra":"supra","toyota:gr86":"gr86","toyota:hilux":"hilux",
  // Honda
  "honda:civic":"civic","honda:jazz":"jazz","honda:hr-v":"hr-v","honda:hrv":"hr-v",
  "honda:cr-v":"cr-v","honda:crv":"cr-v","honda:e":"e","honda:accord":"accord",
  // Mazda
  "mazda:mx-5":"mx-5","mazda:mx5":"mx-5","mazda:miata":"mx-5","mazda:roadster":"mx-5",
  "mazda:3":"3","mazda:6":"6","mazda:cx-3":"cx-3","mazda:cx-5":"cx-5",
  "mazda:cx-30":"cx-30","mazda:cx-60":"cx-60",
  // Škoda
  "skoda:octavia":"octavia","skoda:fabia":"fabia","skoda:superb":"superb",
  "skoda:karoq":"karoq","skoda:kodiaq":"kodiaq","skoda:enyaq":"enyaq","skoda:scala":"scala",
  // SEAT
  "seat:ibiza":"ibiza","seat:leon":"leon","seat:arona":"arona","seat:ateca":"ateca","seat:tarraco":"tarraco",
  // Cupra
  "cupra:formentor":"formentor","cupra:born":"born","cupra:leon":"leon","cupra:ateca":"ateca",
  // Volvo
  "volvo:s60":"s60","volvo:s90":"s90","volvo:v40":"v40","volvo:v60":"v60","volvo:v90":"v90",
  "volvo:xc40":"xc40","volvo:xc60":"xc60","volvo:xc90":"xc90",
  // MINI
  "mini:cooper":"mini","mini:mini":"mini","mini:hatch":"mini",
  "mini:countryman":"countryman","mini:clubman":"clubman","mini:paceman":"paceman",
  // Ford
  "ford:fiesta":"fiesta","ford:focus":"focus","ford:mondeo":"mondeo","ford:puma":"puma",
  "ford:kuga":"kuga","ford:mustang":"mustang","ford:mach-e":"mustang-mach-e",
  // Kia
  "kia:rio":"rio","kia:ceed":"ceed","kia:proceed":"proceed","kia:sportage":"sportage",
  "kia:sorento":"sorento","kia:stinger":"stinger","kia:ev6":"ev6","kia:niro":"niro",
  // Hyundai
  "hyundai:i20":"i20","hyundai:i30":"i30","hyundai:tucson":"tucson",
  "hyundai:santa fe":"santa-fe","hyundai:ioniq":"ioniq",
  "hyundai:ioniq5":"ioniq-5","hyundai:ioniq6":"ioniq-6","hyundai:kona":"kona",
  // Fiat
  "fiat:500":"500","fiat:tipo":"tipo","fiat:panda":"panda","fiat:500x":"500x",
  // Opel
  "opel:corsa":"corsa","opel:astra":"astra","opel:insignia":"insignia",
  "opel:mokka":"mokka","opel:zafira":"zafira","opel:crossland":"crossland",
  // Dacia
  "dacia:sandero":"sandero","dacia:duster":"duster","dacia:logan":"logan","dacia:spring":"spring",
  // Porsche
  "porsche:911":"911","porsche:718":"718","porsche:cayenne":"cayenne",
  "porsche:macan":"macan","porsche:panamera":"panamera","porsche:taycan":"taycan",
  // Tesla
  "tesla:model 3":"model-3","tesla:model-3":"model-3",
  "tesla:model s":"model-s","tesla:model-s":"model-s",
  "tesla:model x":"model-x","tesla:model-x":"model-x",
  "tesla:model y":"model-y","tesla:model-y":"model-y",
  // Alfa Romeo
  "alfa-romeo:giulia":"giulia","alfa-romeo:stelvio":"stelvio",
  "alfa-romeo:giulietta":"giulietta","alfa-romeo:tonale":"tonale",
  // Subaru
  "subaru:impreza":"impreza","subaru:forester":"forester",
  "subaru:outback":"outback","subaru:wrx":"wrx","subaru:brz":"brz","subaru:levorg":"levorg",
  // Nissan
  "nissan:micra":"micra","nissan:juke":"juke","nissan:qashqai":"qashqai",
  "nissan:leaf":"leaf","nissan:ariya":"ariya","nissan:gt-r":"gt-r","nissan:gtr":"gt-r",
  // Lexus
  "lexus:is":"is","lexus:es":"es","lexus:nx":"nx","lexus:rx":"rx",
  "lexus:ux":"ux","lexus:lc":"lc","lexus:ls":"ls",
  // Citroën
  "citroen:c3":"c3","citroen:c4":"c4","citroen:c5":"c5","citroen:berlingo":"berlingo",
  "citroen:c3 aircross":"c3-aircross","citroen:c5 aircross":"c5-aircross",
  // Mitsubishi
  "mitsubishi:eclipse cross":"eclipse-cross","mitsubishi:outlander":"outlander",
  "mitsubishi:asx":"asx","mitsubishi:colt":"colt","mitsubishi:l200":"l200",
  // Suzuki
  "suzuki:swift":"swift","suzuki:vitara":"vitara","suzuki:jimny":"jimny",
  "suzuki:sx4":"sx4-s-cross","suzuki:ignis":"ignis",
};

// Human-readable English display names for slugs that differ from natural English.
const MODEL_FAMILY_DISPLAY = {
  "1er":"1 Series","2er":"2 Series","3er":"3 Series","4er":"4 Series",
  "5er":"5 Series","6er":"6 Series","7er":"7 Series","8er":"8 Series",
  "c-klasse":"C-Class","e-klasse":"E-Class","a-klasse":"A-Class",
  "b-klasse":"B-Class","s-klasse":"S-Class","g-klasse":"G-Class",
  "mx-5":"MX-5","hr-v":"HR-V","cr-v":"CR-V","c-hr":"C-HR","t-roc":"T-Roc",
  "e-tron":"e-tron","id-3":"ID.3","id-4":"ID.4","gr86":"GR86",
  "santa-fe":"Santa Fe","ioniq-5":"IONIQ 5","ioniq-6":"IONIQ 6",
  "model-3":"Model 3","model-s":"Model S","model-x":"Model X","model-y":"Model Y",
  "mustang-mach-e":"Mustang Mach-E","gt-r":"GT-R","sx4-s-cross":"SX4 S-Cross",
};

// ─── Token classification sets ────────────────────────────────────────────────

// Body style variants → role "body": metadata only, never in URL path
const BODY_VARIANT_TOKENS = new Set([
  "avant","touring","combi","estate","wagon","sw","break","variant","allroad",
  "cross","country",          // "cross country" (Volvo)
  "cabrio","cabriolet","convertible","roadster","spider","spyder","targa",
  "coupe","fastback","sportback",
  "hatchback","hatch","hb","saloon","sedan","berlina",
  "suv","crossover","offroad","van","minivan","mpv","pickup","truck",
]);

// Performance / specification trim badges → role "trim": metadata only
const TRIM_BADGE_TOKENS = new Set([
  "s","r","rs","gt","gti","gtx","gts","sport","sports","sportline",
  "type",             // Honda "Type R" / BMW "M Type"
  "fr","vz",          // SEAT / Cupra
  "m","competition",  // BMW M
  "amg","brabus","night","edition",
  "trophy",           // Renault RS Trophy
  "n","nline","n-line",   // Hyundai N
  "active","life","style","comfort","lounge","allure","signature","exclusive",
  "premium","elite","elegance","luxury","limited","motion","trend","inspire",
  "icon","titanium","zetec","ghia","sensation","intens","zen","initiale",
  "graphite","access","acenta","se","xse","le","xl","lx","ex","sx",
]);

// All-wheel-drive / drivetrain designators → role "drivetrain": metadata only
const DRIVETRAIN_TOKENS = new Set([
  "xdrive","x-drive","quattro","4matic","4x4","awd","4drive","e-four","fwd","rwd","2wd",
]);

// Generation / chassis / platform codes → role "generation": metadata only
const GENERATION_TOKENS = new Set([
  "na","nb","nc","nd",                          // Mazda MX-5 gens
  "mk1","mk2","mk3","mk4","mk5","mk6","mk7","mk8",  // VW Golf / Ford Focus gens
  // BMW platform codes
  "e30","e36","e46","e60","e90","e91","e92","e93",
  "f10","f11","f20","f21","f30","f31","f32","f33","f36",
  "g20","g21","g22","g26","g30","g31","g38",
  // Honda Civic codes
  "ek","ej","ep","fn","fk",
  // Renault generation suffix
  "iv","v","vi",
]);

// Fuel injection / technology suffixes — classify as "engine_badge", never in URL path.
// Handles "35 TFSI", "40 TDI", "1.6 TSI", "dCi" etc.
const FUEL_TECH_TOKENS = new Set([
  "tfsi","tdi","tsi","dci","hdi","mpi","fsi","crdi","gdi",
  "bluehdi","tce","dce","sce","gte","mhev","shev",
]);

// Engine badge RE — tokens that reveal fuel/displacement but must NOT enter the URL path.
//   BMW-style with fuel letter:  320d, 540i, 116d, 530e
//   BMW-style bare (no letter):  540, 320, 116  ← [die]? makes fuel letter optional
//   MB-style alpha-prefix:       c220d, e350, a200, s500
// Does NOT match: Peugeot 308 / Porsche 911 (the map lookup gets those first);
// nor a4/v60 (single letter + ≤2 digits).
const ENGINE_BADGE_RE = /^\d{3}[die]?$|^[a-z]\d{3,}[a-z]?$/i;

// When ONLY an engine badge is found (no model family tokens), try to infer the
// model family from the badge's prefix.  BMW "3" → "3er", Mercedes "c" → "c-klasse".
const ENGINE_PREFIX_TO_MODEL = {
  "mercedes-benz:a":"a-klasse","mercedes-benz:b":"b-klasse",
  "mercedes-benz:c":"c-klasse","mercedes-benz:e":"e-klasse",
  "mercedes-benz:s":"s-klasse","mercedes-benz:g":"g-klasse",
  "bmw:1":"1er","bmw:2":"2er","bmw:3":"3er","bmw:4":"4er",
  "bmw:5":"5er","bmw:6":"6er","bmw:7":"7er","bmw:8":"8er",
};

// Hard stop tokens — collection ends immediately here.
// Fuel / country / filter words are hard stops.
// Body / trim / drivetrain words are NOT stops — resolveVehicle classifies them.
const STOP_TOKENS = new Set([
  "show","me","find","get","search","look","looking","want","need",
  "please","just","only","that","which","can","you","i","is","are",
  "a","an","the","in","at","for","with","from","to","of","about","by",
  "newer","older","newest","oldest","latest","new","used","recent",
  "good","best","cheap","reliable","efficient","clean","nice","or","and","not",
  "under","over","max","minimum","budget","km","mileage","year","since","after","before",
  "petrol","gasoline","benzine","benzin","diesel","electric","ev",
  "hybrid","phev","automatic","auto","manual","stick","automaat","handgeschakeld",
  "netherlands","holland","dutch","belgium","belgian","germany","german",
  "deutschland","poland","polish","nl","be","de","pl",
  "listing","listings","results","cars","vehicles","view","see",
  "benz","rover","romeo","martin",  // brand-fragment safety net
]);

// MAKE_REGEX: built from CANONICAL_MAKES, longest phrases first.
const _MAKE_PHRASES = Object.keys(CANONICAL_MAKES).sort((a, b) => b.length - a.length);
const MAKE_REGEX = new RegExp(`\\b(${_MAKE_PHRASES.join("|")})\\b`, "i");

// ─── Token role classifier ────────────────────────────────────────────────────
// Returns: "stop" | "model_family" | "body" | "trim" | "drivetrain" | "engine_badge" | "generation"
// NOTE: "model_family" is a provisional role — resolveVehicle() may demote these tokens
//       to engine_badge / generation via the key-trimming fallback.
function classifyToken(t) {
  if (!t) return "stop";
  if (STOP_TOKENS.has(t))         return "stop";
  if (/^\d{4}$/.test(t))          return "stop";   // standalone year
  if (/^\d{5,}$/.test(t))         return "stop";   // price / mileage
  if (BODY_VARIANT_TOKENS.has(t)) return "body";
  if (TRIM_BADGE_TOKENS.has(t))   return "trim";
  if (DRIVETRAIN_TOKENS.has(t))   return "drivetrain";
  if (GENERATION_TOKENS.has(t))   return "generation";
  if (FUEL_TECH_TOKENS.has(t))    return "engine_badge"; // tfsi, tdi, tsi, dci…
  if (ENGINE_BADGE_RE.test(t))    return "engine_badge"; // 320d, 540, c220d…
  return "model_family";
}

// ─── Reclassify a demoted model_family token ──────────────────────────────────
// Called when key-trimming drops a token that was provisionally model_family.
// Determines the best non-family bucket for it.
function reclassifyDemoted(t) {
  if (/^[1-9]$/.test(t))                                return "generation"; // Golf 8 → gen 8
  if (/^\d{2}$/.test(t) && +t >= 25 && +t <= 70)       return "engine_badge"; // Audi 35/40/45
  if (/^\d{2,3}$/.test(t))                              return "engine_badge"; // BMW 540, 320
  if (FUEL_TECH_TOKENS.has(t))                          return "engine_badge";
  return "trim"; // safe default
}

// ─── Stage 1 (sync fallback): regex-based intent extractor ───────────────────
// Extracts raw fields only — no slug resolution.  resolveVehicle() does that.
function regexExtractIntent(query) {
  const q = (query || "").toLowerCase();
  const makeMatch = q.match(MAKE_REGEX);
  const makeEntry = makeMatch ? CANONICAL_MAKES[makeMatch[1].toLowerCase()] : null;

  // Collect post-make tokens. Stop only at STOP_TOKENS / year / price.
  // Trim, body, drivetrain words pass through — resolveVehicle classifies them.
  let model = null;
  if (makeMatch) {
    const after = q.slice(makeMatch.index + makeMatch[0].length).trim();
    const kept = [];
    for (const raw of after.split(/\s+/)) {
      const t = raw.replace(/[^a-z0-9-]/gi, "").toLowerCase();
      if (!t) continue;
      if (STOP_TOKENS.has(t) || /^\d{4}$/.test(t) || /^\d{5,}$/.test(t)) break;
      kept.push(t);
      if (kept.length >= 5) break; // generous cap; resolveVehicle trims further
    }
    if (kept.length) model = kept.join(" ");
  }

  const yrM = q.match(/(?:from|since|after|year\s*)((?:19|20)\d{2})\b/i) || q.match(/\b((?:19|20)\d{2})\b/);
  const year_min = yrM ? Number(yrM[1] || yrM[0].match(/\d{4}/)?.[0]) : null;

  const milM = q.match(/(?:under\s*)?(\d{1,3}(?:[.,]\d{3})*)(k)?\s*(?:km|kilometres|kilometers)\b/i);
  let mileage_max = null;
  if (milM) { mileage_max = parseInt(milM[1].replace(/[.,]/g, ""), 10); if (milM[2]) mileage_max *= 1000; }

  let budget_max = null;
  const budM = q.match(/(?:^|[^A-Za-z0-9€])(?:under\s*)?(?:€\s*)?(\d{4,}(?:[.,]\d{3})*)(k)?\b(?!\s*(?:km|kilometres|kilometers))/i)
    || q.match(/(?:^|[^A-Za-z0-9€])(?:€\s*)?(\d+(?:[.,]\d{3})*)k\b(?!\s*(?:km|kilometres|kilometers))/i);
  if (budM) { budget_max = parseInt(budM[1].replace(/[.,]/g, ""), 10); if (budM[2]) budget_max *= 1000; }

  let country = null;
  if (/\b(netherlands|dutch|holland|\bnl\b)\b/i.test(q)) country = "NL";
  else if (/\b(belgium|belgian|\bbe\b)\b/i.test(q)) country = "BE";
  else if (/\b(germany|german|deutschland|\bde\b)\b/i.test(q)) country = "DE";
  else if (/\b(poland|polish|\bpl\b)\b/i.test(q)) country = "PL";

  let fuel_type = null;
  if (/\b(plug.?in.?hybrid|phev)\b/i.test(q)) fuel_type = "plug_in_hybrid";
  else if (/\b(petrol|gasoline|benzine|benzin)\b/i.test(q)) fuel_type = "petrol";
  else if (/\bdiesel\b/i.test(q)) fuel_type = "diesel";
  else if (/\bhybrid\b/i.test(q)) fuel_type = "hybrid";
  else if (/\b(electric|ev\b|bev)\b/i.test(q)) fuel_type = "electric";

  let transmission = null;
  if (/\b(automatic|auto|automaat)\b/i.test(q)) transmission = "automatic";
  else if (/\b(manual|stick|handgeschakeld)\b/i.test(q)) transmission = "manual";

  const hasFilters = budget_max || mileage_max || year_min || fuel_type || transmission;
  const confidence = makeEntry
    ? (model ? (hasFilters ? 0.85 : 0.70) : 0.50)
    : (hasFilters ? 0.35 : 0.20);

  return { make: makeEntry?.name || null, makeSlug: makeEntry?.slug || null,
    model: model || null, fuel_type, transmission,
    budget_max, mileage_max, year_min, country, confidence, source: "regex" };
}

// ─── Stage 2+3: vehicle resolver ─────────────────────────────────────────────
// Replaces normaliseIntent() + determineSearchLevel().
// Classifies post-make tokens into roles, resolves the AutoScout24 slug,
// infers fuel from engine badge when possible, and determines search level.
function resolveVehicle(raw) {
  // 1. Resolve make
  const makeKey  = (raw.make || "").toLowerCase().trim();
  const makeEntry = CANONICAL_MAKES[makeKey] || null;
  const makeName  = makeEntry?.name || raw.make || null;
  const makeSlug  = makeEntry?.slug || raw.makeSlug
    || (makeName ? makeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null);

  // 2. Classify every post-make token
  const rawModel = (raw.model || "").toLowerCase().trim();
  const tokens   = rawModel ? rawModel.split(/\s+/).filter(Boolean) : [];
  const modelFamilyTokens = [];
  const metaTrim = [], metaBody = [], metaDrive = [], metaEngine = [], metaGen = [];

  for (const tok of tokens) {
    const t = tok.replace(/[^a-z0-9-]/g, "");
    if (!t) continue;
    const role = classifyToken(t);
    if (role === "stop") break;
    if      (role === "model_family" && modelFamilyTokens.length < 3) modelFamilyTokens.push(t);
    else if (role === "trim")        metaTrim.push(t);
    else if (role === "body")        metaBody.push(t);
    else if (role === "drivetrain")  metaDrive.push(t);
    else if (role === "engine_badge") metaEngine.push(t);
    else if (role === "generation")  metaGen.push(t);
  }

  // 3. Key-trimming slug resolution
  //    Try progressively shorter model-family keys until one hits MODEL_FAMILY_MAP.
  //    Surplus tokens are reclassified (not discarded) — e.g. "Golf 8" → "golf" matched,
  //    "8" demoted to generation;  "A4 35 TFSI" → "a4" matched, "35" demoted to engine_badge.
  let modelSlug = null;
  const matchedFamilyTokens = [];

  if (modelFamilyTokens.length > 0 && makeSlug) {
    let found = false;
    for (let len = modelFamilyTokens.length; len >= 1; len--) {
      const key  = modelFamilyTokens.slice(0, len).join(" ");
      const slug = MODEL_FAMILY_MAP[`${makeSlug}:${key}`];
      if (slug) {
        modelSlug = slug;
        matchedFamilyTokens.push(...modelFamilyTokens.slice(0, len));
        // Reclassify tokens that failed (Golf "8" → generation; A4 "35" → engine_badge)
        for (const dt of modelFamilyTokens.slice(len)) {
          const role = reclassifyDemoted(dt);
          if      (role === "generation")   metaGen.push(dt);
          else if (role === "engine_badge") metaEngine.push(dt);
          else                              metaTrim.push(dt);
        }
        found = true;
        break;
      }
    }
    if (!found) {
      // No match at any length — demote all family tokens for engine inference below
      for (const dt of modelFamilyTokens) {
        const role = reclassifyDemoted(dt);
        if      (role === "generation")   metaGen.push(dt);
        else if (role === "engine_badge") metaEngine.push(dt);
        else                              metaTrim.push(dt);
      }
    }
  }

  // 4. Engine-badge → model family inference (fires when no direct key match)
  //    Handles: "540i"/"540" → 5er; "320d" → 3er; "c220d" → c-klasse
  //    ENGINE_BADGE_RE now allows optional fuel letter, so bare "540" also reaches here.
  let inferredSlug = null;
  if (!modelSlug && metaEngine.length > 0 && makeSlug) {
    for (const badge of metaEngine) {
      const mbPfx  = badge.match(/^([a-z])\d{3}/i);      // c220d → "c"
      const numPfx = badge.match(/^(\d)\d{2}[die]?$/i);  // 320d or 540 → "3" or "5"
      const pfx    = mbPfx ? mbPfx[1].toLowerCase() : (numPfx ? numPfx[1] : null);
      if (pfx) {
        inferredSlug = ENGINE_PREFIX_TO_MODEL[`${makeSlug}:${pfx}`] || null;
        if (inferredSlug) { modelSlug = inferredSlug; break; }
      }
    }
  }

  // 5. Human-readable model display name
  const rawDisplay   = matchedFamilyTokens.length ? matchedFamilyTokens.join(" ") : null;
  const modelDisplay = rawDisplay
    ? (MODEL_FAMILY_DISPLAY[modelSlug] || rawDisplay)
    : (inferredSlug ? (MODEL_FAMILY_DISPLAY[inferredSlug] || inferredSlug) : null);

  // 6. Trim display — everything that isn't in the URL path (trim, body, drivetrain,
  //    engine badge, generation).  This is shown on the card as metadata.
  const trimDisplay = [
    ...metaTrim, ...metaBody, ...metaDrive, ...metaEngine, ...metaGen,
  ].join(" ").trim() || null;

  // 7. Infer fuel type from engine badge suffix when not already declared
  let fuel_type = raw.fuel_type || null;
  if (!fuel_type && metaEngine.length > 0) {
    for (const b of metaEngine) {
      if      (/^\d{3}d$/i.test(b) || /tdi|dci|hdi|crdi|gdi/i.test(b)) { fuel_type = "diesel"; break; }
      else if (/^\d{3}i$/i.test(b) || /tsi|tfsi|mpi|fsi|sce/i.test(b))  { fuel_type = "petrol"; break; }
      else if (/^\d{3}e$/i.test(b) || /gte|phev|shev|mhev/i.test(b))    { fuel_type = "plug_in_hybrid"; break; }
    }
  }

  // 8. Determine search level + fallback reason
  const conf = typeof raw.confidence === "number" ? raw.confidence : 0.7;
  let level, fallbackReason;
  if (!makeName) {
    level = "generic";    fallbackReason = "No make detected";
  } else if (!modelDisplay) {
    level = "make_only";  fallbackReason = "No model detected";
  } else if (!modelSlug) {
    level = "make_only";  fallbackReason = `"${modelDisplay}" not resolved — searching by make`;
  } else if (inferredSlug && matchedFamilyTokens.length === 0) {
    level = "make_model"; fallbackReason = `Inferred from engine code "${metaEngine[0]}"`;
  } else if (conf >= 0.65) {
    level = "exact";      fallbackReason = null;
  } else {
    level = "make_model"; fallbackReason = "Approximate — verify model";
  }

  return {
    makeName, makeSlug, modelDisplay, modelSlug, trimDisplay,
    fuel_type,
    transmission: raw.transmission || null,
    budget_max:   typeof raw.budget_max  === "number" ? raw.budget_max  : null,
    mileage_max:  typeof raw.mileage_max === "number" ? raw.mileage_max : null,
    year_min:     typeof raw.year_min    === "number" ? raw.year_min    : null,
    country:      raw.country || null,
    confidence: conf,
    source: raw.source || "unknown",
    level, fallbackReason,
  };
}

// ─── Stage 1 (async): LLM extraction with sync regex fallback ────────────────
async function extractSearchIntent(query) {
  try {
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.intent && typeof data.intent.confidence === "number") {
        return { ...data.intent, source: "llm" };
      }
    }
  } catch (_) { /* fall through to regex */ }
  return regexExtractIntent(query);
}

/* ============================================================
   MOCK DATA
   ============================================================ */
// AutoScout24 affiliate URL builder — receives pre-resolved slugs from resolveVehicle().
function buildAutoScout24Url(make, model, country, options = {}) {
  const domains = {
    NL: 'autoscout24.nl',
    BE: 'autoscout24.be',
    DE: 'autoscout24.de',
    PL: 'autoscout24.pl'
  };
  const domain = domains[country] || 'autoscout24.nl';
  const m = (make || '').toLowerCase()
    .replace(/š/g,'s').replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-');
  // model is already a resolved slug (e.g. "c-klasse", "3er", "golf") — just sanitise
  const mod = model
    ? model.toLowerCase()
        .replace(/\./g,'').replace(/[^a-z0-9\s-]/g,'')
        .trim().replace(/\s+/g,'-')
    : '';
  const params = new URLSearchParams({
    sort: 'standard', desc: '0', ustate: 'N,U', size: '20', page: '1',
    utm_source: 'findmycar', utm_medium: 'car_card', utm_campaign: 'affiliate',
  });
  // AutoScout24 fuel codes: B=petrol, D=diesel, E=electric, M=hybrid, X=plug-in hybrid
  const fuelCodes = { petrol: 'B', diesel: 'D', electric: 'E', hybrid: 'M', plug_in_hybrid: 'X' };
  if (options.fuel && fuelCodes[options.fuel]) params.set('fuelc', fuelCodes[options.fuel]);
  if (options.transmission === 'automatic') params.set('gear', 'A');
  else if (options.transmission === 'manual') params.set('gear', 'M');
  if (options.minYear) params.set('fregfrom', String(options.minYear));
  if (options.maxMileage) params.set('kmto', String(options.maxMileage));
  if (options.maxPrice) params.set('priceto', String(options.maxPrice));
  // Only include model path segment when it is non-empty
  const path = m && mod ? `${m}/${mod}` : m;
  const base = path ? `/lst/${path}` : '/lst';
  return `https://www.${domain}${base}?${params.toString()}`;
}
const COUNTRIES = {
  NL: { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR" },
  BE: { code: "BE", name: "Belgium", flag: "🇧🇪", currency: "EUR" },
  DE: { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR" },
  PL: { code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN" },
};

/* ============================================================
   MARKET CHAPTERS — immersive per-country sections
   ============================================================ */

const MARKET_CHAPTERS = {
  NL: {
    tagline: "Smart. Compact. EV-ready.",
    description: "Dense cities, cycling culture, and Europe's highest EV adoption. The Dutch market rewards compact, efficient cars.",
    vibe: "Urban precision · Clean energy · Practical intelligence",
    color: "#FF6B2B", colorSoft: "rgba(255,107,43,0.10)", colorGlow: "rgba(255,107,43,0.25)",
    gradientFrom: "from-orange-900/20", gradientVia: "via-amber-950/10",
    cities: ["Amsterdam", "Rotterdam", "Utrecht", "The Hague"],
    stats: { avgPrice: "€18,500", evShare: "24%", dealers: "2,400+", topBody: "Hatchback" },
    insight: "Netherlands has the highest EV share in mainland Europe. Zero road tax on electric cars makes them significantly cheaper to own.",
    segments: ["Compact EV", "City Hybrid", "Small Hatchback", "Urban SUV"],
    chips: [
      "Best EV for Amsterdam?",
      "Cheap city car under €12k",
      "Hybrid vs electric in NL?",
      "Best value Dutch hatchback",
    ],
  },
  BE: {
    tagline: "Cross-border. Value-smart.",
    description: "At the crossroads of Europe, Belgium offers unique cross-border buying opportunities across regions.",
    vibe: "Analytical buying · Regional comparison · Hidden value",
    color: "#FFD700", colorSoft: "rgba(255,215,0,0.08)", colorGlow: "rgba(255,215,0,0.20)",
    gradientFrom: "from-yellow-900/20", gradientVia: "via-amber-950/10",
    cities: ["Brussels", "Antwerp", "Ghent", "Liège"],
    stats: { avgPrice: "€21,200", evShare: "12%", dealers: "1,800+", topBody: "Estate" },
    insight: "Belgium's position between FR, DE and NL creates arbitrage opportunities for buyers who compare across borders.",
    segments: ["Mid-size Sedan", "Estate Wagon", "Cross-border SUV", "Company Car"],
    chips: [
      "Best value buy in Belgium?",
      "Compare Brussels vs Antwerp prices",
      "Family estate under €25k",
      "Cross-border buying tips",
    ],
  },
  DE: {
    tagline: "Deep inventory. Premium choice.",
    description: "Europe's largest car market with unmatched depth — from budget hatchbacks to autobahn-ready executive sedans.",
    vibe: "Scale · Engineering · Autobahn confidence",
    color: "#94A3B8", colorSoft: "rgba(148,163,184,0.10)", colorGlow: "rgba(148,163,184,0.20)",
    gradientFrom: "from-slate-800/30", gradientVia: "via-zinc-900/15",
    cities: ["Berlin", "Munich", "Frankfurt", "Stuttgart"],
    stats: { avgPrice: "€26,800", evShare: "18%", dealers: "8,500+", topBody: "Sedan" },
    insight: "Germany's massive dealer network and TÜV inspection system mean more choice and better-documented histories.",
    segments: ["Premium Sedan", "Estate Wagon", "Performance SUV", "Executive EV"],
    chips: [
      "Autobahn-ready daily driver?",
      "Premium sedan under €35k",
      "Best German estate wagon",
      "Munich vs Berlin inventory",
    ],
  },
  PL: {
    tagline: "Value-first. Import-aware.",
    description: "Poland's market rewards smart buying — lower costs, strong imports, and opportunities for savvy buyers.",
    vibe: "Price-conscious · Import-smart · Local knowledge",
    color: "#EF4444", colorSoft: "rgba(239,68,68,0.10)", colorGlow: "rgba(239,68,68,0.20)",
    gradientFrom: "from-red-950/20", gradientVia: "via-rose-950/10",
    cities: ["Warsaw", "Kraków", "Poznań", "Wrocław"],
    stats: { avgPrice: "52,000 zł", evShare: "6%", dealers: "3,200+", topBody: "Hatchback" },
    insight: "No annual road tax for passenger cars. Total ownership costs can be 30-40% less than Western Europe.",
    segments: ["Budget Hatchback", "Used Import", "Value SUV", "City Compact"],
    chips: [
      "Best value car in Poland?",
      "Import from Germany worth it?",
      "Reliable car under 40k zł",
      "Warsaw best deals right now",
    ],
  },
};

const MARKET_ORDER = ["NL", "BE", "DE", "PL"];

/* ============================================================
   HYBRID CHAT ENGINE — /api/chat first, local fallback second
   ============================================================ */

const LOCAL_CHAT_RESPONSES = {
  greeting: [
    "Hey! 👋 I'm your FindMyCar advisor. I help people across the Netherlands, Belgium, Germany and Poland find cars that actually fit their life. What's on your mind?",
  ],
  unsure: [
    "No worries — that's the most common starting point. Let's figure it out together. What does your typical driving week look like? Short city trips, highway commuting, family runs?",
    "Totally fine! Most people feel the same. Let's start simple: are you replacing an old car, getting your first one, or just exploring?",
  ],
  budget_low: [
    "Under €15k still gets you solid options. In NL, the Dacia Sandero or Toyota Yaris Hybrid. In Poland, that budget goes much further — you could get a well-equipped Škoda Octavia. Which market interests you?",
  ],
  budget_mid: [
    "€15–25k is the sweet spot. A VW Golf or Peugeot 2008 in NL, Kia Sportage hybrid in DE, or nearly-new BMW 3 Series in PL. What matters most — comfort, efficiency, or space?",
  ],
  budget_high: [
    "With €25k+, you're in premium territory. Germany has the deepest selection — Audi A4, BMW 3 Series, Volvo XC60. NL has great EVs at this range. What's your priority?",
  ],
  ev: [
    "For EVs, the Netherlands leads — highest charging density and zero road tax on electrics. Renault Zoe (~€14.5k), VW ID.3 for families (~€32k), or Tesla Model 3 for range (~€39k). Poland's charging network is still growing.",
  ],
  family: [
    "For families, boot space and safety matter most. Škoda Octavia Combi has one of the biggest boots. Kia Sportage offers 7-year warranty. Need 7 seats? Seat Tarraco or Citroën Berlingo. How many kids?",
  ],
  city: [
    "City driving = size + fuel economy. Toyota Yaris Hybrid gets 3.8L/100km and parks anywhere. Fiat 500 for personality. Renault Zoe for pure electric. Which city are you in?",
  ],
  highway: [
    "For highway comfort, the VW Passat Variant is a natural cruiser. BMW 3 Series if you enjoy driving. Škoda Octavia 2.0 TDI for diesel efficiency on long runs. How far do you typically drive?",
  ],
  nl: ["The Dutch market is fascinating — highest EV adoption in mainland Europe, brutal diesel road tax (€800+/year for mid-size). Hybrid or electric makes financial sense here. Toyota Yaris Hybrid and VW Golf are best sellers for good reason. What's your situation?"],
  de: ["Germany is Europe's deepest car market. TÜV inspections mean better histories. Premium brands are priced more competitively here. Stuttgart and Munich are the sweet spots for premium. What segment interests you?"],
  be: ["Belgium is the cross-border champion. Your position between FR, DE and NL means you can compare across borders. Brussels and Antwerp have the most diverse networks. What are you looking for?"],
  pl: ["Poland is the value play. No road tax, lower maintenance, and strong German imports. Warsaw and Poznań have the best selection. Looking at new or used?"],
  reliability: ["Toyota and Honda lead reliability — Yaris and Jazz hybrids are almost unkillable. Kia/Hyundai offer 7-year warranties. What's your tolerance for maintenance?"],
  compare: ["Good comparison. The real question isn't specs — it's which fits your daily life. I can break it down by running costs, reliability, and usability. Want me to do that?"],
  fallback: [
    "Great question. Across our four markets (NL, BE, DE, PL), the answer varies by local conditions. Can you tell me more about your situation?",
    "I can help with that. Which country are you in (or considering), and what's your rough budget?",
  ],
};

function generateLocalChatResponse(text, history) {
  const t = (text || "").toLowerCase();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const R = LOCAL_CHAT_RESPONSES;

  // Privacy
  if (/who (made|built|created|owns?|founded)|founder|ceo|system prompt|what (ai|llm)|anthropic|openai|groq/.test(t))
    return "I'm FindMyCar — an AI car discovery assistant for Europe. I help you explore, compare, and find the right car across NL, BE, DE and PL. What kind of car interests you?";

  if (/^(hi|hey|hello|hallo|yo|sup)[\s!.]*$/i.test(t)) return pick(R.greeting);
  if (/no (idea|clue)|don'?t know|not sure|help me|where.{0,10}start|first (car|time)/.test(t)) return pick(R.unsure);

  if (/netherland|dutch|amsterdam|rotterdam|nl\b|holland/.test(t)) return pick(R.nl);
  if (/germany|german|berlin|munich|frankfurt|autobahn|de\b/.test(t)) return pick(R.de);
  if (/belgium|belgian|brussels|antwerp|be\b/.test(t)) return pick(R.be);
  if (/poland|polish|warsaw|poznan|pl\b|zloty/.test(t)) return pick(R.pl);

  if (/electric|ev\b|charging|battery/.test(t)) return pick(R.ev);
  if (/famil|kids|child|boot space|7.?seat/.test(t)) return pick(R.family);
  if (/city|urban|parking|short/.test(t)) return pick(R.city);
  if (/highway|motorway|autobahn|long.{0,8}(distance|trip|drive)|commut/.test(t)) return pick(R.highway);
  if (/reliabl|trust|break.?down/.test(t)) return pick(R.reliability);
  if (/\bvs\b|versus|compar|difference/.test(t)) return pick(R.compare);

  if (/under.{0,5}(€|eur)?\s*1[0-5]|cheap|budget|affordable/.test(t)) return pick(R.budget_low);
  if (/under.{0,5}(€|eur)?\s*(2[0-5]|1[6-9])|mid.?range/.test(t)) return pick(R.budget_mid);
  if (/under.{0,5}(€|eur)?\s*[3-9]\d|premium|luxury/.test(t)) return pick(R.budget_high);

  return pick(R.fallback);
}

async function hybridChatSend(messages) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const text = typeof data === "string" ? data
      : data?.reply || data?.message?.content || (typeof data?.message === "string" ? data.message : null)
      || data?.content || data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Unknown shape");
    return text;
  } catch {
    return new Promise(resolve => {
      const last = messages[messages.length - 1];
      setTimeout(() => resolve(generateLocalChatResponse(last?.content, messages)), 500 + Math.random() * 700);
    });
  }
}

const LANGUAGES = {
  EN: { code: "EN", name: "English", flag: "🇬🇧" },
  NL: { code: "NL", name: "Nederlands", flag: "🇳🇱" },
  DE: { code: "DE", name: "Deutsch", flag: "🇩🇪" },
  PL: { code: "PL", name: "Polski", flag: "🇵🇱" },
};

const TRANSLATIONS = {
  EN: {
    nav: { discover: "Discover", how: "How it works", calculator: "Cost Calculator", faq: "FAQ", contact: "Contact", signup: "Sign up", history: "Chat history" },
    hero: {
      badge: "AI advisor · Live in NL · BE · DE · PL",
      title1: "Talk to an AI advisor.",
      title2: "Find the right car in minutes.",
      sub: "Chat naturally with our advisor — like talking to a friend who happens to know cars. We'll guide you to the right model, then show you offers.",
      market: "Market:",
    },
    chat: {
      advisor: "FindMyCar Advisor",
      online: "Online",
      speaks: "Speaks EN · NL · DE · PL",
      newChat: "New chat",
      placeholder: "Message your advisor…",
      remember: "Your advisor remembers the conversation for 10 days · Available in 4 languages",
      tryThese: "Or try one of these",
      starters: [
        "I need a family car for under €20,000",
        "Find me a reliable electric car for city driving",
        "I honestly have no idea where to start",
        "What can I get for €10,000?",
      ],
      welcome: "Hey 👋 I'm your FindMyCar advisor. I'm not a salesperson, and I'm not going to throw cars at you right away. I'd much rather start with a normal chat — tell me a bit about yourself, what's going on, what made you start looking. Even if you've got no clue where to begin, that's completely fine. 🙂",
    },
    steps: {
      eyebrow: "How it works", title1: "Three", title2: "simple", title3: "steps.",
      s1t: "Chat with the advisor", s1d: "Tell our AI what you need in your own words. It will ask follow-up questions like a real dealer would.",
      s2t: "Get smart recommendations", s2d: "Around 5 car models picked for you, with clear reasons why each one fits.",
      s3t: "Then see the offers", s3d: "Pick a model, and we'll show you real offers from dealers and private sellers nearby.",
    },
    trust: {
      t1t: "Honest & unbiased", t1d: "We don't take kickbacks.",
      t2t: "Plain language", t2d: "No car jargon needed.",
      t3t: "4 countries", t3d: "NL, BE, DE, PL.",
      t4t: "Model-first", t4d: "Pick the car, then see offers.",
    },
    faq: {
      eyebrow: "Help", title1: "Frequently", title2: "asked.",
      items: [
        { q: "How is this different from other car websites?", a: "Other sites are built for people who already know what car they want. We recommend models first based on what you actually need — then show you offers only after you've picked a model." },
        { q: "Is FindMyCar free to use?", a: "Yes, completely free. We don't charge users anything, and we don't take commissions on sales." },
        { q: "Where do your listings come from?", a: "In this prototype, listings are sample data. In the live product, they'll come from partner dealer feeds and private listings across NL, BE, DE and PL." },
        { q: "Do I need an account?", a: "No — you can browse and search freely. After a few searches we'll suggest creating one so you can save your shortlist and search history across devices." },
        { q: "Which countries do you support?", a: "Netherlands, Belgium, Germany and Poland at launch. France and others will follow." },
        { q: "How accurate are your recommendations?", a: "Our AI parses your description and matches it to car models based on body type, fuel, price, and common use cases. It's guidance, not gospel — always test-drive before you buy." },
      ],
    },
    floating: "AI Car Search",
    footer: {
      tagline: "The friendliest way to find your next car. Built for Europe — honest, AI-guided, and always on your side.",
      quickLinks: "Quick Links", contact: "Contact", legal: "Legal",
      copy: "© 2026 FindMyCar · Automotive Intelligence Platform",
      countries: "Available in 4 countries",
    },
  },
  NL: {
    nav: { discover: "Ontdek", how: "Hoe het werkt", calculator: "Kostenberekening", faq: "FAQ", contact: "Contact", signup: "Aanmelden", history: "Chatgeschiedenis" },
    hero: {
      badge: "AI-adviseur · Live in NL · BE · DE · PL",
      title1: "Praat met een AI-adviseur.",
      title2: "Vind de juiste auto in minuten.",
      sub: "Chat natuurlijk met onze adviseur — alsof je met een vriend praat die toevallig veel van auto's weet. Wij leiden je naar het juiste model en tonen daarna pas aanbiedingen.",
      market: "Markt:",
    },
    chat: {
      advisor: "FindMyCar Adviseur",
      online: "Online",
      speaks: "Spreekt EN · NL · DE · PL",
      newChat: "Nieuwe chat",
      placeholder: "Stuur een bericht aan je adviseur…",
      remember: "Je adviseur onthoudt het gesprek 10 dagen · Beschikbaar in 4 talen",
      tryThese: "Of probeer er een",
      starters: [
        "Ik zoek een gezinsauto onder de €20.000",
        "Vind een betrouwbare elektrische auto voor de stad",
        "Ik heb echt geen idee waar te beginnen",
        "Wat kan ik krijgen voor €10.000?",
      ],
      welcome: "Hoi 👋 Ik ben je FindMyCar-adviseur. Ik ben geen verkoper en ik ga je niet meteen auto's onder de neus duwen. Laten we eerst gewoon even kletsen — vertel me iets over jezelf, wat er speelt, waarom je aan het zoeken bent. Ook als je geen idee hebt waar te beginnen, dat is helemaal prima. 🙂",
    },
    steps: {
      eyebrow: "Hoe het werkt", title1: "Drie", title2: "eenvoudige", title3: "stappen.",
      s1t: "Chat met de adviseur", s1d: "Vertel onze AI wat je nodig hebt in je eigen woorden. Hij stelt vervolgvragen zoals een echte verkoper.",
      s2t: "Krijg slimme aanbevelingen", s2d: "Ongeveer 5 modellen voor jou geselecteerd, met duidelijke redenen waarom elk past.",
      s3t: "Bekijk daarna de aanbiedingen", s3d: "Kies een model en we tonen echte aanbiedingen van dealers en particulieren in de buurt.",
    },
    trust: {
      t1t: "Eerlijk & onpartijdig", t1d: "Wij nemen geen commissies.",
      t2t: "Begrijpelijke taal", t2d: "Geen autojargon nodig.",
      t3t: "4 landen", t3d: "NL, BE, DE, PL.",
      t4t: "Model eerst", t4d: "Kies de auto, zie dan aanbiedingen.",
    },
    faq: {
      eyebrow: "Hulp", title1: "Veelgestelde", title2: "vragen.",
      items: [
        { q: "Hoe verschilt dit van andere autosites?", a: "Andere sites zijn voor mensen die al weten welke auto ze willen. Wij raden eerst modellen aan op basis van wat je nodig hebt — en tonen pas daarna aanbiedingen." },
        { q: "Is FindMyCar gratis?", a: "Ja, helemaal gratis. We rekenen niets aan gebruikers en nemen geen commissie." },
        { q: "Waar komen jullie aanbiedingen vandaan?", a: "In dit prototype zijn aanbiedingen voorbeelddata. In het live product komen ze van dealerpartners en particuliere advertenties in NL, BE, DE en PL." },
        { q: "Heb ik een account nodig?", a: "Nee — je kunt vrij browsen en zoeken. Na enkele zoekopdrachten stellen we voor er een aan te maken." },
        { q: "Welke landen ondersteunen jullie?", a: "Nederland, België, Duitsland en Polen bij de lancering. Frankrijk en anderen volgen." },
        { q: "Hoe nauwkeurig zijn jullie aanbevelingen?", a: "Onze AI analyseert je beschrijving en koppelt deze aan automodellen. Het is begeleiding, geen evangelie — proefrijden blijft belangrijk." },
      ],
    },
    floating: "AI Auto Zoeken",
    footer: {
      tagline: "De vriendelijkste manier om je volgende auto te vinden. Gebouwd voor Europa — eerlijk, AI-gestuurd, altijd aan jouw kant.",
      quickLinks: "Snelkoppelingen", contact: "Contact", legal: "Juridisch",
      copy: "© 2026 FindMyCar · Automotive Intelligence Platform",
      countries: "Beschikbaar in 4 landen",
    },
  },
  DE: {
    nav: { discover: "Entdecken", how: "So funktioniert's", calculator: "Kostenrechner", faq: "FAQ", contact: "Kontakt", signup: "Anmelden", history: "Chatverlauf" },
    hero: {
      badge: "KI-Berater · Live in NL · BE · DE · PL",
      title1: "Sprich mit einem KI-Berater.",
      title2: "Finde das richtige Auto in Minuten.",
      sub: "Chatte natürlich mit unserem Berater — wie mit einem Freund, der zufällig viel über Autos weiß. Wir führen dich zum richtigen Modell und zeigen dann Angebote.",
      market: "Markt:",
    },
    chat: {
      advisor: "FindMyCar Berater",
      online: "Online",
      speaks: "Spricht EN · NL · DE · PL",
      newChat: "Neuer Chat",
      placeholder: "Nachricht an deinen Berater…",
      remember: "Dein Berater erinnert sich 10 Tage an das Gespräch · Verfügbar in 4 Sprachen",
      tryThese: "Oder probiere eines davon",
      starters: [
        "Ich brauche ein Familienauto unter 20.000 €",
        "Finde mir ein zuverlässiges Elektroauto für die Stadt",
        "Ich habe ehrlich keine Ahnung, wo ich anfangen soll",
        "Was bekomme ich für 10.000 €?",
      ],
      welcome: "Hey 👋 Ich bin dein FindMyCar-Berater. Ich bin kein Verkäufer und werde dir nicht sofort Autos andrehen. Lass uns erst einmal einfach reden — erzähl mir ein bisschen über dich, was los ist, warum du suchst. Auch wenn du keine Ahnung hast, wo du anfangen sollst, ist das völlig in Ordnung. 🙂",
    },
    steps: {
      eyebrow: "So funktioniert's", title1: "Drei", title2: "einfache", title3: "Schritte.",
      s1t: "Chatte mit dem Berater", s1d: "Sag unserer KI in eigenen Worten, was du brauchst. Sie stellt Rückfragen wie ein echter Händler.",
      s2t: "Erhalte clevere Empfehlungen", s2d: "Etwa 5 Modelle für dich ausgewählt, mit klaren Begründungen.",
      s3t: "Dann siehst du die Angebote", s3d: "Wähle ein Modell und wir zeigen echte Angebote von Händlern und Privatverkäufern in der Nähe.",
    },
    trust: {
      t1t: "Ehrlich & unparteiisch", t1d: "Wir nehmen keine Provisionen.",
      t2t: "Klare Sprache", t2d: "Kein Auto-Fachjargon nötig.",
      t3t: "4 Länder", t3d: "NL, BE, DE, PL.",
      t4t: "Modell zuerst", t4d: "Wähle das Auto, dann die Angebote.",
    },
    faq: {
      eyebrow: "Hilfe", title1: "Häufig", title2: "gestellte Fragen.",
      items: [
        { q: "Wie unterscheidet sich das von anderen Auto-Websites?", a: "Andere Seiten sind für Leute, die schon wissen, was sie wollen. Wir empfehlen zuerst Modelle auf Grundlage deiner Bedürfnisse." },
        { q: "Ist FindMyCar kostenlos?", a: "Ja, komplett kostenlos. Wir berechnen Nutzern nichts und nehmen keine Provisionen." },
        { q: "Woher kommen eure Angebote?", a: "Im Prototyp sind die Angebote Beispieldaten. Im Live-Produkt von Händler-Partnern und Privatanzeigen in NL, BE, DE und PL." },
        { q: "Brauche ich ein Konto?", a: "Nein — du kannst frei stöbern. Nach einigen Suchen schlagen wir vor, eines zu erstellen." },
        { q: "Welche Länder unterstützt ihr?", a: "Niederlande, Belgien, Deutschland und Polen zum Start. Frankreich und andere folgen." },
        { q: "Wie genau sind eure Empfehlungen?", a: "Unsere KI analysiert deine Beschreibung. Es ist Orientierung, kein Evangelium — Probefahrten bleiben wichtig." },
      ],
    },
    floating: "KI Autosuche",
    footer: {
      tagline: "Der freundlichste Weg, dein nächstes Auto zu finden. Gebaut für Europa — ehrlich, KI-geführt, immer auf deiner Seite.",
      quickLinks: "Schnellzugriff", contact: "Kontakt", legal: "Rechtliches",
      copy: "© 2026 FindMyCar · Automotive Intelligence Platform",
      countries: "In 4 Ländern verfügbar",
    },
  },
  PL: {
    nav: { discover: "Odkryj", how: "Jak to działa", calculator: "Kalkulator kosztów", faq: "FAQ", contact: "Kontakt", signup: "Zarejestruj się", history: "Historia czatów" },
    hero: {
      badge: "Doradca AI · Działa w NL · BE · DE · PL",
      title1: "Porozmawiaj z doradcą AI.",
      title2: "Znajdź odpowiedni samochód w kilka minut.",
      sub: "Rozmawiaj naturalnie z naszym doradcą — jak z przyjacielem, który zna się na samochodach. Pokierujemy Cię do właściwego modelu, a potem pokażemy oferty.",
      market: "Rynek:",
    },
    chat: {
      advisor: "Doradca FindMyCar",
      online: "Online",
      speaks: "Mówi EN · NL · DE · PL",
      newChat: "Nowy czat",
      placeholder: "Napisz do doradcy…",
      remember: "Twój doradca pamięta rozmowę przez 10 dni · Dostępny w 4 językach",
      tryThese: "Lub wypróbuj jedno z tych",
      starters: [
        "Potrzebuję rodzinnego auta poniżej 20 000 €",
        "Znajdź mi niezawodny samochód elektryczny do miasta",
        "Szczerze mówiąc nie wiem, od czego zacząć",
        "Co mogę dostać za 10 000 €?",
      ],
      welcome: "Hej 👋 Jestem Twoim doradcą FindMyCar. Nie jestem sprzedawcą i nie zamierzam od razu wciskać Ci samochodów. Najpierw porozmawiajmy — opowiedz mi trochę o sobie, co się dzieje, dlaczego szukasz. Nawet jeśli nie wiesz, od czego zacząć, to całkowicie w porządku. 🙂",
    },
    steps: {
      eyebrow: "Jak to działa", title1: "Trzy", title2: "proste", title3: "kroki.",
      s1t: "Porozmawiaj z doradcą", s1d: "Powiedz AI, czego potrzebujesz, własnymi słowami. Zada pytania jak prawdziwy sprzedawca.",
      s2t: "Otrzymaj inteligentne rekomendacje", s2d: "Około 5 modeli wybranych dla Ciebie, z jasnymi powodami.",
      s3t: "Następnie zobacz oferty", s3d: "Wybierz model, a pokażemy oferty od dealerów i osób prywatnych w pobliżu.",
    },
    trust: {
      t1t: "Uczciwie i bezstronnie", t1d: "Nie bierzemy prowizji.",
      t2t: "Prosty język", t2d: "Bez żargonu motoryzacyjnego.",
      t3t: "4 kraje", t3d: "NL, BE, DE, PL.",
      t4t: "Najpierw model", t4d: "Wybierz auto, potem oferty.",
    },
    faq: {
      eyebrow: "Pomoc", title1: "Najczęściej", title2: "zadawane pytania.",
      items: [
        { q: "Czym to się różni od innych stron z samochodami?", a: "Inne strony są dla osób, które już wiedzą, czego chcą. My najpierw polecamy modele na podstawie Twoich potrzeb." },
        { q: "Czy FindMyCar jest darmowe?", a: "Tak, całkowicie darmowe. Nic nie pobieramy od użytkowników i nie bierzemy prowizji." },
        { q: "Skąd pochodzą oferty?", a: "W prototypie to dane przykładowe. W produkcie końcowym pochodzą od partnerów dealerskich i ofert prywatnych w NL, BE, DE i PL." },
        { q: "Czy potrzebuję konta?", a: "Nie — możesz swobodnie przeglądać. Po kilku wyszukiwaniach zaproponujemy utworzenie konta." },
        { q: "Jakie kraje obsługujecie?", a: "Holandia, Belgia, Niemcy i Polska na start. Francja i inne wkrótce." },
        { q: "Jak dokładne są rekomendacje?", a: "AI analizuje Twój opis. To wskazówki, nie wyrocznia — jazda próbna pozostaje ważna." },
      ],
    },
    floating: "Wyszukiwanie AI",
    footer: {
      tagline: "Najprzyjaźniejszy sposób na znalezienie kolejnego auta. Stworzony dla Europy — uczciwie, z pomocą AI, zawsze po Twojej stronie.",
      quickLinks: "Szybkie linki", contact: "Kontakt", legal: "Prawne",
      copy: "© 2026 FindMyCar · Automotive Intelligence Platform",
      countries: "Dostępne w 4 krajach",
    },
  },
};

const useT = (language) => TRANSLATIONS[language] || TRANSLATIONS.EN;

const CAR_MODELS = [
  // ── Budget hatchbacks (€8k–€18k) ──
  {
    id: "skoda-fabia", make: "Škoda", model: "Fabia", generation: "Mk4 (2021–present)",
    body: "Hatchback", fuel: "Petrol", transmission: "Manual",
    engine: "1.0 TSI", power: "70 kW (95 hp)", performance: "0–100 in 10.6s",
    fuelUse: "5.0 L/100 km", torque: "175 Nm", doors: 5, seats: 5,
    priceMin: 12500, priceMax: 22000,
    tags: ["budget", "city", "reliable", "first-car", "small"],
    summary: "A genuinely well-built small hatchback with surprising space inside. One of the most sensible city cars you can buy.",
    match: "Cheap to run, easy to park, and famously practical for its size.",
    gradient: "from-emerald-700 via-green-900 to-slate-950",
  },
  {
    id: "hyundai-i10", make: "Hyundai", model: "i10", generation: "AC3 (2019–present)",
    body: "Hatchback", fuel: "Petrol", transmission: "Manual",
    engine: "1.2 MPi", power: "62 kW (84 hp)", performance: "0–100 in 12.6s",
    fuelUse: "5.4 L/100 km", torque: "118 Nm", doors: 5, seats: 5,
    priceMin: 11000, priceMax: 17500,
    tags: ["budget", "city", "first-car", "small", "reliable"],
    summary: "A tiny city car with a 5-year warranty and zero pretension. Easy to drive, easy to own.",
    match: "If you want minimum hassle and minimum cost, this is hard to beat.",
    gradient: "from-blue-700 via-indigo-900 to-slate-950",
  },
  {
    id: "fiat-500", make: "Fiat", model: "500", generation: "Series 4 (2015–present)",
    body: "Hatchback", fuel: "Petrol", transmission: "Manual",
    engine: "1.0 Hybrid", power: "51 kW (70 hp)", performance: "0–100 in 13.8s",
    fuelUse: "4.4 L/100 km", torque: "92 Nm", doors: 3, seats: 4,
    priceMin: 13500, priceMax: 19000,
    tags: ["city", "stylish", "small", "first-car", "budget"],
    summary: "An icon. Tiny, stylish, and full of character — if you want something that stands out in a parking lot, here you go.",
    match: "Perfect for narrow city streets and people who want personality over practicality.",
    gradient: "from-red-700 via-rose-900 to-stone-950",
  },
  {
    id: "dacia-sandero", make: "Dacia", model: "Sandero", generation: "Mk3 (2021–present)",
    body: "Hatchback", fuel: "Petrol", transmission: "Manual",
    engine: "1.0 TCe", power: "67 kW (90 hp)", performance: "0–100 in 11.7s",
    fuelUse: "5.5 L/100 km", torque: "160 Nm", doors: 5, seats: 5,
    priceMin: 9500, priceMax: 15500,
    tags: ["budget", "value", "first-car", "city", "reliable"],
    summary: "The cheapest new car in Europe — and it's actually decent. No frills, no nonsense, just transport that works.",
    match: "Unbeatable on price. If budget is the #1 concern, start here.",
    gradient: "from-stone-700 via-stone-900 to-stone-950",
  },

  // ── Mid-size hatchbacks (€15k–€32k) ──
  {
    id: "vw-golf-8", make: "Volkswagen", model: "Golf", generation: "Mk8 (2020–present)",
    body: "Hatchback", fuel: "Petrol", transmission: "Manual / DSG",
    engine: "1.5 TSI", power: "110 kW (150 hp)", performance: "0–100 in 8.5s",
    fuelUse: "5.6 L/100 km", torque: "250 Nm", doors: 5, seats: 5,
    priceMin: 18500, priceMax: 32000,
    tags: ["family", "reliable", "efficient", "city", "all-rounder"],
    summary: "One of Europe's most trusted hatchbacks — comfortable, efficient, and easy to drive. A safe, practical choice that holds its value well.",
    match: "Balanced size, low running costs, and a reputation for reliability make it a strong everyday pick.",
    gradient: "from-blue-600 via-indigo-700 to-slate-900",
  },
  {
    id: "toyota-yaris", make: "Toyota", model: "Yaris Hybrid", generation: "XP210 (2020–present)",
    body: "Hatchback", fuel: "Hybrid", transmission: "Automatic",
    engine: "1.5 Hybrid", power: "85 kW (116 hp)", performance: "0–100 in 9.7s",
    fuelUse: "3.8 L/100 km", torque: "141 Nm", doors: 5, seats: 5,
    priceMin: 16900, priceMax: 26500,
    tags: ["city", "efficient", "hybrid", "budget", "reliable", "first-car"],
    summary: "A compact hybrid that sips fuel in the city. Perfect for first-time buyers who want low running costs and zero range anxiety.",
    match: "Outstanding fuel economy and Toyota's legendary reliability — great if you drive a lot in town.",
    gradient: "from-emerald-600 via-teal-800 to-slate-900",
  },
  {
    id: "honda-jazz", make: "Honda", model: "Jazz Hybrid", generation: "GR (2020–present)",
    body: "Hatchback", fuel: "Hybrid", transmission: "Automatic",
    engine: "1.5 e:HEV", power: "80 kW (109 hp)", performance: "0–100 in 9.4s",
    fuelUse: "4.5 L/100 km", torque: "253 Nm", doors: 5, seats: 5,
    priceMin: 19500, priceMax: 27000,
    tags: ["city", "efficient", "hybrid", "reliable", "spacious", "small"],
    summary: "Small on the outside, shockingly spacious inside thanks to its clever 'Magic Seats'. One of the most practical small cars made.",
    match: "If you need maximum space without going up to a bigger car, the Jazz is a hidden gem.",
    gradient: "from-cyan-700 via-sky-900 to-slate-950",
  },

  // ── Estates / wagons (€18k–€38k) ──
  {
    id: "skoda-octavia", make: "Škoda", model: "Octavia Combi", generation: "Mk4 (2020–present)",
    body: "Estate", fuel: "Diesel", transmission: "Automatic",
    engine: "2.0 TDI", power: "110 kW (150 hp)", performance: "0–100 in 8.9s",
    fuelUse: "4.7 L/100 km", torque: "360 Nm", doors: 5, seats: 5,
    priceMin: 22000, priceMax: 36500,
    tags: ["family", "long-distance", "spacious", "efficient", "highway"],
    summary: "One of the most spacious estates in its class. Huge boot, comfortable on long trips, and famously practical.",
    match: "If you need room for kids, luggage, or a dog — this is hard to beat for the money.",
    gradient: "from-stone-600 via-stone-800 to-stone-950",
  },
  {
    id: "vw-passat-variant", make: "Volkswagen", model: "Passat Variant", generation: "B9 (2024–present)",
    body: "Estate", fuel: "Diesel", transmission: "Automatic",
    engine: "2.0 TDI", power: "110 kW (150 hp)", performance: "0–100 in 9.4s",
    fuelUse: "4.9 L/100 km", torque: "360 Nm", doors: 5, seats: 5,
    priceMin: 28000, priceMax: 45000,
    tags: ["family", "long-distance", "spacious", "highway", "premium"],
    summary: "A genuine motorway cruiser. Quiet, comfortable, and built for eating up kilometres at a time.",
    match: "If you do lots of highway miles and need real comfort, this is a serious workhorse.",
    gradient: "from-slate-700 via-slate-900 to-stone-950",
  },

  // ── SUVs (€17k–€55k) ──
  {
    id: "dacia-duster", make: "Dacia", model: "Duster", generation: "Mk3 (2024–present)",
    body: "SUV", fuel: "Petrol", transmission: "Manual",
    engine: "1.3 TCe", power: "96 kW (130 hp)", performance: "0–100 in 10.3s",
    fuelUse: "6.0 L/100 km", torque: "240 Nm", doors: 5, seats: 5,
    priceMin: 17500, priceMax: 25000,
    tags: ["budget", "suv", "family", "value", "rugged"],
    summary: "Unbeatable value for money. A proper SUV with genuine ruggedness at a price that undercuts nearly everything else.",
    match: "The best new-car SUV bargain on the market — honest, practical, and surprisingly capable.",
    gradient: "from-amber-700 via-orange-900 to-stone-950",
  },
  {
    id: "peugeot-2008", make: "Peugeot", model: "2008", generation: "P24 (2019–present)",
    body: "SUV", fuel: "Petrol", transmission: "Automatic",
    engine: "1.2 PureTech", power: "96 kW (130 hp)", performance: "0–100 in 9.1s",
    fuelUse: "5.7 L/100 km", torque: "230 Nm", doors: 5, seats: 5,
    priceMin: 21000, priceMax: 31000,
    tags: ["suv", "stylish", "city", "family", "small-suv"],
    summary: "A stylish small SUV with a distinctive interior and plenty of charm. A good mix of comfort and looks.",
    match: "Great if you want an SUV that stands out from the crowd without breaking the bank.",
    gradient: "from-yellow-700 via-amber-900 to-stone-950",
  },
  {
    id: "kia-sportage", make: "Kia", model: "Sportage", generation: "NQ5 (2021–present)",
    body: "SUV", fuel: "Hybrid", transmission: "Automatic",
    engine: "1.6 T-GDI HEV", power: "169 kW (230 hp)", performance: "0–100 in 8.0s",
    fuelUse: "5.7 L/100 km", torque: "350 Nm", doors: 5, seats: 5,
    priceMin: 32000, priceMax: 46000,
    tags: ["family", "suv", "hybrid", "spacious", "reliable"],
    summary: "A genuinely impressive family SUV with sharp styling, a 7-year warranty, and one of the best hybrid systems on the market.",
    match: "If you want a no-compromises family SUV with peace of mind, this is the safe pick.",
    gradient: "from-teal-700 via-cyan-900 to-slate-950",
  },
  {
    id: "volvo-xc60", make: "Volvo", model: "XC60", generation: "Mk2 facelift (2022–present)",
    body: "SUV", fuel: "Hybrid", transmission: "Automatic",
    engine: "2.0 T8 PHEV", power: "335 kW (455 hp)", performance: "0–100 in 4.9s",
    fuelUse: "1.8 L/100 km", torque: "709 Nm", doors: 5, seats: 5,
    priceMin: 48000, priceMax: 75000,
    tags: ["premium", "family", "suv", "safety", "long-distance", "hybrid"],
    summary: "Class-leading safety, Scandinavian design, and a plug-in hybrid powertrain. The thinking person's premium SUV.",
    match: "If safety and family comfort are your top priority and budget allows, very few cars feel as solid.",
    gradient: "from-slate-600 via-blue-900 to-slate-950",
  },
  {
    id: "seat-tarraco", make: "Seat", model: "Tarraco", generation: "KN2 (2018–present)",
    body: "SUV", fuel: "Diesel", transmission: "Automatic",
    engine: "2.0 TDI", power: "110 kW (150 hp)", performance: "0–100 in 9.8s",
    fuelUse: "5.9 L/100 km", torque: "360 Nm", doors: 5, seats: 7,
    priceMin: 32000, priceMax: 48000,
    tags: ["family", "suv", "spacious", "7-seater", "long-distance"],
    summary: "A proper 7-seat family SUV with a useful third row. Built on the same platform as the VW Tiguan Allspace.",
    match: "If you actually need 7 seats and don't want to pay German-brand prices, this is the value play.",
    gradient: "from-orange-800 via-red-900 to-stone-950",
  },

  // ── Sedans (€18k–€55k) ──
  {
    id: "mazda-3", make: "Mazda", model: "3", generation: "BP (2019–present)",
    body: "Sedan", fuel: "Petrol", transmission: "Manual",
    engine: "2.0 Skyactiv-G", power: "90 kW (122 hp)", performance: "0–100 in 10.4s",
    fuelUse: "5.6 L/100 km", torque: "213 Nm", doors: 4, seats: 5,
    priceMin: 23000, priceMax: 32000,
    tags: ["stylish", "reliable", "premium", "all-rounder"],
    summary: "Beautifully designed inside and out, with a refined drive that punches above its price. An underrated alternative to German rivals.",
    match: "If you want premium feel without premium pricing, the Mazda 3 is criminally underrated.",
    gradient: "from-red-800 via-rose-950 to-slate-950",
  },
  {
    id: "bmw-3", make: "BMW", model: "3 Series", generation: "G20 (2019–present)",
    body: "Sedan", fuel: "Petrol", transmission: "Automatic",
    engine: "2.0 TwinPower Turbo", power: "135 kW (184 hp)", performance: "0–100 in 7.1s",
    fuelUse: "6.3 L/100 km", torque: "300 Nm", doors: 4, seats: 5,
    priceMin: 32000, priceMax: 58000,
    tags: ["premium", "sporty", "long-distance", "highway"],
    summary: "A premium sports sedan that blends driving pleasure with everyday comfort. The benchmark for executive cars.",
    match: "If you want something that feels special every time you drive it, without sacrificing daily usability.",
    gradient: "from-sky-700 via-blue-900 to-slate-950",
  },
  {
    id: "audi-a4", make: "Audi", model: "A4", generation: "B9 facelift (2019–present)",
    body: "Sedan", fuel: "Diesel", transmission: "Automatic",
    engine: "2.0 TDI", power: "120 kW (163 hp)", performance: "0–100 in 8.1s",
    fuelUse: "4.8 L/100 km", torque: "370 Nm", doors: 4, seats: 5,
    priceMin: 30000, priceMax: 52000,
    tags: ["premium", "long-distance", "highway", "comfort"],
    summary: "Quiet, refined, and effortlessly comfortable on long trips. Audi's interiors are still some of the best in the business.",
    match: "Built for the autobahn — if you do long highway runs, very few cars feel this composed.",
    gradient: "from-zinc-700 via-slate-900 to-stone-950",
  },

  // ── Electric (€14k–€55k) ──
  {
    id: "renault-zoe", make: "Renault", model: "Zoe", generation: "ZE50 (2019–2024)",
    body: "Hatchback", fuel: "Electric", transmission: "Automatic",
    engine: "52 kWh battery", power: "100 kW (136 hp)", performance: "0–100 in 9.5s",
    fuelUse: "17.2 kWh/100 km", torque: "245 Nm", doors: 5, seats: 5,
    priceMin: 14500, priceMax: 23000,
    tags: ["electric", "city", "budget", "eco", "small"],
    summary: "An affordable electric hatchback with around 300 km of real-world range. Quiet, nimble, and cheap to run.",
    match: "One of the most affordable ways into electric driving — ideal if you mostly drive short trips.",
    gradient: "from-lime-600 via-green-800 to-slate-900",
  },
  {
    id: "vw-id3", make: "Volkswagen", model: "ID.3", generation: "Facelift (2023–present)",
    body: "Hatchback", fuel: "Electric", transmission: "Automatic",
    engine: "58 kWh battery", power: "150 kW (204 hp)", performance: "0–100 in 7.3s",
    fuelUse: "15.4 kWh/100 km", torque: "310 Nm", doors: 5, seats: 5,
    priceMin: 32000, priceMax: 45000,
    tags: ["electric", "family", "all-rounder", "eco"],
    summary: "VW's mainstream electric hatch — a sensible, spacious EV that just gets out of your way and works.",
    match: "If you want a reliable family-sized EV without the Tesla baggage, this is the obvious pick.",
    gradient: "from-cyan-700 via-blue-900 to-slate-950",
  },
  {
    id: "tesla-model-3", make: "Tesla", model: "Model 3", generation: "Highland (2023–present)",
    body: "Sedan", fuel: "Electric", transmission: "Automatic",
    engine: "75 kWh battery", power: "208 kW (283 hp)", performance: "0–100 in 6.1s",
    fuelUse: "14.9 kWh/100 km", torque: "420 Nm", doors: 4, seats: 5,
    priceMin: 39000, priceMax: 52000,
    tags: ["electric", "premium", "tech", "long-distance", "highway"],
    summary: "A tech-forward electric sedan with long range, rapid charging, and a minimalist interior. Still a benchmark EV.",
    match: "If you want a modern EV with real long-distance ability and a huge charging network.",
    gradient: "from-rose-700 via-pink-900 to-slate-950",
  },
  {
    id: "kia-niro-ev", make: "Kia", model: "Niro EV", generation: "SG2 (2022–present)",
    body: "SUV", fuel: "Electric", transmission: "Automatic",
    engine: "64.8 kWh battery", power: "150 kW (201 hp)", performance: "0–100 in 7.8s",
    fuelUse: "16.2 kWh/100 km", torque: "255 Nm", doors: 5, seats: 5,
    priceMin: 36000, priceMax: 47000,
    tags: ["electric", "family", "suv", "reliable", "eco"],
    summary: "A practical, sensibly-sized electric crossover with around 460 km of real-world range and Kia's 7-year warranty.",
    match: "The boring-in-a-good-way EV. Just works, every day, with no surprises.",
    gradient: "from-emerald-700 via-teal-900 to-slate-950",
  },

  // ── Vans / 7-seaters (€20k–€40k) ──
  {
    id: "citroen-berlingo", make: "Citroën", model: "Berlingo", generation: "Mk3 (2018–present)",
    body: "Van", fuel: "Diesel", transmission: "Manual",
    engine: "1.5 BlueHDi", power: "75 kW (102 hp)", performance: "0–100 in 12.7s",
    fuelUse: "5.0 L/100 km", torque: "250 Nm", doors: 5, seats: 7,
    priceMin: 21000, priceMax: 32000,
    tags: ["family", "spacious", "7-seater", "value", "practical"],
    summary: "A van-based people mover with massive interior space, sliding rear doors, and an honest no-frills attitude.",
    match: "If you have a big family, a dog, sports gear, or all of the above — this is incredibly practical.",
    gradient: "from-blue-800 via-indigo-950 to-stone-950",
  },
];

const MAKE_OPTIONS = ["Any", "Volkswagen", "Toyota", "Renault", "Škoda", "BMW", "Dacia", "Tesla", "Peugeot", "Audi", "Mercedes-Benz", "Ford", "Opel", "Kia", "Hyundai"];
const BODY_OPTIONS = ["Any", "Hatchback", "Sedan", "Estate", "SUV", "Coupe", "Convertible", "Van"];
const FUEL_OPTIONS = ["Any", "Petrol", "Diesel", "Hybrid", "Electric", "LPG"];
const TRANS_OPTIONS = ["Any", "Manual", "Automatic", "DSG"];

const SAMPLE_OFFERS = {
  "vw-golf-8": [
    { id: 1, price: 21900, year: 2021, mileage: 45200, location: "Amsterdam, NL", country: "NL", seller: "AutoHaus Amsterdam", sellerType: "Dealer", trim: "1.5 TSI Life" },
    { id: 2, price: 24500, year: 2022, mileage: 28900, location: "Rotterdam, NL", country: "NL", seller: "Private seller", sellerType: "Private", trim: "1.5 TSI Style" },
    { id: 3, price: 19800, year: 2020, mileage: 62100, location: "Antwerp, BE", country: "BE", seller: "Belgium Motors", sellerType: "Dealer", trim: "1.0 TSI Life" },
    { id: 4, price: 26900, year: 2023, mileage: 18500, location: "Munich, DE", country: "DE", seller: "VW Zentrum München", sellerType: "Dealer", trim: "1.5 eTSI R-Line" },
    { id: 5, price: 89900, year: 2022, mileage: 34000, location: "Warsaw, PL", country: "PL", seller: "Auto Komis Warszawa", sellerType: "Dealer", trim: "1.5 TSI Style" },
  ],
  "toyota-yaris": [
    { id: 1, price: 18900, year: 2021, mileage: 38000, location: "Utrecht, NL", country: "NL", seller: "Toyota Utrecht", sellerType: "Dealer", trim: "1.5 Hybrid Dynamic" },
    { id: 2, price: 20500, year: 2022, mileage: 22000, location: "Brussels, BE", country: "BE", seller: "EcoMotors", sellerType: "Dealer", trim: "1.5 Hybrid Style" },
    { id: 3, price: 17400, year: 2021, mileage: 51200, location: "Berlin, DE", country: "DE", seller: "Private seller", sellerType: "Private", trim: "1.5 Hybrid Comfort" },
    { id: 4, price: 74900, year: 2022, mileage: 29000, location: "Kraków, PL", country: "PL", seller: "Toyota Kraków", sellerType: "Dealer", trim: "1.5 Hybrid Selection" },
  ],
  "renault-zoe": [
    { id: 1, price: 15900, year: 2020, mileage: 41000, location: "The Hague, NL", country: "NL", seller: "EV Store NL", sellerType: "Dealer", trim: "R135 Intens" },
    { id: 2, price: 17500, year: 2021, mileage: 28000, location: "Ghent, BE", country: "BE", seller: "Private seller", sellerType: "Private", trim: "R135 Zen" },
    { id: 3, price: 14200, year: 2019, mileage: 58000, location: "Hamburg, DE", country: "DE", seller: "Renault Hamburg", sellerType: "Dealer", trim: "R110 Life" },
  ],
  "skoda-octavia": [
    { id: 1, price: 26900, year: 2021, mileage: 78000, location: "Eindhoven, NL", country: "NL", seller: "Škoda Eindhoven", sellerType: "Dealer", trim: "2.0 TDI Style DSG" },
    { id: 2, price: 28500, year: 2022, mileage: 55000, location: "Liège, BE", country: "BE", seller: "Belgian Auto Group", sellerType: "Dealer", trim: "2.0 TDI Ambition" },
    { id: 3, price: 24900, year: 2021, mileage: 89000, location: "Frankfurt, DE", country: "DE", seller: "Private seller", sellerType: "Private", trim: "2.0 TDI Style" },
    { id: 4, price: 115000, year: 2023, mileage: 24000, location: "Gdańsk, PL", country: "PL", seller: "Škoda Trójmiasto", sellerType: "Dealer", trim: "2.0 TDI L&K DSG" },
  ],
  "bmw-3": [
    { id: 1, price: 38900, year: 2021, mileage: 42000, location: "Amsterdam, NL", country: "NL", seller: "BMW Amsterdam", sellerType: "Dealer", trim: "320i M Sport" },
    { id: 2, price: 42500, year: 2022, mileage: 28000, location: "Brussels, BE", country: "BE", seller: "Premium Cars BE", sellerType: "Dealer", trim: "330i Luxury Line" },
    { id: 3, price: 36900, year: 2020, mileage: 68000, location: "Stuttgart, DE", country: "DE", seller: "Private seller", sellerType: "Private", trim: "320d M Sport" },
  ],
  "dacia-duster": [],
  "tesla-model-3": [
    { id: 1, price: 34900, year: 2022, mileage: 31000, location: "Amsterdam, NL", country: "NL", seller: "EV Specialist", sellerType: "Dealer", trim: "Long Range AWD" },
    { id: 2, price: 38500, year: 2023, mileage: 15000, location: "Berlin, DE", country: "DE", seller: "Tesla Berlin", sellerType: "Dealer", trim: "Performance" },
    { id: 3, price: 32900, year: 2021, mileage: 52000, location: "Poznań, PL", country: "PL", seller: "Private seller", sellerType: "Private", trim: "Standard Range Plus" },
  ],
  "peugeot-2008": [
    { id: 1, price: 22900, year: 2021, mileage: 35000, location: "Rotterdam, NL", country: "NL", seller: "Peugeot Rotterdam", sellerType: "Dealer", trim: "1.2 PureTech Allure" },
    { id: 2, price: 24500, year: 2022, mileage: 22000, location: "Antwerp, BE", country: "BE", seller: "Auto Center BE", sellerType: "Dealer", trim: "1.2 PureTech GT Line" },
  ],
};

const EXAMPLE_PROMPTS = {
  "Search & Discovery": [
    "I need a family car for under €20,000",
    "Find me a reliable electric car for city driving",
    "Show me small hatchbacks with low running costs",
  ],
  "Comparison & Analysis": [
    "Compare hybrid vs petrol for daily commuting",
    "What's better for a young driver: Golf or Yaris?",
    "Is an SUV worth the extra cost?",
  ],
  "Vehicle Details": [
    "Explain what DSG transmission means",
    "What should I check on a used car?",
    "How much does an EV really cost to run?",
  ],
  "Market Research": [
    "What can I get for €10,000 in the Netherlands?",
    "Show me the breakdown by fuel type",
    "Which cars hold their value best?",
  ],
};

/* ============================================================
   RECOMMENDATION ENGINE (mock)
   ============================================================ */

function recommendCars(query, filters = {}) {
  const q = (query || "").toLowerCase();
  const scored = CAR_MODELS.map((car) => {
    let fit = 40 + Math.random() * 15;
    let value = 40 + Math.random() * 15;

    if (q.includes("electric") || q.includes("ev")) { if (car.fuel === "Electric") fit += 35; }
    if (q.includes("hybrid")) { if (car.fuel === "Hybrid") fit += 35; }
    if (q.includes("family") || q.includes("kids")) {
      if (["Estate", "SUV", "Hatchback"].includes(car.body)) fit += 20;
      if (car.tags.includes("family")) fit += 15;
    }
    if (q.includes("city") || q.includes("urban")) { if (car.tags.includes("city")) fit += 25; }
    if (q.includes("cheap") || q.includes("budget") || q.includes("affordable")) {
      if (car.tags.includes("budget") || car.tags.includes("value")) fit += 20;
    }
    if (q.includes("suv")) { if (car.body === "SUV") fit += 30; }
    if (q.includes("premium") || q.includes("luxury")) { if (car.tags.includes("premium")) fit += 30; }
    if (q.includes("bmw")) { if (car.make === "BMW") fit += 50; }
    if (q.includes("toyota")) { if (car.make === "Toyota") fit += 50; }

    value = 100 - (car.priceMin / 600);
    if (car.tags.includes("budget") || car.tags.includes("value")) value += 20;

    if (filters.body && filters.body !== "Any" && car.body !== filters.body) fit -= 30;
    if (filters.fuel && filters.fuel !== "Any" && car.fuel !== filters.fuel) fit -= 30;
    if (filters.make && filters.make !== "Any" && car.make !== filters.make) fit -= 40;
    if (filters.priceMax && car.priceMin > filters.priceMax) fit -= 25;

    return { car, fit: Math.max(0, Math.min(99, Math.round(fit))), value: Math.max(0, Math.min(99, Math.round(value))) };
  });

  const byFit = [...scored].sort((a, b) => b.fit - a.fit);
  const byValue = [...scored].sort((a, b) => b.value - a.value);

  const result = [];
  const seen = new Set();
  for (let i = 0; i < 4; i++) {
    if (byFit[i] && !seen.has(byFit[i].car.id)) {
      result.push({ ...byFit[i], badge: "Best Fit", score: byFit[i].fit });
      seen.add(byFit[i].car.id);
    }
    if (byValue[i] && !seen.has(byValue[i].car.id)) {
      result.push({ ...byValue[i], badge: "Best Value", score: byValue[i].value });
      seen.add(byValue[i].car.id);
    }
  }
  return result.slice(0, 6);
}

function formatPrice(amount, country) {
  const c = COUNTRIES[country] || COUNTRIES.NL;
  if (c.currency === "PLN") return `${Math.round(amount * 4.35).toLocaleString("pl-PL")} zł`;
  return `€${amount.toLocaleString("en-EU")}`;
}

/* ============================================================
   ADVISOR (mock conversational AI)
   ============================================================ */

// Returns an array of message objects to append. The advisor behaves
// like a real human dealership consultant: it listens to feelings,
// asks open clarifying questions, adapts when the user is unsure,
// and ONLY shows car recommendations after enough context is gathered.
// It NEVER shows actual offers/listings — those only appear on the
// dedicated model page after the user picks a specific model.
/* ── Language detection ──────────────────────────────────────────
   Detects which of the 4 supported languages the user is writing in,
   based on distinctive words and character markers. Falls back to the
   UI language setting if nothing conclusive is found. */
function detectLanguage(text, fallback = "EN") {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return fallback;

  // Distinctive Polish characters
  if (/[ąćęłńóśźż]/.test(t)) return "PL";

  // Distinctive German characters
  if (/[äöüß]/.test(t)) return "DE";

  // Explicit language-switch requests
  if (/(in |na |po |auf |w )?(polish|polsku|polnisch)/i.test(t)) return "PL";
  if (/(in |auf |po )?(german|deutsch|niemiecku)/i.test(t)) return "DE";
  if (/(in |po |in het )?(dutch|nederlands|holender)/i.test(t)) return "NL";
  if (/(in |po )?(english|engels|englisch|angielsk)/i.test(t)) return "EN";

  // Polish common words
  const plWords = [" jest ", " mam ", " chcę ", " chce ", " szukam ", " auto", " samochód", " samochod", " rodzin", " dzieci ", " tani", " drogi", " cześć", " dzień dobry", " proszę", " dziękuj", " jaki ", " jaka ", " jakie "];
  if (plWords.some(w => t.includes(w))) return "PL";

  // German common words
  const deWords = [" ich ", " ich'", " bin ", " habe ", " möchte ", " suche ", " auto", " familie", " kinder", " günstig", " teuer", " hallo", " guten ", " bitte", " danke", " welche", " welches", " wieviel", " viel "];
  if (deWords.some(w => t.includes(w))) return "DE";

  // Dutch common words
  const nlWords = [" ik ", " ben ", " heb ", " wil ", " zoek ", " auto", " gezin", " kinderen", " goedkoop", " duur", " hallo", " goedendag", " alstublieft", " bedankt", " welke", " hoeveel", " voor "];
  if (nlWords.some(w => t.includes(w))) return "NL";

  // English default
  const enWords = [" i ", " am ", " have ", " want ", " looking ", " car", " family", " kids", " cheap", " expensive", " hello ", " please", " thanks"];
  if (enWords.some(w => t.includes(w))) return "EN";

  return fallback;
}

/* ── Copy banks per language ──────────────────────────────────── */
const ADVISOR_COPY = {
  EN: {
    // Mode-switch clarifier
    ambiguous: "Quick check — are you looking for general info about this car, or would you like me to recommend something for you based on your needs?",
    ambiguousChips: ["Just tell me about it", "Recommend me a car", "A bit of both"],

    // Role A — Personal advisor
    welcomeAdvise: "Happy to help you find the right one! 🙂 Before I throw cars at you, I'd like to understand you a bit — otherwise my suggestions would just be guesswork.\n\nFirst things first: what will you mainly use this car for? City driving, commuting, family trips, weekend escapes — or a mix?",
    welcomeAdviseChips: ["Mostly city driving", "Daily commute", "Family trips", "Mix of everything"],
    askPassengers: "Got it. And how many people do you usually drive with? Just you, a partner, kids in the back, or a full house on weekends?",
    askPassengersChips: ["Just me", "Me + partner", "Family with kids", "Varies a lot"],
    askParking: "Cool. Any parking or size constraints I should know about? Tight city parking, a garage, or lots of space?",
    askParkingChips: ["Tight city parking", "I have a garage", "Plenty of space", "No constraints"],
    askBudget: "Perfect. Now let's talk money — what's a comfortable ballpark budget for you? Don't stress the exact number.",
    askBudgetChips: ["Under €15,000", "€15–25,000", "€25–40,000", "€40,000+"],
    askFuel: "Any feelings on fuel type or gearbox? Petrol, hybrid, electric? Manual or automatic? Or totally open?",
    askFuelChips: ["Hybrid or electric", "Petrol is fine", "Automatic only", "I'm open"],
    askDealbreakers: "Last thing, I promise — anything that's an absolute must-have or deal-breaker? Reliability, boot space, safety features, towing capacity, anything at all.",
    askDealbreakersChips: ["Must be reliable", "Need big boot", "Safety first", "I'm good — show me cars"],

    // Role B — General expert
    expertUnknown: (name) => `${name} sits a bit outside the models I actively track for the FindMyCar recommender, but I can still give you a general take on it. Want me to share what I know about its performance, reliability, and quirks — or would you rather I suggest alternatives from the models I do cover?`,
    expertUnknownChips: ["Tell me more about it", "Show me alternatives", "Compare it to something"],

    // Role B — comparison prompt
    compareIntro: "Good one to compare. Let me walk you through the key differences in a way that actually matters day-to-day, not just spec sheets.",

    // Recommendation intros
    intros: [
      "Okay! I've got a good sense of what you need. Here's a small selection — not random, these are chosen specifically for what you told me. I've split them into two groups to make comparing easier:",
      "Alright, based on everything you've shared, here's what I'd honestly recommend. Take your time.",
      "Here we go. I narrowed it down to a handful I'd actually suggest to a friend in your position.",
    ],
    introsRefine: [
      "No problem, let me think again with that in mind. Here's a different angle:",
      "Got it — let me rework this. How about these instead?",
      "Okay, shifting gears. Here's another take:",
    ],
    followUps: [
      "Any of these feel right? Tap one and I'll walk you through it — and only then will I show you real offers nearby.",
      "What's your gut reaction? Pick one and I'll show you actual listings, or tell me what's missing and I'll try again.",
      "Which one speaks to you? Once you pick a model, I'll pull up real offers. Or tell me if I'm off-track.",
    ],
    followUpChips: ["None of these", "Cheaper options", "Only EVs", "Tell me about one"],
    groupFit: "★ Best fit for you",
    groupFitSub: "Matched to what you described",
    groupValue: "€ Best value",
    groupValueSub: "Most car for your money",

    // Privacy
    privacy: "I'm FindMyCar — an AI-powered car discovery and search assistant designed to help you explore, compare, and understand vehicles in a simple, accessible way. My job is to make car search easier and more human: helping you navigate your options, learn about different models, and make more informed decisions. What kind of car are you curious about today?",
  },

  NL: {
    ambiguous: "Even checken — zoek je algemene info over deze auto, of wil je dat ik er eentje voor je aanbeveel op basis van je wensen?",
    ambiguousChips: ["Vertel me erover", "Beveel er een aan", "Een beetje van beide"],

    welcomeAdvise: "Leuk dat ik je mag helpen zoeken! 🙂 Voordat ik auto's naar je gooi, wil ik je even beter leren kennen — anders is alles wat ik voorstel gewoon gokken.\n\nAllereerst: waar ga je deze auto vooral voor gebruiken? Stadsritten, woon-werk, gezinstripjes, weekendjes weg — of een mix?",
    welcomeAdviseChips: ["Vooral stad", "Dagelijks forensen", "Gezinsritten", "Mix van alles"],
    askPassengers: "Duidelijk. En met hoeveel mensen rijd je meestal? Alleen jij, met partner, kinderen achterin, of een vol huis in het weekend?",
    askPassengersChips: ["Alleen ik", "Ik + partner", "Gezin met kinderen", "Wisselend"],
    askParking: "Oké. Zijn er parkeer- of maatbeperkingen? Krap parkeren in de stad, een garage, of genoeg ruimte?",
    askParkingChips: ["Krappe stadsparkeerplek", "Ik heb een garage", "Genoeg ruimte", "Geen beperkingen"],
    askBudget: "Top. Laten we het over geld hebben — wat is een comfortabel budget voor je? Het precieze bedrag maakt niet uit.",
    askBudgetChips: ["Onder €15.000", "€15–25.000", "€25–40.000", "€40.000+"],
    askFuel: "Voorkeur voor brandstof of versnellingsbak? Benzine, hybride, elektrisch? Handgeschakeld of automaat? Of helemaal open?",
    askFuelChips: ["Hybride of elektrisch", "Benzine is prima", "Alleen automaat", "Ik sta open"],
    askDealbreakers: "Laatste ding, beloofd — iets wat absoluut moet of juist niet mag? Betrouwbaarheid, kofferruimte, veiligheid, trekgewicht, wat dan ook.",
    askDealbreakersChips: ["Moet betrouwbaar zijn", "Grote kofferbak", "Veiligheid voorop", "Toon me de auto's"],

    expertUnknown: (name) => `${name} valt een beetje buiten de modellen die ik actief volg voor aanbevelingen, maar ik kan je wel een algemene indruk geven. Wil je meer weten over prestaties, betrouwbaarheid en eigenaardigheden — of liever alternatieven uit wat ik wél dek?`,
    expertUnknownChips: ["Vertel me meer", "Toon alternatieven", "Vergelijk met iets anders"],

    compareIntro: "Goede vergelijking. Laat me de belangrijkste verschillen uitleggen op een manier die er echt toe doet in het dagelijks gebruik, niet alleen op papier.",

    intros: [
      "Oké! Ik heb een goed beeld van wat je nodig hebt. Hier is een kleine selectie — niet willekeurig, speciaal gekozen op basis van wat je me vertelde. Ik heb ze in twee groepen verdeeld zodat vergelijken makkelijker is:",
      "Op basis van alles wat je hebt gedeeld, dit zou ik eerlijk aanraden. Neem de tijd.",
      "Daar gaan we. Ik heb het teruggebracht tot een handvol die ik ook aan een vriend in jouw situatie zou voorstellen.",
    ],
    introsRefine: [
      "Geen probleem, laat me opnieuw nadenken. Hier is een andere invalshoek:",
      "Begrepen — ik herwerk het. Wat dacht je van deze?",
      "Oké, andere richting. Hier is nog een poging:",
    ],
    followUps: [
      "Spreekt er eentje aan? Tik erop en ik leid je erdoorheen — pas daarna toon ik echte aanbiedingen in de buurt.",
      "Wat is je eerste gevoel? Kies er een en ik toon echte advertenties, of vertel me wat er mist en ik probeer het opnieuw.",
      "Welke spreekt je aan? Zodra je een model kiest, haal ik er echte aanbiedingen bij. Of zeg het als ik ernaast zit.",
    ],
    followUpChips: ["Geen van deze", "Goedkoper", "Alleen elektrisch", "Vertel over één"],
    groupFit: "★ Beste match",
    groupFitSub: "Gebaseerd op jouw beschrijving",
    groupValue: "€ Beste prijs-kwaliteit",
    groupValueSub: "Meeste auto voor je geld",

    privacy: "Ik ben FindMyCar — een AI-aangedreven autoontdekkings- en zoekassistent die je helpt voertuigen eenvoudig en toegankelijk te verkennen, vergelijken en begrijpen. Mijn taak is autozoeken makkelijker en menselijker te maken: je helpen je opties te navigeren, modellen te leren kennen en beter geïnformeerde keuzes te maken. Waar ben je vandaag nieuwsgierig naar?",
  },

  DE: {
    ambiguous: "Kurze Nachfrage — suchst du allgemeine Infos zu diesem Auto, oder soll ich dir eins basierend auf deinen Bedürfnissen empfehlen?",
    ambiguousChips: ["Erzähl mir davon", "Empfehle mir eins", "Ein bisschen von beidem"],

    welcomeAdvise: "Gerne helfe ich dir beim Finden! 🙂 Bevor ich dir Autos um die Ohren haue, würde ich dich gerne ein bisschen kennenlernen — sonst ist jeder Vorschlag nur geraten.\n\nZuerst: wofür wirst du das Auto hauptsächlich nutzen? Stadtfahrten, Pendeln, Familienausflüge, Wochenendtrips — oder ein Mix?",
    welcomeAdviseChips: ["Hauptsächlich Stadt", "Tägliches Pendeln", "Familienausflüge", "Mischung"],
    askPassengers: "Verstanden. Und mit wie vielen Leuten fährst du normalerweise? Nur du, mit Partner, Kinder hinten, oder am Wochenende volles Haus?",
    askPassengersChips: ["Nur ich", "Ich + Partner", "Familie mit Kindern", "Variiert"],
    askParking: "Gibt es Parkraum- oder Größeneinschränkungen? Enges Stadtparken, eine Garage, oder viel Platz?",
    askParkingChips: ["Enges Stadtparken", "Ich habe eine Garage", "Viel Platz", "Keine Einschränkungen"],
    askBudget: "Perfekt. Reden wir übers Geld — was ist ein komfortables Budget für dich? Grobe Richtung reicht.",
    askBudgetChips: ["Unter 15.000 €", "15–25.000 €", "25–40.000 €", "40.000 €+"],
    askFuel: "Gefühle zu Kraftstoff oder Getriebe? Benzin, Hybrid, Elektro? Schaltung oder Automatik? Oder ganz offen?",
    askFuelChips: ["Hybrid oder E-Auto", "Benzin ist okay", "Nur Automatik", "Ich bin offen"],
    askDealbreakers: "Letztes Ding, versprochen — irgendetwas absolut Unverzichtbares oder No-Go? Zuverlässigkeit, Kofferraum, Sicherheit, Anhängelast, was auch immer.",
    askDealbreakersChips: ["Muss zuverlässig sein", "Großer Kofferraum", "Sicherheit zuerst", "Zeig mir Autos"],

    expertUnknown: (name) => `${name} liegt ein bisschen außerhalb der Modelle, die ich aktiv für Empfehlungen verfolge, aber ich kann dir trotzdem einen allgemeinen Eindruck geben. Willst du mehr über Leistung, Zuverlässigkeit und Eigenheiten wissen — oder lieber Alternativen aus meinen abgedeckten Modellen?`,
    expertUnknownChips: ["Erzähl mir mehr", "Zeig Alternativen", "Mit etwas vergleichen"],

    compareIntro: "Guter Vergleich. Lass mich die wichtigsten Unterschiede so erklären, wie sie im Alltag wirklich zählen — nicht nur auf dem Datenblatt.",

    intros: [
      "Okay! Ich habe ein gutes Gefühl dafür, was du brauchst. Hier eine kleine Auswahl — nicht zufällig, sondern speziell für dich. Ich habe sie in zwei Gruppen aufgeteilt, damit das Vergleichen leichter fällt:",
      "Basierend auf allem, was du geteilt hast, würde ich ehrlich das hier empfehlen. Lass dir Zeit.",
      "Los geht's. Ich habe es auf eine Handvoll reduziert, die ich auch einem Freund in deiner Situation vorschlagen würde.",
    ],
    introsRefine: [
      "Kein Problem, ich überlege nochmal. Hier eine andere Richtung:",
      "Verstanden — ich überarbeite es. Wie wäre es damit?",
      "Okay, neuer Anlauf:",
    ],
    followUps: [
      "Spricht dich eines an? Tipp drauf und ich führe dich durch — erst dann zeige ich dir echte Angebote in der Nähe.",
      "Wie ist dein Bauchgefühl? Wähle eins und ich zeige echte Anzeigen, oder sag was fehlt und ich versuche es nochmal.",
      "Welches spricht dich an? Sobald du ein Modell wählst, hole ich echte Angebote. Oder sag, wenn ich daneben liege.",
    ],
    followUpChips: ["Keines davon", "Günstiger", "Nur Elektro", "Erzähl mir von einem"],
    groupFit: "★ Beste Wahl für dich",
    groupFitSub: "Passend zu deinen Angaben",
    groupValue: "€ Bestes Preis-Leistungs-Verhältnis",
    groupValueSub: "Am meisten Auto fürs Geld",

    privacy: "Ich bin FindMyCar — ein KI-gestützter Auto-Entdeckungs- und Suchassistent, der dir hilft, Fahrzeuge einfach und zugänglich zu erkunden, zu vergleichen und zu verstehen. Meine Aufgabe ist es, die Autosuche einfacher und menschlicher zu machen: dich durch deine Optionen zu führen, Modelle kennenzulernen und besser informierte Entscheidungen zu treffen. Wofür interessierst du dich heute?",
  },

  PL: {
    ambiguous: "Szybkie pytanie — szukasz ogólnych informacji o tym aucie, czy wolisz, żebym coś Ci polecił na podstawie Twoich potrzeb?",
    ambiguousChips: ["Opowiedz mi o nim", "Poleć mi coś", "Trochę obu"],

    welcomeAdvise: "Chętnie pomogę Ci znaleźć odpowiedni samochód! 🙂 Zanim zacznę Ci rzucać autami, chciałbym Cię lepiej poznać — inaczej każda propozycja będzie tylko zgadywaniem.\n\nPo pierwsze: do czego głównie będziesz używać tego auta? Jazda po mieście, dojazdy do pracy, wyjazdy rodzinne, weekendowe wycieczki — czy mix?",
    welcomeAdviseChips: ["Głównie miasto", "Codzienne dojazdy", "Wyjazdy rodzinne", "Mix wszystkiego"],
    askPassengers: "Jasne. A z iloma osobami zwykle jeździsz? Tylko Ty, z partnerem, dzieci z tyłu, czy pełen dom w weekendy?",
    askPassengersChips: ["Tylko ja", "Ja + partner", "Rodzina z dziećmi", "Różnie"],
    askParking: "OK. Jakieś ograniczenia co do parkowania lub rozmiaru? Ciasne parkowanie w mieście, garaż, czy dużo miejsca?",
    askParkingChips: ["Ciasne parkowanie w mieście", "Mam garaż", "Dużo miejsca", "Bez ograniczeń"],
    askBudget: "Świetnie. Pomówmy o pieniądzach — jaki jest Twój komfortowy budżet? Orientacyjnie wystarczy.",
    askBudgetChips: ["Poniżej 65 000 zł", "65–110 000 zł", "110–175 000 zł", "175 000 zł+"],
    askFuel: "Masz preferencje co do paliwa lub skrzyni biegów? Benzyna, hybryda, elektryk? Manual czy automat? Czy jesteś otwarty?",
    askFuelChips: ["Hybryda lub elektryk", "Benzyna jest OK", "Tylko automat", "Jestem otwarty"],
    askDealbreakers: "Ostatnia rzecz, obiecuję — coś absolutnie koniecznego lub wykluczającego? Niezawodność, bagażnik, bezpieczeństwo, hak, cokolwiek.",
    askDealbreakersChips: ["Musi być niezawodne", "Duży bagażnik", "Bezpieczeństwo przede wszystkim", "Pokaż mi auta"],

    expertUnknown: (name) => `${name} jest trochę poza modelami, które aktywnie śledzę w rekomendacjach, ale mogę dać Ci ogólne wrażenie. Chcesz, żebym opowiedział o osiągach, niezawodności i dziwactwach — czy wolisz alternatywy z modeli, które znam?`,
    expertUnknownChips: ["Opowiedz mi więcej", "Pokaż alternatywy", "Porównaj z czymś"],

    compareIntro: "Dobre porównanie. Pozwól, że wyjaśnię najważniejsze różnice w sposób, który naprawdę ma znaczenie na co dzień, a nie tylko na papierze.",

    intros: [
      "Okej! Mam dobre wyczucie, czego potrzebujesz. Oto mała selekcja — nie losowa, dobrana specjalnie do tego, co mi powiedziałeś. Podzieliłem je na dwie grupy, żeby łatwiej było porównać:",
      "Na podstawie wszystkiego, co podzieliłeś, to bym szczerze polecił. Nie spiesz się.",
      "Zaczynamy. Zawęziłem to do kilku, które poleciłbym przyjacielowi w Twojej sytuacji.",
    ],
    introsRefine: [
      "Żaden problem, przemyślę to jeszcze raz. Inne podejście:",
      "Rozumiem — przerabiam. Co powiesz na to?",
      "OK, inna strona:",
    ],
    followUps: [
      "Któreś Cię przekonuje? Stuknij w nie, a przeprowadzę Cię przez szczegóły — dopiero wtedy pokażę prawdziwe oferty w pobliżu.",
      "Jakie masz pierwsze wrażenie? Wybierz jeden, a pokażę prawdziwe ogłoszenia, albo powiedz, czego brakuje, a spróbuję jeszcze raz.",
      "Który Cię przemawia? Gdy wybierzesz model, pokażę Ci prawdziwe oferty. Albo powiedz, że się mylę.",
    ],
    followUpChips: ["Żadne z tych", "Tańsze opcje", "Tylko elektryki", "Opowiedz o jednym"],
    groupFit: "★ Najlepsze dopasowanie",
    groupFitSub: "Na podstawie Twojego opisu",
    groupValue: "€ Najlepsza cena",
    groupValueSub: "Najwięcej auta za Twoje pieniądze",

    privacy: "Jestem FindMyCar — asystentem wyszukiwania i odkrywania samochodów napędzanym przez AI, zaprojektowanym, aby pomóc Ci eksplorować, porównywać i rozumieć pojazdy w prosty i przystępny sposób. Moim zadaniem jest uczynienie wyszukiwania samochodów łatwiejszym i bardziej ludzkim: pomagać Ci poruszać się wśród opcji, poznawać modele i podejmować bardziej świadome decyzje. Czym się dziś interesujesz?",
  },
};

/* ── Privacy / internal-info detection ──────────────────────────
   Detects when the user is asking about internal info (who built it,
   what stack, founder, prompt, roadmap, etc.). These questions must be
   answered with the brand-safe public-facing response. */
function isInternalInfoQuery(text) {
  const t = (text || "").toLowerCase();
  const patterns = [
    /who (made|built|created|owns?|runs?|founded|developed)/,
    /who('?s| is) (behind|the (founder|ceo|owner|developer|team))/,
    /founder|co-?founder|ceo|owner|team|staff|employees/,
    /which (llm|model|api|stack|framework|database)|what (llm|model|api|stack|framework|database)/,
    /built with|made with|powered by|running on|tech stack/,
    /system prompt|initial prompt|your (instructions|prompt|rules|guidelines)/,
    /internal (tools|workflow|prompt|data|roadmap)/,
    /launch (date|history)|when (did|was) (findmycar|this) (launch|start|built|made)/,
    /data source|where.{0,15}data.{0,15}(from|come)/,
    /are you (gpt|claude|gemini|llama|mistral)|what ai|which ai/,
    /anthropic|openai|google.{0,10}ai|meta.{0,10}ai/,
    /business (model|structure|ownership)|how.{0,10}(make|earn) money/,
    /roadmap|next feature|what.{0,10}(planning|build)/,
    /source code|github|repository|repo/,
    // Polish
    /kto (stworz|zrobi|zbudowa|posiada|prowad|założ)/,
    /założyciel|właścicie|właścicie|dyrektor/,
    // German
    /wer hat (erstellt|gebaut|gemacht|entwickelt|gegründet)/,
    /gründer|besitzer|inhaber|ceo|entwickler/,
    // Dutch
    /wie heeft (gemaakt|gebouwd|opgericht|ontwikkeld)/,
    /oprichter|eigenaar|directeur|ontwikkelaar/,
  ];
  return patterns.some(p => p.test(t));
}

/* ── Role B detection — general car expert query ──────────────── */
function isGeneralInfoQuery(text) {
  const t = (text || "").toLowerCase();

  // Explicit "tell me about" phrasing
  if (/tell me about|what is (a |an )?(the )?|what'?s (a |an )?(the )?|info on|information on|details (about|on)/.test(t)) return true;
  // "Is the X good" / "Is an X reliable"
  if (/is (a |an |the )?[\w\d\-]+ (good|bad|reliable|fast|worth|any good|decent)/.test(t)) return true;
  // "How does X compare" / "X vs Y"
  if (/\svs\s|\sversus\s|compared? to|difference between|better than/.test(t)) return true;
  // Engine / spec questions
  if (/what (engine|horsepower|hp|bhp|torque|0.60|0.100|top speed|mpg|consumption)/.test(t)) return true;
  // "Does X have" / "Can X do"
  if (/does (the |a |an )?[\w\d\-]+ (have|come|get|make|do)/.test(t)) return true;
  // Listing requests ("what V12 mercedes exist", "list all bmw M cars")
  if (/(what|which|list|name).{0,30}(exist|are there|available|made|have)/.test(t)) return true;
  // Reliability / known issues
  if (/(common |known )?(problems|issues|reliability|faults|recalls)/.test(t)) return true;

  return false;
}

/* ── Role A detection — personal advisor query ────────────────── */
function isPersonalAdviceQuery(text) {
  const t = (text || "").toLowerCase();
  const patterns = [
    /help me find/, /recommend (me |something|a car)/, /suggest (a |me |something)/,
    /what (should|would|car) (i|should i)/, /find me/, /i need a car/, /i'?m looking for/,
    /don'?t know what/, /no (idea|clue)/, /pick (a |one )/, /which one should i/,
    // NL
    /help me zoeken/, /raad (me |iets)/, /welke (auto|zou)/, /ik zoek/, /ik heb een auto nodig/,
    // DE
    /hilf mir.{0,20}(finden|suchen)/, /empfehl/, /welches auto sollte/, /ich suche/, /ich brauche.{0,10}auto/,
    // PL
    /pomóż mi (znaleźć|szukać)/, /poleć/, /jakie auto/, /szukam/, /potrzebuję samochod/,
  ];
  return patterns.some(p => p.test(t));
}

/* ── Extract specific car model name from query ───────────────── */
function extractCarName(text) {
  const t = (text || "").trim();
  // Try to capture a likely make/model phrase
  const match = t.match(/\b([A-Z][a-zA-Z0-9\-]+(?:\s+[A-Z0-9][a-zA-Z0-9\-]+){0,3})\b/);
  return match ? match[0] : "that model";
}

function generateAdvisorReply(userText, turn, history = [], uiLanguage = "EN") {
  const rawText = userText || "";
  const t = rawText.toLowerCase().trim();
  const allText = (history.map(m => m.content || "").join(" ") + " " + rawText).toLowerCase();

  // ── Language detection ──────────────────────────────────────────
  // Detect from the user's message; if too short, inherit from the last
  // assistant message or fall back to the UI language.
  let lang = detectLanguage(rawText, null);
  if (!lang) {
    const lastAssistant = [...history].reverse().find(m => m.role === "assistant" && m.lang);
    lang = lastAssistant ? lastAssistant.lang : uiLanguage;
  }
  const copy = ADVISOR_COPY[lang] || ADVISOR_COPY.EN;

  // ════════════════════════════════════════════════════════════════
  // PRIVACY GUARD — highest priority
  // ════════════════════════════════════════════════════════════════
  if (isInternalInfoQuery(rawText)) {
    return [{
      role: "assistant", kind: "text", lang,
      content: copy.privacy,
      chips: copy.welcomeAdviseChips,
    }];
  }

  // ── Signal detection for Role A flow ───────────────────────────
  const isUnsure = /no (idea|clue)|not sure|don'?t know|never (bought|owned)|first (car|time)|overwhelm|confus|lost|help me|where (do|to) (i|start)|clueless|haven'?t (thought|decided)/.test(t);
  const isExploring = /(just|only) (looking|browsing|curious|explor)|window shop|see what'?s out there/.test(t);
  const greetsBack = /^(hi|hey|hello|hallo|yo|thanks|thank you|good|fine|ok|okay|sure|alright|ja|tak|nein|nee)[\s.!]*$/.test(t);

  // Does the user mention a specific make/model?
  const supportedMakes = ["volkswagen", "vw", "golf", "toyota", "yaris", "renault", "zoe", "skoda", "škoda", "octavia", "bmw", "3 series", "dacia", "duster", "tesla", "model 3", "peugeot", "2008"];
  const broaderMakes = ["audi", "mercedes", "amg", "ford", "opel", "kia", "hyundai", "porsche", "ferrari", "lamborghini", "corvette", "mustang", "camaro", "jaguar", "land rover", "mini", "fiat", "alfa romeo", "honda", "nissan", "mazda", "subaru", "lexus", "volvo", "seat", "citroen", "citroën", "maserati", "bentley", "rolls", "aston martin", "mclaren", "bugatti", "dodge", "chevrolet", "cadillac", "jeep", "suzuki", "mitsubishi"];
  const allMakes = [...supportedMakes, ...broaderMakes];
  const mentionedSupported = supportedMakes.some(k => t.includes(k));
  const mentionedBroader = broaderMakes.some(k => t.includes(k));
  const mentionedAny = mentionedSupported || mentionedBroader;

  const wantsRecsNow = /show me (some |the )?cars|give me (some |the )?options|just show|enough (question|talk|chat)|skip|pokaż|zeig.{0,5}(mir|auto)|toon/.test(t);

  const hasBudget = /\d{3,}|€|eur|zł|pln|budget|under|below|max|cheap|expensive|afford/.test(allText);
  const hasUseCase = /family|kids|child|commut|city|long|trip|work|first car|daily|weekend|highway|country|errands|gezin|kinder|stadt|miasto|rodzin/.test(allText);
  const hasFuel = /electric|ev|hybrid|petrol|diesel|gas|benzin|elektr|hybryd|diesel/.test(allText);
  const hasPassengers = /alone|partner|family|kids|children|passenger|just me|alleen|partner|gezin|allein|familie|sam|rodzin/.test(allText);
  const hasParking = /parking|garage|tight|narrow|space|parkeer|garage|parken|parkowanie|garaż/.test(allText);
  const hasDealbreaker = /must|need|require|essential|deal.?break|critical|muss|moet|musi|potrzeb/.test(allText);

  const contextScore = (hasBudget?1:0) + (hasUseCase?1:0) + (hasFuel?1:0) + (hasPassengers?1:0) + (hasParking?1:0) + (hasDealbreaker?1:0);

  const alreadyShowedCars = history.some(m => m.kind === "carGroups" || m.kind === "cars");

  // Detect a prior mode commitment from the chat history
  const priorModeAdvisor = history.some(m => m.mode === "advisor");
  const priorModeExpert = history.some(m => m.mode === "expert");

  // ════════════════════════════════════════════════════════════════
  // ROLE B — GENERAL CAR EXPERT
  // Triggered by general info / comparison / "tell me about" queries.
  // Only activate if the user hasn't already committed to the advisor flow.
  // ════════════════════════════════════════════════════════════════
  const looksLikeGeneralInfo = isGeneralInfoQuery(rawText);
  const looksLikeAdvice = isPersonalAdviceQuery(rawText);

  // AMBIGUOUS: mentions a specific car but neither clearly asks for info nor advice
  if (mentionedAny && !looksLikeGeneralInfo && !looksLikeAdvice && !priorModeAdvisor && !priorModeExpert && turn === 1) {
    return [{
      role: "assistant", kind: "text", lang, mode: "clarify",
      content: copy.ambiguous,
      chips: copy.ambiguousChips,
    }];
  }

  // User explicitly wants general info
  if ((looksLikeGeneralInfo || priorModeExpert) && !looksLikeAdvice) {
    const name = extractCarName(rawText);
    // Simple general-expert responses for a handful of well-known models.
    // These are not recommendations — they're educational answers.
    const expertAnswers = {
      EN: {
        default: `Good question. ${name} is one I can talk about generally. Here's the honest take:\n\nIt's a car that people buy for specific reasons — performance, image, practicality, or all three. The key things I'd look at are reliability over time, running costs in your country, and how well it fits your actual daily use.\n\nWhat would you like me to dig into — performance, reliability, typical issues, or how it compares to alternatives?`,
        compare: `${copy.compareIntro}\n\nWhen you put two cars head-to-head, the real question isn't which has more horsepower on paper — it's which one fits your life better. I can break it down by daily usability, running costs, reliability, and that hard-to-quantify "fun factor". Want me to focus on any of those?`,
        listing: `That's a broad one — let me think out loud. The models in that family each have their own character, from the practical everyday versions to the high-performance variants. If you tell me what you're curious about specifically (performance, efficiency, luxury, or rarity), I can give you a more focused rundown.`,
        issues: `Sure, I can give you the honest picture. Every car has its quirks, and knowing them upfront saves you money later. What year range are you thinking about? That changes the answer a lot — earlier production years often have different weak spots than facelifted versions.`,
      },
      NL: {
        default: `Goede vraag. Over ${name} kan ik je in het algemeen wel wat vertellen.\n\nHet is een auto die mensen kopen om specifieke redenen — prestaties, imago, praktisch nut, of alles tegelijk. Belangrijkste dingen om naar te kijken: betrouwbaarheid op de lange termijn, gebruikskosten in jouw land, en hoe goed het past bij je dagelijkse gebruik.\n\nWaar wil je dat ik in duik — prestaties, betrouwbaarheid, typische problemen, of vergelijkingen?`,
        compare: `${copy.compareIntro}\n\nAls je twee auto's tegen elkaar zet, is de echte vraag niet welke meer pk heeft op papier — maar welke beter bij jouw leven past. Ik kan het uitsplitsen naar dagelijks gebruik, kosten, betrouwbaarheid en die moeilijk te kwantificeren "rijplezier"-factor. Waar zal ik op focussen?`,
        listing: `Dat is breed — laat me hardop denken. De modellen in die familie hebben elk hun eigen karakter, van praktische alledaagse versies tot high-performance varianten. Als je vertelt waar je specifiek nieuwsgierig naar bent, kan ik gerichter antwoorden.`,
        issues: `Natuurlijk, ik geef je het eerlijke verhaal. Elke auto heeft zijn eigenaardigheden. Welk bouwjaar heb je in gedachten? Dat verandert het antwoord aanzienlijk.`,
      },
      DE: {
        default: `Gute Frage. Über ${name} kann ich allgemein sprechen.\n\nEs ist ein Auto, das Leute aus bestimmten Gründen kaufen — Leistung, Image, Praktikabilität, oder alles zusammen. Die wichtigsten Dinge: langfristige Zuverlässigkeit, Unterhaltskosten in deinem Land, und wie gut es zu deinem Alltag passt.\n\nWorauf soll ich eingehen — Leistung, Zuverlässigkeit, typische Probleme oder Vergleiche?`,
        compare: `${copy.compareIntro}\n\nWenn du zwei Autos gegenüberstellst, ist die eigentliche Frage nicht, welches auf dem Papier mehr PS hat — sondern welches besser zu deinem Leben passt. Ich kann es nach Alltagstauglichkeit, Kosten, Zuverlässigkeit und dem schwer messbaren "Fahrspaß" aufschlüsseln. Worauf soll ich mich konzentrieren?`,
        listing: `Das ist weit gefasst — lass mich laut überlegen. Die Modelle in der Familie haben jeweils ihren eigenen Charakter, von praktischen Alltagsversionen bis zu Hochleistungsvarianten. Wenn du mir sagst, wofür du dich speziell interessierst, kann ich gezielter antworten.`,
        issues: `Klar, ich gebe dir das ehrliche Bild. Jedes Auto hat seine Eigenheiten. An welchen Baujahrsbereich denkst du? Das ändert die Antwort deutlich.`,
      },
      PL: {
        default: `Dobre pytanie. O ${name} mogę opowiedzieć ogólnie.\n\nTo samochód, który ludzie kupują z konkretnych powodów — osiągi, wizerunek, praktyczność, albo wszystko naraz. Kluczowe rzeczy: długoterminowa niezawodność, koszty eksploatacji w Twoim kraju, i jak dobrze pasuje do codziennego użytku.\n\nCzym się zajmiemy — osiągami, niezawodnością, typowymi problemami, czy porównaniami?`,
        compare: `${copy.compareIntro}\n\nKiedy porównujesz dwa samochody, prawdziwe pytanie nie brzmi, który ma więcej koni na papierze — tylko który lepiej pasuje do Twojego życia. Mogę to rozbić na codzienny komfort, koszty, niezawodność i ten trudno mierzalny "frajdę z jazdy". Na czym mam się skupić?`,
        listing: `Szeroki temat — pomyślę na głos. Modele w tej rodzinie mają swój charakter, od praktycznych codziennych wersji po wysokowydajne warianty. Jeśli powiesz, co Cię konkretnie interesuje, odpowiem celniej.`,
        issues: `Jasne, dam Ci uczciwy obraz. Każde auto ma swoje dziwactwa. O jaki rocznik pytasz? To zmienia odpowiedź.`,
      },
    };
    const bank = expertAnswers[lang] || expertAnswers.EN;

    let answer = bank.default;
    if (/\svs\s|\sversus\s|compared? to|difference between|better than/.test(t)) answer = bank.compare;
    else if (/(what|which|list|name).{0,30}(exist|are there|available|made)/.test(t)) answer = bank.listing;
    else if (/(problems|issues|reliability|faults|recalls)/.test(t)) answer = bank.issues;

    // If it's not in our supported recommender list, add the disclaimer
    let finalContent = answer;
    if (mentionedBroader && !mentionedSupported) {
      finalContent = copy.expertUnknown(name) + "\n\n" + answer;
    }

    return [{
      role: "assistant", kind: "text", lang, mode: "expert",
      content: finalContent,
      chips: ["Tell me more", "Compare to alternatives", "Actually, recommend me a car", "Known issues?"],
    }];
  }

  // ════════════════════════════════════════════════════════════════
  // ROLE A — PERSONAL ADVISOR FLOW
  // ════════════════════════════════════════════════════════════════

  // Turn 1 — warm greeting + first question (driving habits)
  if ((turn === 1 || (!priorModeAdvisor && turn <= 2)) && !wantsRecsNow && !alreadyShowedCars) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.welcomeAdvise,
      chips: copy.welcomeAdviseChips,
    }];
  }

  // Turn 2 — passengers / family
  if (turn === 2 && !wantsRecsNow && !alreadyShowedCars && !hasPassengers) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.askPassengers,
      chips: copy.askPassengersChips,
    }];
  }

  // Turn 3 — parking / size
  if (turn === 3 && !wantsRecsNow && !alreadyShowedCars && !hasParking) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.askParking,
      chips: copy.askParkingChips,
    }];
  }

  // Turn 4 — budget
  if (turn === 4 && !wantsRecsNow && !alreadyShowedCars && !hasBudget) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.askBudget,
      chips: copy.askBudgetChips,
    }];
  }

  // Turn 5 — fuel / gearbox
  if (turn === 5 && !wantsRecsNow && !alreadyShowedCars && !hasFuel) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.askFuel,
      chips: copy.askFuelChips,
    }];
  }

  // Turn 6 — deal-breakers
  if (turn === 6 && !wantsRecsNow && !alreadyShowedCars && contextScore < 4) {
    return [{
      role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.askDealbreakers,
      chips: copy.askDealbreakersChips,
    }];
  }

  // ════════════════════════════════════════════════════════════════
  // RECOMMENDATION
  // ════════════════════════════════════════════════════════════════
  const cars = recommendCars(allText);
  const bestFit = cars.filter(c => c.badge === "Best Fit").slice(0, 3);
  const bestValue = cars.filter(c => c.badge === "Best Value").slice(0, 3);

  const intros = alreadyShowedCars ? copy.introsRefine : copy.intros;

  return [
    { role: "assistant", kind: "text", lang, mode: "advisor", content: intros[turn % intros.length] },
    { role: "assistant", kind: "carGroups", lang, mode: "advisor", groups: [
      { label: copy.groupFit, subtitle: copy.groupFitSub, cars: bestFit },
      { label: copy.groupValue, subtitle: copy.groupValueSub, cars: bestValue },
    ]},
    { role: "assistant", kind: "text", lang, mode: "advisor",
      content: copy.followUps[turn % copy.followUps.length],
      chips: copy.followUpChips },
  ];
}

/* ============================================================
   LOGO — pin + car merged, gold gradient
   ============================================================ */

function Logo({ size = 40, showText = true, tagline = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.5), transparent 70%)", filter: "blur(8px)" }} />
        <svg viewBox="0 0 48 48" className="relative" style={{ width: size, height: size }}>
          <defs>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="logoShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* Location pin shape */}
          <path d="M24 2 C13 2 5 10 5 21 C5 33 24 46 24 46 C24 46 43 33 43 21 C43 10 35 2 24 2 Z"
            fill="url(#logoGold)" stroke="#92400e" strokeWidth="0.5" />
          {/* Pin shine */}
          <path d="M24 2 C13 2 5 10 5 21 C5 24 6 27 8 30 C8 18 15 8 24 6 C33 8 40 18 40 30 C42 27 43 24 43 21 C43 10 35 2 24 2 Z"
            fill="url(#logoShine)" />
          {/* Car silhouette inside pin */}
          <g transform="translate(10, 13)">
            <path d="M2 11 L4 7 Q5 5.5 7 5.5 L21 5.5 Q23 5.5 24 7 L26 11 L26 14 L2 14 Z"
              fill="#0a0908" />
            <circle cx="7" cy="14" r="2.2" fill="#0a0908" stroke="#fde047" strokeWidth="0.6" />
            <circle cx="21" cy="14" r="2.2" fill="#0a0908" stroke="#fde047" strokeWidth="0.6" />
            <path d="M5 7.5 L7 6 L13 6 L13 9 L5 9 Z" fill="rgba(251,191,36,0.4)" />
            <path d="M14 6 L20 6 L22 9 L14 9 Z" fill="rgba(251,191,36,0.4)" />
          </g>
        </svg>
      </div>
      {showText && (
        <div className="text-left">
          <div className="font-display font-semibold text-xl leading-none tracking-tight" style={{ color: "#f9fafb" }}>
            Find<span className="italic" style={{ color: "#fbbf24" }}>My</span>Car
          </div>
          {tagline && <div className="text-[9px] uppercase tracking-[0.2em] text-muted mt-1">Automotive Intelligence</div>}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CAR ILLUSTRATION (cinematic)
   ============================================================ */

function CarIllustration({ gradient, body, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
      {/* warm light from above */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.25), transparent 60%)" }} />
      <svg viewBox="0 0 400 200" className="relative w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="200" cy="180" rx="160" ry="6" fill="rgba(0,0,0,0.5)" />
        {body === "SUV" || body === "Estate" ? (
          <g>
            <path d="M 60 140 L 80 90 Q 90 75 110 75 L 270 75 Q 290 75 305 95 L 335 140 Z" fill="rgba(245,241,234,0.95)" />
            <path d="M 100 95 L 115 85 L 180 85 L 180 110 L 100 110 Z" fill="rgba(20,18,16,0.7)" />
            <path d="M 185 85 L 260 85 L 280 110 L 185 110 Z" fill="rgba(20,18,16,0.7)" />
          </g>
        ) : (
          <g>
            <path d="M 50 145 L 85 110 Q 100 95 125 95 L 180 80 Q 210 75 245 85 L 290 110 L 340 130 L 350 145 Z" fill="rgba(245,241,234,0.95)" />
            <path d="M 115 105 L 135 90 L 185 85 L 190 110 L 115 110 Z" fill="rgba(20,18,16,0.7)" />
            <path d="M 195 85 L 240 90 L 275 110 L 195 110 Z" fill="rgba(20,18,16,0.7)" />
          </g>
        )}
        <circle cx="120" cy="150" r="22" fill="#0a0908" />
        <circle cx="120" cy="150" r="10" fill="rgba(245,241,234,0.2)" />
        <circle cx="280" cy="150" r="22" fill="#0a0908" />
        <circle cx="280" cy="150" r="10" fill="rgba(245,241,234,0.2)" />
        {/* headlights glow */}
        <circle cx="50" cy="125" r="4" fill="#fbbf24" />
        <circle cx="50" cy="125" r="10" fill="#fbbf24" opacity="0.3" />
        <rect x="344" y="120" width="8" height="6" rx="2" fill="#dc2626" />
      </svg>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function App() {
  // DEBUG: confirm this App component is rendering
  React.useEffect(() => {
    console.log("[FindMyCar] 🚗 App component MOUNTED from FindMyCarApp.jsx — this is the real homepage component");
  }, []);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState("");
  const [showListings, setShowListings] = useState(false);
  const [listingFilter, setListingFilter] = useState("all");
  const [listingModel, setListingModel] = useState("");
  const [listingLocation, setListingLocation] = useState("");
  const [listingMaxPrice, setListingMaxPrice] = useState(null);
  const [listingQuery, setListingQuery] = useState("");
  const [view, setView] = useState("home");
  const [country, setCountry] = useState("NL");
  const [language, setLanguage] = useState("EN");
  const [authUser, setAuthUser] = useState(null);
  const [authModalMode, setAuthModalMode] = useState("signup");
  const [toast, setToast] = useState({ type: "", message: "", visible: false });
  // Cinematic intro gate — shows once per page load, then reveals the app
  const [introDone, setIntroDone] = useState(false);
  const [arriving, setArriving] = useState(false);
  const t = useT(language);
const normalizeExternalListing = (raw) => {
  return {
    id: raw.id?.toString() || crypto.randomUUID(),
    title: raw.title || "",
    subtitle: raw.subtitle || "",
    priceLabel: raw.priceLabel || "",
    fuel: raw.fuel || "",
    transmission: raw.transmission || "",
    country: raw.country || "",
    imageUrl: raw.imageUrl || "",
    listingUrl: raw.listingUrl || "",
    source: raw.source || "AutoScout24",
  };
};
const fetchExternalListings = async () => {
  const liveUrl = process.env.NEXT_PUBLIC_LISTINGS_URL || "/api/live-listings";
  const res = await fetch(liveUrl);
  if (!res.ok) {
    throw new Error("Live listings fetch failed");
  }
  const payload = await res.json();
  return Array.isArray(payload.listings) ? payload.listings : Array.isArray(payload) ? payload : [];
};

const loadListings = useCallback(async () => {
  try {
    setListingsLoading(true);
    setListingsError("");

    let rawListings = [];
    try {
      rawListings = await fetchExternalListings();
    } catch (externalError) {
      const fallbackRes = await fetch("/api/listings");
      const fallbackData = await fallbackRes.json();
      rawListings = fallbackData.listings || [];
    }

    let normalizedListings = rawListings.map(normalizeExternalListing).filter((listing) => listing && listing.id);
    if (!normalizedListings.length) {
      const fallbackRes = await fetch("/api/listings");
      const fallbackData = await fallbackRes.json();
      normalizedListings = (fallbackData.listings || []).map(normalizeExternalListing).filter((listing) => listing && listing.id);
    }

    setListings(normalizedListings);
  } catch (error) {
    setListingsError("Could not load listings.");
  } finally {
    setListingsLoading(false);
  }
}, []);
useEffect(() => {
  loadListings();
}, [loadListings]);

  const mapAuthError = (error) => {
    if (!error || !error.message) return "An unexpected error occurred.";
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) return "Incorrect email or password.";
    if (msg.includes("already registered")) return "An account with this email already exists. Try logging in instead.";
    if (msg.includes("email not confirmed")) return "Please confirm your email before logging in. Check your inbox.";
    return error.message;
  };

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    window.setTimeout(() => setToast((current) => current.message === message ? { ...current, visible: false } : current), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user ?? null;
      setAuthUser(currentUser);
      setHasAccount(Boolean(currentUser));
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      setHasAccount(Boolean(currentUser));
      if (event === "SIGNED_OUT") {
        showToast("success", "You have been logged out.");
      }
      // When Supabase consumes the recovery hash internally it fires this event
      // instead of leaving the tokens in window.location.hash. Handle it here
      // so the reset modal appears whether or not the hash was already parsed.
      if (event === "PASSWORD_RECOVERY") {
        setShowPasswordReset(true);
        // Session is already established by Supabase; signal modal to skip setSession.
        setRecoveryAccessToken("__from_event__");
        setRecoveryRefreshToken("");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: mapAuthError(error) };
    if (data?.session?.user) {
      setAuthUser(data.session.user);
      setHasAccount(true);
    }
    return { data };
  };

  const handleLogin = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error) };
    if (data?.session?.user) {
      setAuthUser(data.session.user);
      setHasAccount(true);
      showToast("success", "Logged in successfully.");
    }
    return { data };
  };

  const handleResetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/",
    });
    if (error) return { error: mapAuthError(error) };
    return { data };
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast("error", mapAuthError(error));
      return;
    }
    setAuthUser(null);
    setHasAccount(false);
  };

  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [recoveryAccessToken, setRecoveryAccessToken] = useState(null);
  const [recoveryRefreshToken, setRecoveryRefreshToken] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    if (type === "recovery" && accessToken) {
      setRecoveryAccessToken(accessToken);
      setRecoveryRefreshToken(params.get("refresh_token") || "");
      setShowPasswordReset(true);
    }
  }, []);
  // Chat sessions: each is { id, title, messages, createdAt, updatedAt }
  const makeWelcome = (lang) => ({
    role: "assistant",
    kind: "text",
    content: TRANSLATIONS[lang].chat.welcome,
  });

  const [chatSessions, setChatSessions] = useState([]); // bookmarked old chats
  const [messages, setMessages] = useState([makeWelcome("EN")]);
  const [chatTurn, setChatTurn] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const [selectedCar, setSelectedCar] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [searchCount, setSearchCount] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showShortlist, setShowShortlist] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // When language changes and chat is still in initial state, retranslate the welcome
  React.useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant" && chatTurn === 0) {
      setMessages([makeWelcome(language)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ── Conversation persistence (10-day TTL) ──────────────────────────────────
  // The advisor "remembers the conversation for 10 days": persist the chat to
  // localStorage and restore it on load, expiring after 10 days.
  const FMC_CHAT_KEY = "fmc.chat.v1";
  const FMC_CHAT_TTL = 10 * 24 * 60 * 60 * 1000; // 10 days in ms
  const chatHydrated = React.useRef(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FMC_CHAT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved.savedAt === "number" && Date.now() - saved.savedAt < FMC_CHAT_TTL) {
          if (Array.isArray(saved.messages) && saved.messages.length > 1) setMessages(saved.messages);
          if (typeof saved.chatTurn === "number") setChatTurn(saved.chatTurn);
          if (Array.isArray(saved.chatSessions)) setChatSessions(saved.chatSessions);
          if (typeof saved.country === "string") setCountry(saved.country);
          if (typeof saved.language === "string") setLanguage(saved.language);
        } else {
          window.localStorage.removeItem(FMC_CHAT_KEY); // expired
        }
      }
    } catch { /* corrupt or unavailable storage — start fresh */ }
    chatHydrated.current = true;
  }, []);

  React.useEffect(() => {
    if (!chatHydrated.current) return;
    try {
      window.localStorage.setItem(FMC_CHAT_KEY, JSON.stringify({
        savedAt: Date.now(), messages, chatTurn, chatSessions, country, language,
      }));
    } catch { /* quota exceeded or unavailable — skip persistence */ }
  }, [messages, chatTurn, chatSessions, country, language]);

  const hasExplicitListingFilters = (text) => {
    const t = text.toLowerCase();
    const hasMake = MAKE_REGEX.test(t);
    const hasListingIntent = /\b(show me|find me|find a|looking for|i want a?|i need a?|can you find|can you show|search for|listings?)\b/i.test(t);
    const hasBudget = /\b(?:under|up to|max|budget)\s*(?:€\s*)?\d[\d.,]*(k)?\b/i.test(t) || /(?:^|[^A-Za-z0-9€])(?:€\s*)?\d{4,}\b/i.test(t);
    const hasMileage = /\d[\d.,]*\s*k?m\b/i.test(t) && /\b(km|kilometres|kilometers)\b/i.test(t);
    return (hasMake && hasListingIntent) || (hasMake && hasBudget) || (hasListingIntent && hasBudget) || (hasListingIntent && hasMileage);
  };
  const getVisibleListings = (sourceListings, filter, model, locationFilter, maxPrice) => {
    if (sourceListings && !Array.isArray(sourceListings) && typeof sourceListings === "object") {
      const r = sourceListings;
      // Support both old shape (make, model, detectedCountry, fuel, maxPrice, maxMileage, minYear)
      // and new pipeline shape (makeName, makeSlug, modelDisplay, modelSlug, fuel_type, budget_max, mileage_max, year_min, country)
      const makeName     = r.makeName     || r.make     || null;
      const makeSlug     = r.makeSlug     || (makeName ? makeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null);
      const modelDisplay = r.modelDisplay || r.model    || null;
      const modelSlug    = r.modelSlug    || null;
      const trimDisplay  = r.trimDisplay  || null;
      const fuel         = r.fuel_type    || r.fuel     || null;
      const transmission = r.transmission || null;
      const minYear      = r.year_min     || r.minYear  || null;
      const maxBudget    = r.budget_max   || r.maxPrice || null;
      const maxMileage   = r.mileage_max  || r.maxMileage || null;
      const resolvedCountry = r.country   || r.detectedCountry || country;
      const level        = r.level        || null;
      const fallbackReason = r.fallbackReason || null;

      if (!makeName && !modelDisplay && !minYear && !maxBudget && !maxMileage) {
        return [];
      }

      const title = [makeName, modelDisplay, trimDisplay].filter(Boolean).join(" ").trim() || "Recommended car";
      const summaryParts = [];
      if (fuel && fuel !== "any") summaryParts.push(fuel);
      if (transmission && transmission !== "any") summaryParts.push(transmission);
      if (minYear) summaryParts.push(`from ${minYear}`);
      if (maxBudget) summaryParts.push(`up to €${maxBudget.toLocaleString()}`);
      if (maxMileage) summaryParts.push(`under ${maxMileage.toLocaleString()} km`);
      const subtitle = summaryParts.length > 0
        ? `Based on your request: ${summaryParts.join(", ")}.`
        : "Search results matched to your request.";

      return [{
        id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${minYear || "any"}-${maxBudget || "any"}-${maxMileage || "any"}`,
        title,
        subtitle,
        priceLabel: maxBudget ? `Up to €${maxBudget.toLocaleString()}` : "Live market search",
        fuel: fuel || "any",
        transmission: transmission || "any",
        minYear: minYear || null,
        maxMileage: maxMileage || null,
        country: resolvedCountry,
        level,
        fallbackReason,
        trimDisplay,
        // Structured intent — the LiveMarketCard sends this to /api/market-search,
        // which is the single place URLs are built + validated (no fragile slug
        // guessing or prebuilt links rendered as if valid).
        intent: {
          // Send the RAW extracted make/model strings + the original message so the
          // server-side taxonomy resolver (lib/autoscout/resolve.ts) is the single
          // source of truth — no pre-resolution here that could demote to brand level.
          make: r.rawMake || makeName || null,
          model: r.rawModel || modelDisplay || null,
          country: resolvedCountry,
          maxMileage: maxMileage || null,
          maxPrice: maxBudget || null,
          fuel: fuel && fuel !== "any" ? fuel : null,
          transmission: transmission && transmission !== "any" ? transmission : null,
          yearFrom: minYear || null,
          rawText: r.rawText || null,
        },
        source: "AutoScout24",
      }];
    }

    const listings = Array.isArray(sourceListings) ? sourceListings : [];
    return listings.filter((listing) => {
      const title = `${listing.make || ""} ${listing.title || ""}`.toLowerCase();
      const locationText = (listing.location || "").toLowerCase();
      if (filter === "bmw" && !title.includes("bmw")) return false;
      if (filter === "audi" && !title.includes("audi")) return false;
      if (model && !title.includes(model)) return false;
      if (locationFilter && !locationText.includes(locationFilter)) return false;
      if (maxPrice != null && listing.price > maxPrice) return false;
      return true;
    });
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", kind: "text", content: text };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setIsTyping(true);
    const turn = chatTurn + 1;
    setChatTurn(turn);

    const hasExplicitFilters = hasExplicitListingFilters(text);
    const isListingRequest = /\blistings?\b/i.test(text) || hasExplicitFilters;
    let listingReply = "";
    let filteredListings = [];

    try {
      // Run intent extraction and chat response in parallel to save time
      const [intentRaw, replyText] = await Promise.all([
        isListingRequest ? extractSearchIntent(text) : Promise.resolve(null),
        hybridChatSend(updatedMsgs),
      ]);

      if (isListingRequest && intentRaw) {
        setShowListings(true);
        const intent = resolveVehicle(intentRaw);
        const { level, fallbackReason } = intent;
        const hasParsedIntent = intent.makeName || intent.modelDisplay || intent.year_min || intent.budget_max || intent.mileage_max;

        setListingQuery(text);
        setListingFilter(intent.makeName ? intent.makeName.toLowerCase() : "all");
        setListingModel(intent.modelDisplay || "");
        setListingLocation("");
        setListingMaxPrice(intent.budget_max ?? null);

        if (hasParsedIntent) {
          filteredListings = getVisibleListings({ ...intent, level, fallbackReason, rawText: text, rawMake: intentRaw.make, rawModel: intentRaw.model });
          listingReply = filteredListings.length > 0
            ? "I found a live-market search based on your request."
            : "I couldn't build a recommendation from that request.";
        } else {
          listingReply = "I couldn't understand that listing request. Try including a make, model, year, price, or mileage.";
        }

        loadListings();
      }

      setMessages(m => {
        const next = [...m, {
          role: "assistant", kind: "text",
          content: isListingRequest ? listingReply : replyText,
          lang: language, mode: "advisor",
        }];
        if (isListingRequest) {
          next.push({ role: "assistant", kind: "listings", listings: filteredListings });
        }
        return next;
      });

      const newCount = searchCount + 1;
      setSearchCount(newCount);
      if (newCount >= 6 && !hasAccount) {
        setTimeout(() => setShowAccountModal(true), 600);
      }
    } catch (err) {
      setMessages(m => [...m, {
        role: "assistant", kind: "text",
        content: "Something went wrong. Please try again in a moment.",
        lang: language, mode: "advisor",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Bookmark current chat to history and start fresh
  const startFreshChat = () => {
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === "user");
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : "Earlier conversation";
      setChatSessions((s) => [
        {
          id: Date.now(), title, messages, createdAt: Date.now(), updatedAt: Date.now(),
          showListings, listingQuery, listingFilter, listingModel, listingLocation, listingMaxPrice,
        },
        ...s,
      ].slice(0, 20));
    }
    setMessages([makeWelcome(language)]);
    setChatTurn(0);
    setShowListings(false);
    setListingQuery("");
    setListingFilter("all");
    setListingModel("");
    setListingLocation("");
    setListingMaxPrice(null);
  };

  // Restore a saved chat session
  const restoreSession = (id) => {
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    // bookmark current first if it has content
    if (messages.length > 1) {
      const firstUserMsg = messages.find(m => m.role === "user");
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) : "Earlier conversation";
      setChatSessions((s) => [
        {
          id: Date.now(), title, messages, createdAt: Date.now(), updatedAt: Date.now(),
          showListings, listingQuery, listingFilter, listingModel, listingLocation, listingMaxPrice,
        },
        ...s.filter(x => x.id !== id),
      ].slice(0, 20));
    } else {
      setChatSessions((s) => s.filter(x => x.id !== id));
    }
    setMessages(session.messages);
    setChatTurn(session.messages.filter(m => m.role === "user").length);
    setShowHistory(false);
    setView("home");
    if (session.listingQuery !== undefined) {
      setShowListings(session.showListings ?? false);
      setListingQuery(session.listingQuery ?? "");
      setListingFilter(session.listingFilter ?? "all");
      setListingModel(session.listingModel ?? "");
      setListingLocation(session.listingLocation ?? "");
      setListingMaxPrice(session.listingMaxPrice ?? null);
    } else {
      const lastListingUser = [...session.messages].reverse().find((m) => m.role === "user" && hasExplicitListingFilters(m.content));
      if (lastListingUser) {
        const rawIntent = regexExtractIntent(lastListingUser.content);
        const intent = resolveVehicle(rawIntent);
        setShowListings(true);
        setListingQuery(lastListingUser.content.toLowerCase());
        setListingFilter(intent.makeName ? intent.makeName.toLowerCase() : "all");
        setListingModel(intent.modelDisplay || "");
        setListingLocation("");
        setListingMaxPrice(intent.budget_max ?? null);
      } else {
        setShowListings(false);
        setListingQuery("");
        setListingFilter("all");
        setListingModel("");
        setListingLocation("");
        setListingMaxPrice(null);
      }
    }
    window.scrollTo(0, 0);
  };

  const deleteSession = (id) => {
    setChatSessions((s) => s.filter(x => x.id !== id));
  };

  const toggleShortlist = (carId) => {
    setShortlist((prev) => prev.includes(carId) ? prev.filter((x) => x !== carId) : [...prev, carId]);
  };
  const toggleCompare = (carId) => {
    setCompareList((prev) => {
      if (prev.includes(carId)) return prev.filter((x) => x !== carId);
      if (prev.length >= 4) return prev;
      return [...prev, carId];
    });
  };
  const clearShortlist = () => setShortlist([]);
  const clearCompare = () => setCompareList([]);
  const openCar = (car) => { setSelectedCar(car); setView("model"); window.scrollTo(0, 0); };

  // Smooth scroll to an element by id. If the target lives on the home page
  // and we're currently on another view, first switch to home then scroll.
  const smoothScrollTo = (targetId, targetView = "home") => {
    const doScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    if (view !== targetView) {
      setView(targetView);
      // Wait a tick for the target view to mount before scrolling
      setTimeout(doScroll, 80);
    } else {
      doScroll();
    }
  };

  // Smooth page navigation — switches view and scrolls to top softly
  const smoothNavigate = (nextView) => {
    if (view === nextView) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setView(nextView);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  // ── Recording tour hook (only active with ?tour=1) ───────────
  // Lets TourMode inject a deterministic, scripted advisor exchange so the
  // walkthrough video is identical every take and never depends on the live
  // LLM. No effect for normal visitors.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isTour = false;
    try { isTour = new URLSearchParams(window.location.search).has("tour"); } catch {}
    if (!isTour) return;
    window.__fmcTourChat = {
      reset: () => {
        // Start from a clean chat so no persisted history leaks into the take
        setShowListings(false);
        setChatTurn(0);
        setMessages([makeWelcome(language)]);
        try { window.localStorage.removeItem(FMC_CHAT_KEY); } catch {}
      },
      user: (text) => { setShowListings(false); setMessages((m) => [...m, { role: "user", kind: "text", content: text }]); },
      typing: (on) => setIsTyping(on),
      assistant: (text) => setMessages((m) => [...m, { role: "assistant", kind: "text", content: text, lang: language, mode: "advisor" }]),
    };
    return () => { try { delete window.__fmcTourChat; } catch {} };
  }, [language]);

  const visibleListings = getVisibleListings(listings, listingFilter, listingModel, listingLocation, listingMaxPrice);

  return (
    
    <div className={`min-h-screen text-[#f5f1ea] relative ${arriving ? "fmc-arrive" : ""}`} style={{ background: "#0a0908", fontFamily: "'Inter Tight', ui-sans-serif, system-ui" }}>
      <LuxCursor />
      <TourMode />
      {!introDone && (
        <CinematicIntro
          onDone={({ instant } = {}) => {
            setIntroDone(true);
            if (!instant) {
              setArriving(true);
              window.setTimeout(() => setArriving(false), 900);
            }
          }}
        />
      )}
      <style>{`
        .fmc-arrive{animation:fmcArrive .8s cubic-bezier(.16,1,.3,1) both;will-change:transform,opacity}
        @keyframes fmcArrive{from{transform:scale(1.035);opacity:.72}to{transform:none;opacity:1}}
        @media (prefers-reduced-motion: reduce){.fmc-arrive{animation:none}}

        /* ── Premium hover language ─────────────────────────────────
           Border brightens toward gold, soft bloom underneath, small
           lift. Shared across nav, pills, cards and CTAs. */
        .fmc-navbtn{position:relative;transition:color .25s ease,background .3s ease}
        .fmc-navbtn::after{
          content:'';position:absolute;left:16px;right:16px;bottom:5px;height:2px;border-radius:999px;
          background:linear-gradient(90deg,transparent,rgba(251,191,36,.85),transparent);
          transform:scaleX(0);transform-origin:center;transition:transform .32s cubic-bezier(.2,.8,.2,1);
        }
        .fmc-navbtn:hover,.fmc-navbtn:focus-visible{color:#f5f1ea;background:rgba(251,191,36,.07)}
        .fmc-navbtn:hover::after,.fmc-navbtn:focus-visible::after{transform:scaleX(1)}

        .step-card-hover:hover{border-color:rgba(251,191,36,.38)}

        /* Cursor-proximity spotlight on large cards (set by LuxCursor) */
        .fmc-spot-on{position:relative}
        .fmc-spot-on::after{
          content:'';position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;
          background:radial-gradient(240px circle at var(--fmc-mx,50%) var(--fmc-my,50%),rgba(251,191,36,.07),transparent 65%);
        }
        @media (prefers-reduced-motion: reduce){
          .fmc-navbtn::after{transition:none}
          .pill:hover,.btn-primary:hover,.btn-ghost:hover{transform:none}
          .fmc-spot-on::after{display:none}
        }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,600;1,9..144,700;1,9..144,800;1,9..144,900&family=Inter+Tight:wght@300;400;500;600;700&display=swap');

        :root {
          --bg: #0a0908;
          --bg-2: #141210;
          --bg-3: #1c1916;
          --border: #2a2520;
          --border-warm: rgba(251,191,36,0.25);
          --text: #f5f1ea;
          --muted: #8a8178;
          --amber: #fbbf24;
          --bronze: #d97706;
          --deep: #92400e;
        }

        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
        .font-body { font-family: 'Inter Tight', ui-sans-serif, system-ui; }

        body { background: #0a0908; color: #f5f1ea; }

        /* Force all headings to readable off-white by default */
        h1, h2, h3, h4, h5, h6 { color: #f9fafb; }

        /* Form controls inherit browser default blue/black — force light */
        input, textarea, select, button {
          color: #f5f1ea;
          font-family: inherit;
        }
        input::placeholder, textarea::placeholder { color: #8a8178; }
        textarea { background: transparent; }

        /* Catch stray anchor defaults */
        a { color: inherit; }

        /* Grain overlay */
        .grain::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
          opacity: 0.08; mix-blend-mode: overlay;
        }

        /* Dot grid */
        .dot-grid {
          background-image: radial-gradient(circle at 1px 1px, rgba(245,241,234,0.06) 1px, transparent 0);
          background-size: 36px 36px;
        }

        /* Glow orbs */
        .glow-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(120px);
          pointer-events: none;
        }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
        .fade-up { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) both; }

        /* Gentle vertical float loop for social-proof pills in hero */
        @keyframes floatPill {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(calc(-50% - 10px)); }
        }

        /* Hide floating pills on mobile */
        @media (max-width: 767px) {
          .hero-pill-float { display: none !important; }
        }

        /* Hero video crossfade system — two layers alternate */
        .hero-vid-layer {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          transition: opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity;
        }
        .hero-vid-layer.active  { opacity: 1; }
        .hero-vid-layer.standby { opacity: 0; }

        /* Video toggle button — always visible on screens 480px+ */
        .hero-vid-toggle {
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(245,241,234,0.6);
          background: rgba(10,9,8,0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(245,241,234,0.08);
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }
        .hero-vid-toggle:hover {
          color: #fbbf24;
          border-color: rgba(251,191,36,0.3);
          background: rgba(10,9,8,0.75);
        }
        .hero-vid-toggle svg {
          width: 14px; height: 14px;
          transition: transform 0.3s;
        }
        .hero-vid-toggle:hover svg { transform: scale(1.1); }
        @media (max-width: 479px) {
          .hero-vid-toggle { display: none; }
        }

        /* Step card hover: subtle lift + amber glow */
        .step-card-hover {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.4s ease;
        }
        .step-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 50px rgba(251, 191, 36, 0.18);
          border-color: rgba(251, 191, 36, 0.35);
        }

        /* Mini chat bubbles (step 1) */
        @keyframes chatMiniPop {
          0%, 100% { opacity: 0.95; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        .mini-chat-bubble-a { animation: chatMiniPop 3.5s ease-in-out infinite; }
        .mini-chat-bubble-b { animation: chatMiniPop 3.5s ease-in-out infinite; animation-delay: 1.75s; }

        /* Mini price bar chart (step 3) */
        @keyframes barGrow {
          0% { height: 20%; }
          100% { height: var(--bar-h, 60%); }
        }
        .mini-bar {
          animation: barGrow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* ── Europe Command Layer ──────────────────────────────────
           Scroll-driven market environment system. As the user moves
           through markets, the entire ambient atmosphere shifts. */

        /* Market spine — floating side rail */
        .market-spine {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 35;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .spine-line {
          width: 2px;
          height: 32px;
          background: rgba(245,241,234,0.06);
          transition: background 0.6s;
        }
        .spine-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(245,241,234,0.08);
          border: 2px solid rgba(245,241,234,0.12);
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
        }
        .spine-dot.active {
          transform: scale(1.5);
          border-color: var(--spine-color, #fbbf24);
          background: var(--spine-color, #fbbf24);
          box-shadow: 0 0 20px var(--spine-glow, rgba(251,191,36,0.5));
        }
        .spine-dot .spine-label {
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          color: var(--spine-color, #fbbf24);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .spine-dot:hover .spine-label,
        .spine-dot.active .spine-label {
          opacity: 1;
        }
        @media (max-width: 1024px) {
          .market-spine { display: none; }
        }

        /* Market section full-bleed environment */
        .market-env {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          transition: background 0.8s;
        }
        .market-env-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
          transition: opacity 1s;
        }
        .market-env-content {
          position: relative;
          z-index: 2;
          width: 100%;
        }

        /* Signature interaction panels */
        .sig-panel {
          background: rgba(10,9,8,0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(245,241,234,0.08);
          transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sig-panel:hover {
          border-color: var(--sig-color, rgba(251,191,36,0.3));
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px var(--sig-glow, rgba(251,191,36,0.1));
          transform: translateY(-4px);
        }

        /* City grid animation for NL */
        @keyframes cityPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        .city-grid-dot {
          animation: cityPulse 3s ease-in-out infinite;
        }

        /* Cross-border flow lines for BE */
        @keyframes flowLine {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }

        /* Autobahn speed lines for DE */
        @keyframes speedLine {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        .speed-line {
          animation: speedLine 3s linear infinite;
        }

        /* Value pulse for PL */
        @keyframes valuePulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(239,68,68,0.4)); }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
        .value-pulse {
          animation: valuePulse 2.5s ease-in-out infinite;
        }

        /* Chip entrance stagger */
        @keyframes chipEnter {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          100% { opacity: 1; transform: none; }
        }
        .chip-enter {
          opacity: 0;
          animation: chipEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }


        /* ── Page entrance system — used by all pages/tabs ──
           Apply .page-enter to the page wrapper and .stagger to each
           direct child that should animate in. Items are staggered via
           --stagger-index. Mirrors the Discover/Home animation vibe. */
        @keyframes pageStagger {
          0%   { opacity: 0; transform: translateY(18px); filter: blur(3px); }
          60%  { filter: blur(0); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .page-enter .stagger {
          opacity: 0;
          animation: pageStagger 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--stagger-index, 0) * 0.08s + 0.05s);
        }
        /* Fallback for pages that don't explicitly tag children — auto stagger direct children */
        .page-enter > *:not(.stagger) {
          opacity: 0;
          animation: pageStagger 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .page-enter > *:nth-child(1):not(.stagger) { animation-delay: 0.05s; }
        .page-enter > *:nth-child(2):not(.stagger) { animation-delay: 0.13s; }
        .page-enter > *:nth-child(3):not(.stagger) { animation-delay: 0.21s; }
        .page-enter > *:nth-child(4):not(.stagger) { animation-delay: 0.29s; }
        .page-enter > *:nth-child(5):not(.stagger) { animation-delay: 0.37s; }
        .page-enter > *:nth-child(6):not(.stagger) { animation-delay: 0.45s; }
        .page-enter > *:nth-child(7):not(.stagger) { animation-delay: 0.53s; }
        .page-enter > *:nth-child(8):not(.stagger) { animation-delay: 0.61s; }
        .page-enter > *:nth-child(9):not(.stagger) { animation-delay: 0.69s; }
        .page-enter > *:nth-child(n+10):not(.stagger) { animation-delay: 0.77s; }

        /* Respect reduced motion — disable all entrance animations */
        @media (prefers-reduced-motion: reduce) {
          .fade-up,
          .chat-enter-assistant,
          .chat-enter-user,
          .page-enter .stagger,
          .page-enter > *:not(.stagger) {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
          .pulse-glow, .typing-dot { animation: none !important; }
          html { scroll-behavior: auto !important; }
        }

        /* Chat message entrance — smoother than fade-up, with slight scale */
        @keyframes chatEnterAssistant {
          0%   { opacity: 0; transform: translateY(14px) translateX(-6px) scale(0.96); filter: blur(4px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) translateX(0) scale(1); filter: blur(0); }
        }
        @keyframes chatEnterUser {
          0%   { opacity: 0; transform: translateY(14px) translateX(6px) scale(0.96); filter: blur(4px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) translateX(0) scale(1); filter: blur(0); }
        }
        .chat-enter-assistant {
          animation: chatEnterAssistant 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: bottom left;
        }
        .chat-enter-user {
          animation: chatEnterUser 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: bottom right;
        }
        /* Smooth scroll globally for in-page anchor links */
        html { scroll-behavior: smooth; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.4), 0 0 40px rgba(251,191,36,0.25); }
          50% { box-shadow: 0 0 0 14px rgba(251,191,36,0), 0 0 60px rgba(251,191,36,0.4); }
        }
        .pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }

        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        .typing-dot { animation: typingDot 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }

        /* Chat bubbles */
        .bubble-assistant {
          background: linear-gradient(180deg, #1c1916 0%, #141210 100%);
          border: 1px solid rgba(251,191,36,0.18);
          border-top-left-radius: 4px;
          transition: box-shadow 0.3s ease;
        }
        .bubble-user {
          background: linear-gradient(135deg, #fbbf24, #d97706);
          color: #1a0f00;
          border-top-right-radius: 4px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(217,119,6,0.25);
        }

        /* Hide horizontal scrollbar for car carousel */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }

        /* Primary CTA */
        .btn-primary {
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%);
          color: #1a0f00;
          font-weight: 600;
          border: 1px solid rgba(251,191,36,0.4);
          box-shadow: 0 8px 30px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
          transition: all .3s cubic-bezier(.2,.8,.2,1);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 44px rgba(217,119,6,0.5), 0 0 24px rgba(251,191,36,0.18), inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .btn-ghost {
          background: rgba(245,241,234,0.03);
          border: 1px solid var(--border);
          color: var(--text);
          transition: all .3s ease;
        }
        .btn-ghost:hover {
          background: rgba(251,191,36,0.08);
          border-color: rgba(251,191,36,0.4);
          color: #fbbf24;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.35), 0 0 16px rgba(251,191,36,0.10);
        }

        /* Premium card */
        .card {
          background: linear-gradient(180deg, #161310 0%, #0f0d0b 100%);
          border: 1px solid var(--border);
          position: relative;
          transition: all .4s cubic-bezier(.2,.8,.2,1);
        }
        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,191,36,0.3), transparent);
        }
        .card:hover {
          border-color: rgba(251,191,36,0.38);
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 60px rgba(251,191,36,0.10), inset 0 1px 0 rgba(251,191,36,0.08);
        }
        .pill:hover {
          box-shadow: 0 0 18px rgba(251,191,36,0.12), inset 0 0 12px rgba(251,191,36,0.05);
          transform: translateY(-1px);
        }

        .card-static {
          background: linear-gradient(180deg, #161310 0%, #0f0d0b 100%);
          border: 1px solid var(--border);
          position: relative;
        }
        .card-static::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,191,36,0.25), transparent);
        }

        /* Inputs */
        .input-dark {
          background: rgba(245,241,234,0.03);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .input-dark:focus {
          outline: none;
          border-color: rgba(251,191,36,0.4);
          background: rgba(245,241,234,0.05);
        }
        .input-dark::placeholder { color: var(--muted); }

        /* Hero text gradient */
        .hero-gradient-text {
          background: linear-gradient(135deg, #f5f1ea 0%, #fbbf24 50%, #d97706 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .amber-text { color: #fbbf24; }
        .text-muted { color: var(--muted); }

        /* Pill */
        .pill {
          background: rgba(245,241,234,0.04);
          border: 1px solid var(--border);
          color: var(--text);
          transition: all .25s ease;
        }
        .pill:hover {
          border-color: rgba(251,191,36,0.5);
          background: rgba(251,191,36,0.06);
          color: #fbbf24;
        }
        .pill-active {
          background: linear-gradient(135deg, #fbbf24, #d97706) !important;
          border-color: transparent !important;
          color: #1a0f00 !important;
          font-weight: 600;
        }

        select.input-dark option { background: #141210; color: #f5f1ea; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #0a0908; }
        ::-webkit-scrollbar-thumb { background: #2a2520; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #d97706; }
      `}</style>

      <div className="grain" />
      {toast.visible && <Toast type={toast.type} message={toast.message} />}

      {/* Ambient glow orbs - global */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb" style={{ width: 600, height: 600, top: -200, right: -200, background: "rgba(251,191,36,0.12)" }} />
        <div className="glow-orb" style={{ width: 500, height: 500, top: 400, left: -200, background: "rgba(217,119,6,0.08)" }} />
      </div>

      <div className="relative" style={{ zIndex: 2 }}>
        <Nav setView={setView}
          shortlist={shortlist} compareList={compareList}
          setShowShortlist={setShowShortlist} setShowCompare={setShowCompare}
          hasAccount={hasAccount} user={authUser}
          setShowAccountModal={setShowAccountModal} setAuthModalMode={setAuthModalMode}
          handleLogout={handleLogout}
          language={language} setShowLanguagePicker={setShowLanguagePicker}
          chatSessions={chatSessions} setShowHistory={setShowHistory}
          smoothScrollTo={smoothScrollTo} smoothNavigate={smoothNavigate}
          t={t}
        />

        <div key={view}>
          {view === "home" && (
            <Home
              messages={messages} sendMessage={sendMessage} isTyping={isTyping}
              startFreshChat={startFreshChat}
              country={country} setCountry={setCountry} openCar={openCar}
              shortlist={shortlist} compareList={compareList}
              toggleShortlist={toggleShortlist} toggleCompare={toggleCompare}
              language={language} setShowLanguagePicker={setShowLanguagePicker}
              chatSessions={chatSessions} setShowHistory={setShowHistory}
              showListings={showListings} visibleListings={visibleListings}
              listingsLoading={listingsLoading} listingsError={listingsError}
              t={t}
            />
          )}
          {view === "model" && selectedCar && (
            <ModelPage car={selectedCar} country={country}
              shortlist={shortlist} compareList={compareList}
              toggleShortlist={toggleShortlist} toggleCompare={toggleCompare}
              setView={setView}
            />
          )}
          {view === "about" && <About />}
          {view === "faq" && <FAQ />}
          {view === "contact" && <Contact />}
          {view === "privacy" && <LegalPage title="Privacy Policy" kind="privacy" />}
          {view === "terms" && <LegalPage title="Terms of Service" kind="terms" />}
        </div>

        <Footer setView={setView} smoothScrollTo={smoothScrollTo} smoothNavigate={smoothNavigate} t={t} />
      </div>

      {/* Floating AI Chat button — visible on every page except home */}
      {view !== "home" && (
        <button onClick={() => { setView("home"); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50); }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-full font-semibold text-sm shadow-2xl transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)",
            color: "#1a0f00",
            boxShadow: "0 12px 40px rgba(217,119,6,0.5), 0 0 60px rgba(251,191,36,0.3)",
            border: "1px solid rgba(251,191,36,0.6)",
          }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(10,9,8,0.85)" }}>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="uppercase tracking-wider">{t.floating}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {showShortlist && <ShortlistDrawer shortlist={shortlist} toggleShortlist={toggleShortlist}
        clearShortlist={clearShortlist}
        onClose={() => setShowShortlist(false)} openCar={(c) => { setShowShortlist(false); openCar(c); }}
        country={country} />}
      {showCompare && compareList.length > 0 && <CompareModal compareList={compareList}
        onClose={() => setShowCompare(false)} toggleCompare={toggleCompare} clearCompare={clearCompare} country={country} />}
      {showAccountModal && <AccountModal
        onClose={() => setShowAccountModal(false)}
        initialMode={authModalMode}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onResetPassword={handleResetPassword}
      />}
      {showCountryPicker && <CountryPicker country={country}
        setCountry={(c) => { setCountry(c); setShowCountryPicker(false); }}
        onClose={() => setShowCountryPicker(false)} />}
      {showLanguagePicker && <LanguagePicker language={language}
        setLanguage={(l) => { setLanguage(l); setShowLanguagePicker(false); }}
        onClose={() => setShowLanguagePicker(false)} />}
      {showHistory && <ChatHistoryModal sessions={chatSessions}
        onRestore={restoreSession} onDelete={deleteSession}
        onClose={() => setShowHistory(false)} />}
      {showPasswordReset && (
        <PasswordResetModal
          accessToken={recoveryAccessToken}
          refreshToken={recoveryRefreshToken}
          onDone={() => {
            setShowPasswordReset(false);
            window.history.replaceState(null, "", "/");
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   NAV
   ============================================================ */

function Nav({ setView, shortlist, compareList, setShowShortlist, setShowCompare, hasAccount, user, setShowAccountModal, setAuthModalMode, handleLogout, language, setShowLanguagePicker, chatSessions, setShowHistory, smoothScrollTo, smoothNavigate, t }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Smooth-scroll handlers for in-page anchors. The Cost Calculator is a
  // separate view, so it uses smoothNavigate. Everything else lives on the
  // home page as a section and gets scrolled to via smoothScrollTo.
  const goDiscover = () => smoothScrollTo ? smoothScrollTo("home-top",      "home") : setView("home");
  const goHow      = () => smoothScrollTo ? smoothScrollTo("home-how",      "home") : setView("about");
  const goMarkets  = () => smoothScrollTo ? smoothScrollTo("home-markets",  "home") : setView("home");
  const goShowroom = () => smoothScrollTo ? smoothScrollTo("home-showroom", "home") : setView("home");
  const goWhy      = () => smoothScrollTo ? smoothScrollTo("home-why",      "home") : setView("home");
  const goContact  = () => setView("contact");

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(10,9,8,0.7)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <button onClick={goDiscover} className="flex items-center group">
          <Logo size={40} />
        </button>

        <div className="hidden md:flex items-center gap-1">
          <NavBtn onClick={goDiscover}>{t.nav.discover}</NavBtn>
          <NavBtn onClick={goHow}>{t.nav.how}</NavBtn>
          <NavBtn onClick={goMarkets}>Markets</NavBtn>
          <NavBtn onClick={goShowroom}>Showroom</NavBtn>
          <NavBtn onClick={goWhy}>Why us</NavBtn>
          <NavBtn onClick={goContact}>{t.nav.contact}</NavBtn>
        </div>

        <div className="flex items-center gap-2">
          {/* Chat history bookmark — visible if there are saved sessions */}
          {chatSessions.length > 0 && (
            <button onClick={() => setShowHistory(true)} title={t.nav.history}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.nav.history}</span>
              <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold" style={{ background: "#fbbf24", color: "#1a0f00" }}>{chatSessions.length}</span>
            </button>
          )}

          <button onClick={() => setShowLanguagePicker(true)} title="Choose language"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm btn-ghost">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">{language}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {compareList.length > 0 && (
            <button onClick={() => setShowCompare(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: "#fbbf24", color: "#1a0f00" }}>{compareList.length}</span>
            </button>
          )}

          <button onClick={() => setShowShortlist(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm btn-ghost">
            <Heart className={`w-4 h-4 ${shortlist.length > 0 ? "fill-amber-400 text-amber-400" : ""}`} />
            {shortlist.length > 0 && <span className="font-medium">{shortlist.length}</span>}
          </button>

          {!user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => { setAuthModalMode("signup"); setShowAccountModal(true); }}
                className="px-5 py-2 rounded-full text-sm btn-primary">
                {t.nav.signup}
              </button>
              <button onClick={() => { setAuthModalMode("login"); setShowAccountModal(true); }}
                className="text-sm text-muted hover:text-[#f5f1ea] transition">
                Log in
              </button>
            </div>
          ) : (
            <div className="relative">
              <button onClick={() => setShowUserMenu((open) => !open)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)", color: "#1a0f00" }}>
                {String(user.email?.[0] || "U").toUpperCase()}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-white/10 bg-[#0a0908]/95 p-4 shadow-2xl">
                  <div className="mb-4">
                    <div className="font-semibold text-sm">{user.user_metadata?.full_name || user.email}</div>
                    <div className="text-xs text-muted truncate">{user.email}</div>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); setShowShortlist(true); }}
                    className="w-full text-left text-sm text-muted hover:text-amber-400 transition py-2">
                    My shortlist
                  </button>
                  <button onClick={() => { setShowUserMenu(false); setShowHistory(true); }}
                    className="w-full text-left text-sm text-muted hover:text-amber-400 transition py-2">
                    Chat history
                  </button>
                  <button onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full text-left text-sm text-muted hover:text-amber-400 transition py-2">
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="fmc-navbtn px-4 py-2 rounded-full text-sm font-medium text-muted">
      {children}
    </button>
  );
}

/* ============================================================
   HOME (chat-driven)
   ============================================================ */

function Home({ messages, sendMessage, isTyping, startFreshChat, country, setCountry, openCar, shortlist, compareList, toggleShortlist, toggleCompare, language, setShowLanguagePicker, chatSessions, setShowHistory, showListings = false, visibleListings = [], listingsLoading = false, listingsError = "", t }) {
  // DEBUG: confirm this component is the one rendering on your page
  React.useEffect(() => {
    console.log("[FindMyCar] 🏠 Home component MOUNTED from FindMyCarApp.jsx — hero video system should be visible");
  }, []);
  const [input, setInput] = React.useState("");
  const [openFaq, setOpenFaq] = React.useState(0);
  const scrollRef = React.useRef(null);

  // Expanding chat: grows bigger once the user sends their first message
  const hasChatStarted = messages.some(m => m.role === "user");

  // ── Rotating hero video background ─────────────────────────
  const HERO_VIDEOS = [
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230148/Hero-06_rosiqi.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230150/Hero-01_nwecg8.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1781695688/Hero-03_apbgz1.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230150/Hero-07_gswtag.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230147/Hero-02_w9jaow.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230163/Hero-04_nlp39h.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230163/Hero-04_nlp39h.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230159/Hero-05_tbc7ym.mp4",
    "https://res.cloudinary.com/df4m9e0ob/video/upload/v1781695752/Hero-08_wdihgg.mp4",
  ];
 
  

  // Default to enabled. Only disable if user's OS explicitly prefers reduced motion.
  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [activeVidIdx, setActiveVidIdx] = React.useState(0);
  const [activeLayer, setActiveLayer] = React.useState("A"); // "A" or "B"
  const [videoError, setVideoError] = React.useState(false);
  const vidRefA = React.useRef(null);
  const vidRefB = React.useRef(null);
  const standbyVidIdx = (activeVidIdx + 1) % HERO_VIDEOS.length;

  // Check prefers-reduced-motion on mount (client-side only)
  React.useEffect(() => {
    try {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        setVideoEnabled(false);
      }
    } catch {}
  }, []);

  // Crossfade rotation: every 10s, swap active/standby layers
  // Switch to the next video only when the current one ends.
  React.useEffect(() => {
    if (!videoEnabled || videoError) return;
    const activeRef = activeLayer === "A" ? vidRefA : vidRefB;
    const standbyRef = activeLayer === "A" ? vidRefB : vidRefA;

try {
  standbyRef.current?.pause?.();
  if (standbyRef.current) {
    standbyRef.current.currentTime = 0;
  }
  standbyRef.current?.load?.();
} catch {}

    try {
      activeRef.current?.play?.().catch(() => {});
    } catch {}
  }, [activeLayer, activeVidIdx, videoEnabled, videoError]);

  // Video error handler — log the exact path that failed
  const handleVideoError = React.useCallback((e) => {
    const src = e?.target?.src || e?.target?.currentSrc || "unknown";
    console.error("[FindMyCar] ❌ Hero video FAILED to load:", src);
    console.error("[FindMyCar] Check that files exist in /public/media/Hero/ with EXACT names: Hero-01.mp4, Hero-02.mp4, Hero-03.mp4, Hero-04.mp4, Hero-05.mp4");
    console.error("[FindMyCar] File paths are case-sensitive on Linux/Vercel. Verify casing matches exactly.");
    setVideoError(true);
  }, []);

  const handleVideoEnded = React.useCallback(() => {
    const next = (activeVidIdx + 1) % HERO_VIDEOS.length;
    setActiveLayer(prev => prev === "A" ? "B" : "A");
    setActiveVidIdx(next);
  }, [activeVidIdx]);

  // Log active video on every swap
  React.useEffect(() => {
    if (videoEnabled && !videoError) {
      console.log("[FindMyCar] 🎬 Active hero video:", HERO_VIDEOS[activeVidIdx], "| Layer:", activeLayer);
    }
  }, [activeVidIdx, activeLayer, videoEnabled, videoError]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const onSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const onChip = (text) => {
    sendMessage(text);
  };

  return (
    <div className="relative">
      {/* Hero / chat area */}
      <section
        id="home-top"
        className="relative overflow-hidden dot-grid scroll-mt-24"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {/* ── Rotating video background — dual-layer crossfade ──
             ALL styles are INLINE so this works regardless of whether
             the <style> block's CSS classes are loaded by Next.js. */}
        {videoEnabled && !videoError && (
          <div
            data-debug="hero-video-container"
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <video
              ref={vidRefA}
              key={"vidA-" + (activeLayer === "A" ? activeVidIdx : standbyVidIdx)}
              src={HERO_VIDEOS[activeLayer === "A" ? activeVidIdx : standbyVidIdx]}
              autoPlay={activeLayer === "A"}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              onLoadedData={() => console.log("[FindMyCar] ✅ Video A loaded:", HERO_VIDEOS[activeLayer === "A" ? activeVidIdx : standbyVidIdx])}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                opacity: activeLayer === "A" ? 1 : 0,
                transition: "opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "opacity",
              }}
            />
            <video
              ref={vidRefB}
              key={"vidB-" + (activeLayer === "B" ? activeVidIdx : standbyVidIdx)}
              src={HERO_VIDEOS[activeLayer === "B" ? activeVidIdx : standbyVidIdx]}
              autoPlay={activeLayer === "B"}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              onLoadedData={() => console.log("[FindMyCar] ✅ Video B loaded:", HERO_VIDEOS[activeLayer === "B" ? activeVidIdx : standbyVidIdx])}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                opacity: activeLayer === "B" ? 1 : 0,
                transition: "opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "opacity",
              }}
            />
          </div>
        )}

        {/* ── Dark overlay on top of video (z-1) ────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.78)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Soft amber glow orb still sits above overlay for brand warmth */}
        <div
          aria-hidden="true"
          className="pointer-events-none"
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <div className="glow-orb" style={{ width: 900, height: 500, top: 50, left: "50%", transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(251,191,36,0.18), transparent 70%)", filter: "blur(80px)" }} />
        </div>

        {/* ── Video toggle — FULLY inline styled, no CSS class dependency ── */}
        <button
          data-debug="hero-video-toggle"
          onClick={() => {
            if (videoError) {
              setVideoError(false);
              setActiveVidIdx(0);
              setActiveLayer("A");
            }
            setVideoEnabled(v => !v);
          }}
          title={videoEnabled ? "Pause cinematic background" : "Play cinematic background"}
          aria-label={videoEnabled ? "Pause background video" : "Play background video"}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(245,241,234,0.8)",
            background: "rgba(10,9,8,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "2px solid rgba(251,191,36,0.5)",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 0 15px rgba(251,191,36,0.4)",
          }}
        >
          {videoError ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
              <span>Retry video</span>
            </>
          ) : videoEnabled ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              <span>Pause</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Play</span>
            </>
          )}
        </button>

        <div className={`relative mx-auto px-6 pt-12 pb-16 transition-all duration-700 ${hasChatStarted ? "max-w-7xl" : "max-w-5xl"}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)", zIndex: 3 }}>
          {/* Compact eyebrow + headline — collapse when chat is active */}
          <div className={`text-center max-w-3xl mx-auto transition-all duration-500 overflow-hidden ${hasChatStarted ? "max-h-0 opacity-0 mb-0" : "max-h-[500px] opacity-100"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium mb-5 fade-up"
              style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
              <Sparkles className="w-3 h-3" />
              {t.hero.badge}
            </div>
            <h1 className="font-display font-semibold leading-[1.0] tracking-tight fade-up"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.75rem)", animationDelay: ".1s" }}>
              <span className="hero-gradient-text">{t.hero.title1}</span><br />
              <span className="italic font-light text-muted text-[0.85em]">{t.hero.title2}</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted max-w-xl mx-auto fade-up" style={{ animationDelay: ".2s" }}>
              {t.hero.sub}
            </p>
          </div>

          {/* Country pills + language — also collapse when chat is active */}
          <div className={`flex items-center justify-center gap-2 flex-wrap fade-up transition-all duration-500 overflow-hidden ${hasChatStarted ? "max-h-0 opacity-0 mt-0" : "max-h-[200px] opacity-100 mt-6"}`} style={{ animationDelay: ".25s" }}>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted mr-1">{t.hero.market}</span>
            {Object.values(COUNTRIES).map(c => (
              <button key={c.code} onClick={() => setCountry(c.code)}
                className={`pill px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 ${country === c.code ? "pill-active" : ""}`}>
                <span>{c.flag}</span> {c.name}
              </button>
            ))}
            <span className="mx-2 text-muted">·</span>
            <button onClick={() => setShowLanguagePicker(true)}
              className="pill px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> {LANGUAGES[language].name}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* CHAT MODULE — grows wider and taller after first message */}
          <div className={`card-static rounded-3xl overflow-hidden fade-up transition-all duration-700 ${hasChatStarted ? "mt-6" : "mt-8"}`}
            style={{
              animationDelay: ".3s",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 100px rgba(251,191,36,0.06)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}>

            {/* Chat header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "rgba(251,191,36,0.03)" }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)", boxShadow: "0 0 16px rgba(251,191,36,0.5)" }}>
                    <Sparkles className="w-4 h-4 text-stone-950" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.8)", border: "2px solid #141210" }} />
                </div>
                <div>
                  <div className="font-display text-base font-semibold leading-tight">{t.chat.advisor}</div>
                  <div className="text-[11px] text-muted flex items-center gap-1.5">
                    <span className="text-emerald-400">●</span> {t.chat.online}
                    <span className="mx-1">·</span>
                    <Globe className="w-2.5 h-2.5" /> {t.chat.speaks}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {chatSessions.length > 0 && (
                  <button onClick={() => setShowHistory(true)} title={t.nav.history}
                    className="text-xs px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                    style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
                    <Bookmark className="w-3 h-3" /> {chatSessions.length}
                  </button>
                )}
                <button onClick={startFreshChat} title="Start new chat" className="text-xs px-3 py-1.5 rounded-full btn-ghost flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> {t.chat.newChat}
                </button>
              </div>
            </div>

            {/* Messages — grows taller once the chat is active */}
            <div ref={scrollRef}
              className="px-5 py-5 space-y-4 overflow-y-auto transition-all duration-700"
              style={{
                minHeight: hasChatStarted ? 560 : 380,
                maxHeight: hasChatStarted ? "72vh" : 560,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}>
              {messages.map((m, i) => (
                <ChatMessage key={i} message={m} country={country} openCar={openCar}
                  shortlist={shortlist} compareList={compareList}
                  toggleShortlist={toggleShortlist} toggleCompare={toggleCompare}
                  onChip={onChip}
                />
              ))}
              {isTyping && (
                <div className="flex items-end gap-2 fade-up">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)" }}>
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  </div>
                  <div className="bubble-assistant rounded-2xl px-4 py-3 flex items-center gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)", background: "rgba(10,9,8,0.5)" }}>
              <div className="flex items-end gap-2">
                <div className="flex-1 rounded-2xl flex items-end gap-2 px-4 py-2" style={{ background: "rgba(245,241,234,0.04)", border: "1px solid var(--border)" }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                    placeholder={t.chat.placeholder}
                    rows={1}
                    className="flex-1 bg-transparent outline-none resize-none py-1.5 text-sm"
                    style={{ color: "#f5f1ea", maxHeight: 100 }}
                  />
                </div>
                <button onClick={onSend} disabled={!input.trim()}
                  className="p-3 rounded-2xl btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] text-muted text-center mt-2">
                {t.chat.remember}
              </div>
            </div>
          </div>

          {/* Quick starters */}
          {messages.length <= 1 && (
            <div className="mt-5 fade-up" style={{ animationDelay: ".4s" }}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3 text-center">{t.chat.tryThese}</div>
              <div className="flex flex-wrap justify-center gap-2">
                {t.chat.starters.map(s => (
                  <button key={s} onClick={() => sendMessage(s)} className="pill px-3 py-1.5 rounded-full text-xs">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRUST BAR — centered glassmorphism pill */}
      <section className="relative py-10">
        <div className="max-w-6xl mx-auto px-6 flex justify-center">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-5 px-8 py-5 rounded-2xl"
            style={{
              background: "rgba(20, 18, 16, 0.55)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(251, 191, 36, 0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {[
              { icon: Shield, title: t.trust.t1t, text: t.trust.t1d },
              { icon: Lightbulb, title: t.trust.t2t, text: t.trust.t2d },
              { icon: Globe, title: t.trust.t3t, text: t.trust.t3d },
              { icon: ThumbsUp, title: t.trust.t4t, text: t.trust.t4d },
            ].map((tr, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }}>
                    <tr.icon className="w-4 h-4 amber-text" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#f5f1ea]">{tr.title}</div>
                    <div className="text-[11px] text-muted">{tr.text}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:block h-8 w-px" style={{ background: "rgba(245,241,234,0.08)" }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          PAGE SPINE — floating progress rail
          ============================================================ */}
      {(() => {
        const [activeSpot, setActiveSpot] = React.useState("home");

        React.useEffect(() => {
          const SPOTS = [
            ["home-top", "home"],
            ["home-markets", "markets"],
            ["home-how", "journey"],
            ["home-showroom", "showroom"],
            ["home-why", "why"],
            ["home-faq", "why"],
          ];
          const observers = SPOTS.map(([id, code]) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(
              ([entry]) => { if (entry.isIntersecting) setActiveSpot(code); },
              { threshold: 0.25, rootMargin: "-10% 0px -10% 0px" }
            );
            obs.observe(el);
            return obs;
          }).filter(Boolean);
          return () => observers.forEach(o => o.disconnect());
        }, []);

        const SPINE_ITEMS = [
          { code: "home", label: "Home", flag: "✦", target: "home-top" },
          { code: "markets", label: "Markets", flag: "◳", target: "home-markets" },
          { code: "journey", label: "Journey", flag: "◈", target: "home-how" },
          { code: "showroom", label: "Showroom", flag: "◇", target: "home-showroom" },
          { code: "why", label: "Why us", flag: "◆", target: "home-why" },
        ];

        return (
          <div className="market-spine">
            {SPINE_ITEMS.map((item, i) => {
              const isActive = activeSpot === item.code;
              return (
                <React.Fragment key={item.code}>
                  {i > 0 && (
                    <div className="spine-line" style={{ background: isActive ? "rgba(251,191,36,0.25)" : undefined }} />
                  )}
                  <div
                    className={`spine-dot ${isActive ? "active" : ""}`}
                    style={{ "--spine-color": "#fbbf24", "--spine-glow": "rgba(251,191,36,0.5)" }}
                    onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    title={item.label}
                  >
                    <span className="spine-label">{item.flag} {item.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        );
      })()}

      {/* QUICK TOOLS — Cost Calculator + VIN Checker modals (real logic) and a
          jump to live markets; sits above the markets grid */}
      <div className="mb-14 mt-4"><MarketTools /></div>

      {/* MARKETS — concept bento grid; cards open the detail overlay,
          CTAs feed the real advisor chat */}
      <MarketsBento
        onSearchMarket={(prompt) => {
          sendMessage(prompt);
          document.getElementById("home-top")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* COST CALCULATOR — single inline section, real 4-market logic */}
      <CostCalculatorSection />

      {/* HOW IT WORKS — concept process section (anchor id "home-how" preserved) */}
      <HowItWorksSection />

      {/* 3D SHOWROOM — interactive BMW X7 */}
      <Showroom />

      {/* WHY FINDMYCAR — trust stats + testimonial */}
      <TrustSection />

      {/* FAQ on home */}
      <section id="home-faq" className="relative py-16 scroll-mt-24" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-[10px] uppercase tracking-[0.2em] amber-text mb-3">{t.faq.eyebrow}</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              {t.faq.title1} <span className="italic font-light">{t.faq.title2}</span>
            </h2>
          </div>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <div key={i} className="card-static rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full p-5 flex items-center justify-between text-left">
                  <div className="font-display font-semibold text-base pr-4">{item.q}</div>
                  <ChevronDown className={`w-5 h-5 amber-text transition shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-muted leading-relaxed">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ message, country, openCar, shortlist, compareList, toggleShortlist, toggleCompare, onChip }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end chat-enter-user">
        <div className="bubble-user rounded-2xl px-4 py-2.5 max-w-[80%] text-sm whitespace-pre-line">
          {message.content}
        </div>
      </div>
    );
  }

  // assistant — grouped car columns (Best Fit + Best Value)
  if (message.kind === "carGroups") {
    return (
      <div className="flex items-end gap-2 chat-enter-assistant">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)" }}>
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
        </div>
        <div className="flex-1 min-w-0 grid sm:grid-cols-2 gap-3">
          {message.groups.map((group, gi) => (
            <div key={gi} className="rounded-2xl p-3" style={{ background: "rgba(245,241,234,0.02)", border: "1px solid var(--border)" }}>
              <div className="mb-2 px-1">
                <div className="text-[11px] font-bold amber-text">{group.label}</div>
                <div className="text-[10px] text-muted">{group.subtitle}</div>
              </div>
              <div className="space-y-2">
                {group.cars.map((rec, i) => (
                  <ChatCarCard key={rec.car.id + i} rec={rec} country={country} openCar={openCar}
                    isShortlisted={shortlist.includes(rec.car.id)} toggleShortlist={toggleShortlist}
                    isCompared={compareList.includes(rec.car.id)} toggleCompare={toggleCompare}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // legacy single-row carousel
  if (message.kind === "cars") {
    return (
      <div className="flex items-end gap-2 chat-enter-assistant">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)" }}>
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {message.cars.map((rec, i) => (
              <ChatCarCard key={rec.car.id + i} rec={rec} country={country} openCar={openCar}
                isShortlisted={shortlist.includes(rec.car.id)} toggleShortlist={toggleShortlist}
                isCompared={compareList.includes(rec.car.id)} toggleCompare={toggleCompare}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (message.kind === "listings") {
    return (
      <div className="flex items-end gap-2 chat-enter-assistant">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)" }}>
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl p-4" style={{ background: "rgba(245,241,234,0.02)", border: "1px solid var(--border)" }}>
            {message.listings.length === 0 ? (
              <p className="text-sm text-muted">No listings found</p>
            ) : (
              <>
                <div className="mb-3 font-semibold text-white">Live market links</div>
                <p className="text-xs text-white/60 mb-4">
                  Open real AutoScout24 results based on your recommendation.
                </p>
                <div className="space-y-3">
                  {message.listings.slice(0, 2).map((listing) => (
                    <LiveMarketCard
                      key={listing.id}
                      intent={listing.intent || {
                        make: null, model: null, country: listing.country,
                        maxMileage: listing.maxMileage || null, maxPrice: null,
                        fuel: listing.fuel && listing.fuel !== "any" ? listing.fuel : null,
                        transmission: listing.transmission && listing.transmission !== "any" ? listing.transmission : null,
                        yearFrom: listing.minYear || null,
                      }}
                      onPick={onChip}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // text bubble
  return (
    <div className="flex items-end gap-2 chat-enter-assistant">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)" }}>
        <Sparkles className="w-3.5 h-3.5 text-stone-950" />
      </div>
      <div className="max-w-[85%]">
        <div className="bubble-assistant rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line" style={{ color: "#f5f1ea" }}>
          {message.content}
        </div>
        {message.chips && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.chips.map((c, idx) => (
              <button key={c} onClick={() => onChip(c)}
                className="pill px-2.5 py-1 rounded-full text-[11px] chat-enter-assistant"
                style={{ animationDelay: `${0.2 + idx * 0.06}s` }}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CHAT CAR CARD (compact horizontal variant)
   ============================================================ */

function ChatCarCard({ rec, country, openCar, isShortlisted, toggleShortlist, isCompared, toggleCompare }) {
  const { car, score } = rec;
  return (
    <div className="card rounded-xl overflow-hidden">
      <div className="flex gap-2 p-2">
        <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 88, height: 64 }}>
          <CarIllustration gradient={car.gradient} body={car.body} className="h-full w-full" />
          <div className="absolute top-1 right-1 px-1 py-0 rounded-full text-[8px] font-bold backdrop-blur-md"
            style={{ background: "rgba(10,9,8,0.75)", color: "#fbbf24" }}>
            {score}%
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-xs font-semibold leading-tight truncate">{car.make} {car.model}</div>
          <div className="text-[9px] text-muted truncate">{car.body} · {car.fuel}</div>
          <div className="text-[10px] font-semibold amber-text mt-0.5">{formatPrice(car.priceMin, country)}+</div>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={() => window.open(buildAutoScout24Url(car.make, car.model, country), '_blank')} className="flex-1 px-1.5 py-0.5 rounded-md btn-primary text-[9px] flex items-center justify-center gap-0.5">
              View <ArrowRight className="w-2 h-2" />
            </button>
            <button onClick={() => toggleShortlist(car.id)}
              className="p-0.5 rounded-md btn-ghost"
              style={isShortlisted ? { background: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.4)" } : {}}>
              <Heart className={`w-2.5 h-2.5 ${isShortlisted ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <button onClick={() => toggleCompare(car.id)}
              className="p-0.5 rounded-md btn-ghost"
              style={isCompared ? { background: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.4)" } : {}}>
              <GitCompare className={`w-2.5 h-2.5 ${isCompared ? "amber-text" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODEL PAGE
   ============================================================ */

function ModelPage({ car, country, shortlist, compareList, toggleShortlist, toggleCompare, setView }) {
  const [showOffers, setShowOffers] = useState(false);
  const offers = SAMPLE_OFFERS[car.id] || [];
  const offersInCountry = offers.filter(o => o.country === country);
  const otherOffers = offers.filter(o => o.country !== country);
  const isShort = shortlist.includes(car.id);
  const isComp = compareList.includes(car.id);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 page-enter">
      <button onClick={() => setView("home")} className="flex items-center gap-1.5 text-sm text-muted hover:text-[#f5f1ea] mb-8 transition">
        <ArrowLeft className="w-4 h-4" /> Back to chat
      </button>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mb-10">
        <div className="card-static rounded-3xl overflow-hidden">
          <CarIllustration gradient={car.gradient} body={car.body} className="h-[440px]" />
          <div className="p-3 flex gap-2 overflow-x-auto" style={{ borderTop: "1px solid var(--border)" }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-16 w-24 shrink-0 rounded-lg bg-gradient-to-br ${car.gradient} ${i===0 ? "opacity-100 ring-1 ring-amber-400" : "opacity-40"} cursor-pointer hover:opacity-100 transition`} />
            ))}
          </div>
        </div>

        <div className="card-static rounded-3xl p-8 flex flex-col">
          <div className="text-xs uppercase tracking-[0.2em] amber-text mb-3">{car.body} · {car.generation}</div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-tight">
            {car.make}<br /><span className="italic font-light">{car.model}</span>
          </h1>
          <p className="mt-5 text-muted leading-relaxed">{car.summary}</p>

          <div className="mt-6 p-4 rounded-2xl"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold amber-text uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Why this might match
            </div>
            <div className="text-sm">{car.match}</div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-muted uppercase tracking-wider">Typical price range</div>
            <div className="font-display text-3xl font-semibold mt-1">
              <span className="amber-text">{formatPrice(car.priceMin, country)}</span> <span className="text-muted text-lg font-light italic">to</span> <span className="amber-text">{formatPrice(car.priceMax, country)}</span>
            </div>
          </div>

          <div className="mt-auto pt-6 flex flex-wrap gap-2">
            <button onClick={() => toggleShortlist(car.id)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 rounded-xl btn-ghost font-medium`}
              style={isShort ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" } : {}}>
              <Heart className={`w-4 h-4 ${isShort ? "fill-amber-400 text-amber-400" : ""}`} />
              {isShort ? "Shortlisted" : "Shortlist"}
            </button>
            <button onClick={() => toggleCompare(car.id)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 rounded-xl btn-ghost font-medium`}
              style={isComp ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24" } : {}}>
              <GitCompare className="w-4 h-4" />
              {isComp ? "Added to compare" : "Compare"}
            </button>
          </div>
        </div>
      </div>

      <div className="card-static rounded-3xl p-8 mb-10">
        <h2 className="font-display text-3xl font-semibold mb-2">Key <span className="italic font-light">facts</span></h2>
        <p className="text-muted text-sm mb-6">The numbers that matter, in plain language.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Fact icon={Car} label="Body type" value={car.body} />
          <Fact icon={Fuel} label="Fuel" value={car.fuel} />
          <Fact icon={Settings} label="Transmission" value={car.transmission} />
          <Fact icon={DoorOpen} label="Doors" value={car.doors} />
          <Fact icon={Users} label="Seats" value={car.seats} />
          <Fact icon={Zap} label="Engine" value={car.engine} />
          <Fact icon={Gauge} label="Power" value={car.power} />
          <Fact icon={TrendingUp} label="Performance" value={car.performance} />
          <Fact icon={Fuel} label="Fuel use" value={car.fuelUse} />
          <Fact icon={Zap} label="Torque" value={car.torque} />
        </div>
      </div>

      <div className="card-static rounded-3xl p-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="font-display text-3xl font-semibold">Offers for this <span className="italic font-light">model</span></h2>
          <div className="text-sm text-muted">{COUNTRIES[country].flag} Showing {COUNTRIES[country].name} first</div>
        </div>
        <p className="text-sm text-muted mb-6">Sample listings for prototype preview. In the live product, these come from partner feeds.</p>

        {!showOffers ? (
          <button onClick={() => setShowOffers(true)}
            className="w-full py-6 rounded-2xl btn-primary text-lg flex items-center justify-center gap-2">
            <Search className="w-5 h-5" /> Show me {offers.length} sample offers
          </button>
        ) : offers.length === 0 ? (
          <EmptyOffers car={car} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {[...offersInCountry, ...otherOffers].map((o) => (
              <OfferCard key={o.id} offer={o} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: "rgba(245,241,234,0.02)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 amber-text" />
        <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      </div>
      <div className="font-semibold text-lg">{value}</div>
    </div>
  );
}

function OfferCard({ offer, car }) {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <CarIllustration gradient={car.gradient} body={car.body} className="h-44" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-1 gap-2">
          <div>
            <div className="font-display text-2xl font-semibold amber-text">{formatPrice(offer.price, offer.country)}</div>
            <div className="text-xs text-muted">{car.make} {car.model} · {offer.trim}</div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 uppercase tracking-wider"
            style={{
              background: offer.sellerType === "Dealer" ? "rgba(251,191,36,0.1)" : "rgba(245,241,234,0.05)",
              border: `1px solid ${offer.sellerType === "Dealer" ? "rgba(251,191,36,0.3)" : "var(--border)"}`,
              color: offer.sellerType === "Dealer" ? "#fbbf24" : "var(--muted)"
            }}>
            {offer.sellerType}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
          <div><div className="text-muted uppercase tracking-wider text-[10px]">Year</div><div className="font-semibold mt-0.5">{offer.year}</div></div>
          <div><div className="text-muted uppercase tracking-wider text-[10px]">Mileage</div><div className="font-semibold mt-0.5">{offer.mileage.toLocaleString()} km</div></div>
          <div><div className="text-muted uppercase tracking-wider text-[10px]">Fuel</div><div className="font-semibold mt-0.5">{car.fuel}</div></div>
        </div>
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="w-3 h-3" /> {offer.location}
          </div>
          <button className="text-xs font-medium amber-text flex items-center gap-1 hover:gap-2 transition-all">
            Contact seller <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyOffers({ car }) {
  return (
    <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(245,241,234,0.02)", border: "1px dashed var(--border)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
        <Search className="w-7 h-7 amber-text" />
      </div>
      <div className="font-display text-2xl font-semibold mb-2">No offers nearby <span className="italic font-light">right now</span></div>
      <div className="text-sm text-muted max-w-md mx-auto">
        We couldn't find any {car.make} {car.model} listings in your selected area. Try expanding your search radius or checking nearby countries.
      </div>
      <button className="mt-5 px-5 py-2.5 rounded-xl btn-primary text-sm">Expand search</button>
    </div>
  );
}

/* ============================================================
   ADVANCED SEARCH MODAL
   ============================================================ */

/* ============================================================
   SHORTLIST DRAWER
   ============================================================ */

function ShortlistDrawer({ shortlist, toggleShortlist, clearShortlist, onClose, openCar, country }) {
  const cars = CAR_MODELS.filter(c => shortlist.includes(c.id));
  return (
    <div className="fixed inset-0 z-50 flex justify-end backdrop-blur-md" style={{ background: "rgba(10,9,8,0.8)" }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto fade-up" style={{ background: "#141210", borderLeft: "1px solid var(--border)", boxShadow: "-30px 0 80px rgba(0,0,0,0.7)" }} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 p-6 z-10" style={{ background: "rgba(20,18,16,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Your <span className="italic font-light">shortlist</span></h2>
              <p className="text-sm text-muted">{cars.length} car{cars.length !== 1 ? "s" : ""} saved</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full btn-ghost"><X className="w-5 h-5" /></button>
          </div>
          {cars.length > 0 && (
            <button onClick={clearShortlist}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
              <X className="w-3.5 h-3.5" /> Clear all {cars.length} car{cars.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
        <div className="p-4 space-y-3">
          {cars.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-12 h-12 mx-auto text-muted mb-4" />
              <div className="font-display text-2xl font-semibold mb-2">Nothing saved <span className="italic font-light">yet</span></div>
              <div className="text-sm text-muted">Tap the heart on any car to save it here.</div>
            </div>
          ) : cars.map(car => (
            <div key={car.id} className="card rounded-2xl overflow-hidden relative">
              <button onClick={() => toggleShortlist(car.id)}
                title="Remove from shortlist"
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition"
                style={{ background: "rgba(10,9,8,0.85)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", backdropFilter: "blur(8px)" }}>
                <X className="w-4 h-4" />
              </button>
              <CarIllustration gradient={car.gradient} body={car.body} className="h-32" />
              <div className="p-4">
                <div className="font-display text-lg font-semibold">{car.make} {car.model}</div>
                <div className="text-xs text-muted">{car.body} · {car.fuel}</div>
                <div className="font-semibold text-sm mt-2 amber-text">{formatPrice(car.priceMin, country)} – {formatPrice(car.priceMax, country)}</div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => window.open(buildAutoScout24Url(car.make, car.model, country), '_blank')}
                    className="flex-1 px-3 py-2 rounded-xl btn-primary text-sm"
                  >
                    View on AutoScout24 →
                  </button>
                  <button onClick={() => toggleShortlist(car.id)}
                    className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
                    style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cars.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl text-xs"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
              💡 Create an account to save your shortlist across devices.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COMPARE MODAL
   ============================================================ */

function CompareModal({ compareList, onClose, toggleCompare, clearCompare, country }) {
  const cars = CAR_MODELS.filter(c => compareList.includes(c.id));

  // Helper: extract first number from a string for numeric comparison
  const num = (v) => {
    if (typeof v === "number") return v;
    const m = String(v).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : null;
  };

  // Comparison rows with winner direction:
  //   "high" = higher is better (power, torque, seats, doors)
  //   "low"  = lower is better (price, fuelUse, performance/0–100 time)
  //   null   = qualitative, no winner
  const rows = [
    { label: "Price (from)", key: "priceMin", direction: "low", format: (c) => formatPrice(c.priceMin, country) },
    { label: "Body type", key: "body", direction: null },
    { label: "Fuel", key: "fuel", direction: null },
    { label: "Transmission", key: "transmission", direction: null },
    { label: "Engine", key: "engine", direction: null },
    { label: "Power", key: "power", direction: "high" },
    { label: "Performance (0–100)", key: "performance", direction: "low" },
    { label: "Fuel use", key: "fuelUse", direction: "low" },
    { label: "Torque", key: "torque", direction: "high" },
    { label: "Doors", key: "doors", direction: "high" },
    { label: "Seats", key: "seats", direction: "high" },
  ];

  // For each row, find the winning car id(s)
  // Only return a winner if exactly ONE car holds the strictly best value.
  // If multiple cars share the best value (ties), highlight nothing.
  const winnersFor = (row) => {
    if (!row.direction || cars.length < 2) return new Set();
    const values = cars.map(c => ({ id: c.id, n: num(c[row.key]) }));
    const valid = values.filter(v => v.n !== null);
    if (valid.length < 2) return new Set();
    const best = row.direction === "high"
      ? Math.max(...valid.map(v => v.n))
      : Math.min(...valid.map(v => v.n));
    const topHolders = valid.filter(v => v.n === best);
    // Strictly better only — skip ties
    if (topHolders.length !== 1) return new Set();
    return new Set([topHolders[0].id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(10,9,8,0.8)" }} onClick={onClose}>
      <div className="card-static rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto fade-up" onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 100px rgba(251,191,36,0.08)" }}>
        <div className="sticky top-0 p-6 z-10" style={{ background: "rgba(20,18,16,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Compare <span className="italic font-light">cars</span></h2>
              <p className="text-sm text-muted">Side-by-side specs · <span className="amber-text">★ Strictly better values highlighted in gold</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearCompare}
                className="text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-1.5"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
              <button onClick={onClose} className="p-2 rounded-full btn-ghost"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="grid gap-3" style={{ gridTemplateColumns: `180px repeat(${cars.length}, minmax(220px, 1fr))` }}>
            <div></div>
            {cars.map(car => (
              <div key={car.id} className="card-static rounded-2xl overflow-hidden relative">
                <button onClick={() => toggleCompare(car.id)}
                  title="Remove from comparison"
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(10,9,8,0.85)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5", backdropFilter: "blur(8px)" }}>
                  <X className="w-4 h-4" />
                </button>
                <CarIllustration gradient={car.gradient} body={car.body} className="h-32" />
                <div className="p-3">
                  <div className="font-display font-semibold leading-tight">{car.make} {car.model}</div>
                  <div className="text-xs text-muted mt-0.5">{car.generation}</div>
                </div>
              </div>
            ))}

            {rows.map((row) => {
              const winners = winnersFor(row);
              return (
                <React.Fragment key={row.key}>
                  <div className="text-xs uppercase tracking-wider text-muted font-semibold self-center">
                    {row.label}
                    {row.direction && (
                      <span className="ml-1 opacity-60 normal-case font-normal text-[10px]">
                        ({row.direction === "high" ? "↑ higher is better" : "↓ lower is better"})
                      </span>
                    )}
                  </div>
                  {cars.map(car => {
                    const isWinner = winners.has(car.id);
                    const value = row.format ? row.format(car) : car[row.key];
                    return (
                      <div key={car.id}
                        className="p-3 rounded-xl text-sm font-medium relative transition"
                        style={isWinner ? {
                          background: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(217,119,6,0.10))",
                          border: "1px solid rgba(251,191,36,0.55)",
                          boxShadow: "0 0 20px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                          color: "#fde68a"
                        } : {
                          background: "rgba(245,241,234,0.02)",
                          border: "1px solid var(--border)"
                        }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={isWinner ? "font-semibold" : ""}>{value}</span>
                          {isWinner && (
                            <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", color: "#1a0f00" }}>
                              <Star className="w-2.5 h-2.5 fill-current" /> Best
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PASSWORD RESET MODAL
   ============================================================ */

function PasswordResetModal({ accessToken, refreshToken, onDone }) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("idle"); // idle | loading | success | expired | failed

  React.useEffect(() => {
    if (!accessToken) { setStatus("expired"); return; }
    // "__from_event__" means PASSWORD_RECOVERY already established the session.
    if (accessToken === "__from_event__") return;
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || "" })
      .then(({ error }) => { if (error) setStatus("expired"); })
      .catch(() => setStatus("expired"));
  }, [accessToken, refreshToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setStatus("loading");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setStatus("failed"); return; }
    setStatus("success");
    setTimeout(() => onDone(), 2000);
  };

  const backdropStyle = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(10,9,8,0.95)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "1rem",
  };
  const cardStyle = {
    width: "100%", maxWidth: 448,
    boxShadow: "0 0 60px rgba(251,191,36,0.18), 0 30px 80px rgba(0,0,0,0.7)",
    borderRadius: "1.5rem",
    padding: "2.5rem 2rem",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
  };

  if (status === "expired") return (
    <div style={backdropStyle}>
      <div className="card-static" style={cardStyle}>
        <Logo size={44} showText tagline={false} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "1.25rem", color: "#f5f1ea", marginBottom: "0.5rem" }}>
            This reset link has expired.
          </p>
          <p style={{ color: "#a09070", fontSize: "0.875rem" }}>Please request a new password reset.</p>
        </div>
        <button onClick={onDone} className="btn-primary" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.95rem" }}>
          Go to FindMyCar
        </button>
      </div>
    </div>
  );

  if (status === "success") return (
    <div style={backdropStyle}>
      <div className="card-static" style={cardStyle}>
        <Logo size={44} showText tagline={false} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#4ade80", fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>Password updated successfully.</p>
          <p style={{ color: "#a09070", fontSize: "0.875rem" }}>You are now logged in.</p>
        </div>
      </div>
    </div>
  );

  if (status === "failed") return (
    <div style={backdropStyle}>
      <div className="card-static" style={cardStyle}>
        <Logo size={44} showText tagline={false} />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f87171", fontWeight: 600, fontSize: "1rem", marginBottom: "0.25rem" }}>Failed to update password.</p>
          <p style={{ color: "#a09070", fontSize: "0.875rem" }}>Please request a new reset link.</p>
        </div>
        <button onClick={onDone} className="btn-primary" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.95rem" }}>
          Back to site
        </button>
      </div>
    </div>
  );

  return (
    <div style={backdropStyle}>
      <div className="card-static" style={cardStyle}>
        <Logo size={44} showText tagline={false} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "1.4rem", color: "#f5f1ea", marginBottom: "0.4rem" }}>
            Set your new password
          </p>
          <p style={{ color: "#a09070", fontSize: "0.875rem" }}>
            Choose a strong password for your FindMyCar account.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="password"
            className="input-dark"
            placeholder="New password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.95rem" }}
          />
          <input
            type="password"
            className="input-dark"
            placeholder="Confirm new password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.95rem" }}
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: "0.825rem", textAlign: "center" }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={status === "loading"}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", fontSize: "0.95rem", marginTop: "0.25rem", opacity: status === "loading" ? 0.6 : 1 }}
          >
            {status === "loading" ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   ACCOUNT MODAL
   ============================================================ */

function AccountModal({ onClose, onSignUp, onLogin, onResetPassword, initialMode = "signup" }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setError("");
  }, [initialMode]);

  const runSignUp = async () => {
    setError("");
    setMessage("");
    if (!name || name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await onSignUp({ name: name.trim(), email: email.trim(), password });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setMessage(`We sent a confirmation email to ${email.trim()}. Please check your inbox and click the link before logging in.`);
  };

  const runLogin = async () => {
    setError("");
    setMessage("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    const result = await onLogin({ email: email.trim(), password });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  const runResetPassword = async () => {
    setError("");
    setMessage("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const result = await onResetPassword(email.trim());
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setMessage("Password reset email sent. Check your inbox.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(10,9,8,0.85)" }} onClick={onClose}>
      <div className="card-static rounded-3xl max-w-md w-full fade-up" onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 120px rgba(251,191,36,0.15)" }}>
        <div className="p-10 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)", boxShadow: "0 0 60px rgba(251,191,36,0.5)" }}>
            <Sparkles className="w-9 h-9 text-stone-950" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <button onClick={() => setMode("signup")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${mode === "signup" ? "bg-amber-400 text-stone-950" : "text-muted hover:text-amber-300"}`}>
              Sign up
            </button>
            <button onClick={() => setMode("login")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${mode === "login" ? "bg-amber-400 text-stone-950" : "text-muted hover:text-amber-300"}`}>
              Log in
            </button>
            <button onClick={() => setMode("reset")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${mode === "reset" ? "bg-amber-400 text-stone-950" : "text-muted hover:text-amber-300"}`}>
              Forgot password?
            </button>
          </div>

          {mode === "signup" && (
            <>
              <div className="grid gap-4">
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="Your full name" />
                </div>
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="you@example.com" />
                </div>
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="At least 8 characters" />
                </div>
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="Repeat your password" />
                </div>
              </div>
              <button onClick={runSignUp} disabled={loading}
                className="mt-6 w-full py-3.5 rounded-xl btn-primary font-semibold">
                {loading ? "Creating account..." : "Create account"}
              </button>
            </>
          )}

          {mode === "login" && (
            <>
              <div className="grid gap-4">
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="you@example.com" />
                </div>
                <div className="text-left">
                  <label className="text-sm text-muted mb-2 block">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="Your password" />
                </div>
              </div>
              <button onClick={runLogin} disabled={loading}
                className="mt-6 w-full py-3.5 rounded-xl btn-primary font-semibold">
                {loading ? "Signing in..." : "Sign in"}
              </button>
              <button onClick={() => setMode("reset")} className="mt-4 text-sm text-muted hover:text-amber-300 transition">Forgot password?</button>
            </>
          )}

          {mode === "reset" && (
            <>
              <div className="text-left">
                <label className="text-sm text-muted mb-2 block">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-2xl input-dark" placeholder="you@example.com" />
              </div>
              <button onClick={runResetPassword} disabled={loading}
                className="mt-6 w-full py-3.5 rounded-xl btn-primary font-semibold">
                {loading ? "Sending link..." : "Send reset link"}
              </button>
            </>
          )}

          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          {message && <div className="mt-4 text-sm text-amber-200">{message}</div>}
          <button onClick={onClose} className="mt-6 text-sm text-muted hover:text-amber-300">Close</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message }) {
  return (
    <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-3xl px-5 py-3 text-sm font-medium shadow-2xl" style={{
      background: type === "success" ? "linear-gradient(135deg, #fbbf24, #d97706)" : "rgba(220,38,38,0.95)",
      color: type === "success" ? "#0a0f00" : "#ffffff",
      minWidth: "320px",
      textAlign: "center",
    }}>
      {message}
    </div>
  );
}

/* ============================================================
   COUNTRY PICKER
   ============================================================ */

function CountryPicker({ country, setCountry, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(10,9,8,0.8)" }} onClick={onClose}>
      <div className="card-static rounded-3xl max-w-sm w-full p-6 fade-up" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl font-semibold mb-4">Choose your <span className="italic font-light">country</span></h2>
        <div className="space-y-2">
          {Object.values(COUNTRIES).map(c => (
            <button key={c.code} onClick={() => setCountry(c.code)}
              className="w-full flex items-center gap-3 p-3 rounded-xl btn-ghost"
              style={country === c.code ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.4)" } : {}}>
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted">Prices in {c.currency}</div>
              </div>
              {country === c.code && <Check className="w-5 h-5 amber-text" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LANGUAGE PICKER
   ============================================================ */

function LanguagePicker({ language, setLanguage, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(10,9,8,0.8)" }} onClick={onClose}>
      <div className="card-static rounded-3xl max-w-sm w-full p-6 fade-up" onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(251,191,36,0.1)" }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-2xl font-semibold">Choose your <span className="italic font-light">language</span></h2>
          <button onClick={onClose} className="p-1.5 rounded-full btn-ghost"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-muted mb-5">Changes the entire interface to your selected language.</p>
        <div className="space-y-2">
          {Object.values(LANGUAGES).map(l => {
            const isActive = language === l.code;
            return (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                className="w-full flex items-center gap-3 p-3 rounded-xl btn-ghost transition"
                style={isActive ? { background: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.4)" } : {}}>
                <span className="text-2xl">{l.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-xs text-muted">{l.code}</div>
                </div>
                {isActive && <Check className="w-5 h-5 amber-text" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CHAT HISTORY MODAL
   ============================================================ */

function ChatHistoryModal({ sessions, onRestore, onDelete, onClose }) {
  const formatRelative = (ts) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(10,9,8,0.8)" }} onClick={onClose}>
      <div className="card-static rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col fade-up" onClick={e => e.stopPropagation()}
        style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 100px rgba(251,191,36,0.08)" }}>
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #fbbf24, #92400e)", boxShadow: "0 0 20px rgba(251,191,36,0.4)" }}>
              <Bookmark className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Your <span className="italic font-light">conversations</span></h2>
              <p className="text-xs text-muted">Pick up where you left off — saved for 10 days.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full btn-ghost"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 mx-auto text-muted mb-4" />
              <div className="font-display text-xl font-semibold mb-2">No saved conversations <span className="italic font-light">yet</span></div>
              <div className="text-sm text-muted">When you start a new chat, your previous one will be saved here.</div>
            </div>
          ) : sessions.map(session => {
            const userCount = session.messages.filter(m => m.role === "user").length;
            const lastUserMsg = [...session.messages].reverse().find(m => m.role === "user");
            return (
              <div key={session.id} className="card rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}>
                  <MessageSquare className="w-4 h-4 amber-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-base leading-tight truncate">{session.title}</div>
                  {lastUserMsg && lastUserMsg.content !== session.title && (
                    <div className="text-xs text-muted mt-1 line-clamp-1">{lastUserMsg.content}</div>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-muted mt-2">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {userCount} message{userCount !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatRelative(session.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onRestore(session.id)}
                    className="px-3 py-2 rounded-xl btn-primary text-xs flex items-center gap-1.5">
                    Resume <ArrowRight className="w-3 h-3" />
                  </button>
                  <button onClick={() => onDelete(session.id)} title="Delete conversation"
                    className="p-2 rounded-xl"
                    style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length > 0 && (
          <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs text-muted text-center">
              💡 Conversations are stored locally for 10 days. Sign up to keep them across devices.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   STATIC PAGES
   ============================================================ */

function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 page-enter">
      <div className="text-xs uppercase tracking-[0.2em] amber-text mb-4 stagger" style={{ "--stagger-index": 0 }}>About</div>
      <h1 className="font-display text-5xl md:text-7xl font-semibold mb-8 leading-[0.95] tracking-tight stagger" style={{ "--stagger-index": 1 }}>
        A friendlier way<br /><span className="italic font-light">to find a car.</span>
      </h1>
      <p className="text-xl text-muted leading-relaxed mb-14 max-w-3xl stagger" style={{ "--stagger-index": 2 }}>
        FindMyCar was built for the 90% of people who don't know a turbocharger from a timing belt — and who shouldn't have to. We think buying a car should feel like getting advice from a smart friend, not sifting through thousands of classifieds.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mb-14">
        {[
          { icon: Sparkles, title: "AI-guided", text: "Describe your life. We'll translate it into cars that actually make sense for you." },
          { icon: Shield, title: "Unbiased", text: "We don't take commissions on sales. Recommendations are based on fit, not profit." },
          { icon: Globe, title: "European", text: "Built for NL, BE, DE and PL — with local currencies, distances, and regulations in mind." },
        ].map((f, i) => (
          <div key={i} className="card rounded-3xl p-7 stagger" style={{ "--stagger-index": 3 + i }}>
            <f.icon className="w-9 h-9 amber-text mb-4" />
            <div className="font-display text-2xl font-semibold mb-2">{f.title}</div>
            <div className="text-sm text-muted leading-relaxed">{f.text}</div>
          </div>
        ))}
      </div>
      <h2 className="font-display text-4xl font-semibold mb-5 stagger" style={{ "--stagger-index": 6 }}>Our <span className="italic font-light">philosophy</span></h2>
      <p className="text-muted leading-relaxed text-lg stagger" style={{ "--stagger-index": 7 }}>
        Most car websites assume you already know what you want. They throw filters at you and make you wade through thousands of listings. We flip that on its head: first, we help you figure out <em className="amber-text">what</em> to buy. Only then do we show you <em className="amber-text">where</em> to buy it.
      </p>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    { q: "How is this different from AutoScout24 or mobile.de?", a: "Those sites are built for people who already know what car they want. We recommend models first based on what you actually need — then show you offers only after you've picked a model." },
    { q: "Is FindMyCar free to use?", a: "Yes, completely free. We don't charge users anything, and we don't take commissions on sales." },
    { q: "Where do your listings come from?", a: "In this prototype, listings are sample data. In the live product, they'll come from partner dealer feeds and private listings across NL, BE, DE and PL." },
    { q: "Do I need an account?", a: "No — you can browse and search freely. After a few searches we'll suggest creating one so you can save your shortlist and search history across devices." },
    { q: "Which countries do you support?", a: "Netherlands, Belgium, Germany and Poland at launch. France and others will follow." },
    { q: "How accurate are your recommendations?", a: "Our AI parses your description and matches it to car models based on body type, fuel, price, and common use cases. It's guidance, not gospel — always test-drive before you buy." },
  ];
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 page-enter">
      <div className="text-xs uppercase tracking-[0.2em] amber-text mb-4 stagger" style={{ "--stagger-index": 0 }}>Help</div>
      <h1 className="font-display text-5xl md:text-6xl font-semibold mb-12 leading-tight tracking-tight stagger" style={{ "--stagger-index": 1 }}>
        Frequently <span className="italic font-light">asked.</span>
      </h1>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="card-static rounded-2xl overflow-hidden stagger" style={{ "--stagger-index": 2 + i }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="font-display font-semibold text-lg pr-4">{item.q}</div>
              <ChevronDown className={`w-5 h-5 amber-text transition shrink-0 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-6 pb-6 text-muted leading-relaxed">{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSend = name.trim() && email.trim() && message.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSend) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to send message. Please try again later.");
        return;
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 page-enter">
      <div className="text-xs uppercase tracking-[0.2em] amber-text mb-4">Get in touch</div>
      <h1 className="font-display text-5xl md:text-6xl font-semibold mb-4 leading-tight tracking-tight">
        Have questions or feedback?
      </h1>
      <p className="text-lg text-muted max-w-3xl mb-14">
        Reach out to our founders directly.
      </p>

      <div className="grid gap-6 lg:grid-cols-2 mb-12">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.15)" }}>
              <Sparkles className="w-5 h-5 amber-text" />
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">Fryderyk Strycharz</div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted mt-1">CEO & Founder</div>
            </div>
          </div>
          <div className="space-y-4 text-sm text-muted">
            <a href="mailto:06fryderyk@gmail.com" className="block transition hover:text-amber-300">
              06fryderyk@gmail.com
            </a>
            <a href="tel:+48798353930" className="block transition hover:text-amber-300">
              +48 798 353 930
            </a>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.15)" }}>
              <Star className="w-5 h-5 amber-text" />
            </div>
            <div>
              <div className="font-display text-2xl font-semibold">Mykhailo Shchur</div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted mt-1">Founder</div>
            </div>
          </div>
          <div className="space-y-4 text-sm text-muted">
            <a href="mailto:m.shchur2006@gmail.com" className="block transition hover:text-amber-300">
              m.shchur2006@gmail.com
            </a>
            <a href="tel:+380503153863" className="block transition hover:text-amber-300">
              +380 50 315 3863
            </a>
          </div>
        </div>
      </div>

      {!sent ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.2)]">
          <div className="text-sm uppercase tracking-[0.2em] amber-text font-semibold mb-6">Send a message</div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-2xl input-dark"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl input-dark"
                placeholder="you@example.com"
              />
            </Field>
          </div>
          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={500}
              className="w-full p-4 rounded-2xl input-dark"
              placeholder="How can we help you?"
            />
          </Field>
          <div className="flex items-center justify-between text-xs text-muted mt-2">
            <span>All fields required.</span>
            <span>{message.length}/500</span>
          </div>
          {error && (
            <div className="text-sm text-red-300 mb-4">{error}</div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className="mt-6 w-full rounded-2xl px-6 py-4 font-semibold uppercase tracking-[0.12em] transition"
            style={{
              background: canSend ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" : "rgba(251,191,36,0.2)",
              color: canSend ? "#1a0f00" : "#a48a42",
              border: "1px solid rgba(251,191,36,0.25)",
              cursor: canSend ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Sending..." : "Send message"}
          </button>
        </div>
      ) : (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_120px_rgba(0,0,0,0.2)]">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)" }}
          >
            <Check className="w-8 h-8 amber-text" />
          </div>
          <div className="font-display text-3xl font-semibold mb-3">Message sent.</div>
          <p className="text-muted">We'll get back to you within 24 hours.</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm text-white/90 space-y-3">
      <span className="font-semibold text-sm text-white/90">{label}</span>
      {children}
    </label>
  );
}

/* ============================================================
   COST CALCULATOR — total cost of ownership across 4 countries
   ============================================================ */

// CALC_DATA + calculateOwnership now live in lib/ownership.js (shared with the
// hero-strip Cost Calculator modal). Imported at the top of this file.

function formatEuro(n) {
  // Legacy helper — kept for backward compatibility. CostCalculator uses formatMoney internally.
  return "€" + Math.round(n).toLocaleString("en-US");
}

// The Cost Calculator is now an inline home section — see
// app/components/CostCalculatorSection.jsx (single source, real lib/ownership logic).

function LegalPage({ title, kind }) {
  const sections = kind === "privacy" ? [
    ["What we collect", "We collect only what's needed to give you good recommendations: your search queries, saved cars, and (if you sign up) your email and country preference."],
    ["How we use it", "To improve your recommendations, remember your recent searches for up to 10 days, and make the service better for everyone."],
    ["Who we share with", "Nobody. We don't sell your data. We don't share it with advertisers or dealers without your explicit consent."],
    ["Your rights", "Under GDPR you can access, export, or delete your data anytime. Email us at 06fryderyk@gmail.com."],
    ["Cookies", "We use strictly necessary cookies to keep you logged in and remember your preferences. No tracking cookies unless you opt in."],
  ] : [
    ["Using the service", "FindMyCar is a free tool to help you discover car models. You may use it for personal, non-commercial purposes."],
    ["Recommendations are guidance", "Our AI recommendations are suggestions, not professional advice. Always test-drive and inspect any car before buying."],
    ["Third-party listings", "Listings shown may come from third parties. We're not responsible for the accuracy of prices, availability, or claims made by sellers."],
    ["Account responsibilities", "Keep your login credentials safe. You're responsible for activity on your account."],
    ["Changes", "We may update these terms from time to time. Material changes will be announced in advance."],
  ];
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 page-enter">
      <div className="text-xs uppercase tracking-[0.2em] amber-text mb-4 stagger" style={{ "--stagger-index": 0 }}>Legal</div>
      <h1 className="font-display text-5xl md:text-6xl font-semibold mb-4 tracking-tight stagger" style={{ "--stagger-index": 1 }}>{title}</h1>
      <p className="text-muted mb-12 stagger" style={{ "--stagger-index": 2 }}>Last updated: April 2026 · Prototype placeholder content.</p>
      <div className="space-y-10">
        {sections.map(([h, t], i) => (
          <div key={i} className="stagger" style={{ "--stagger-index": 3 + i }}>
            <h2 className="font-display text-2xl font-semibold mb-3"><span className="amber-text">{String(i+1).padStart(2, "0")}</span> &nbsp; {h}</h2>
            <p className="text-muted leading-relaxed">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function Footer({ setView, smoothScrollTo, smoothNavigate, t }) {
  return (
    <footer className="mt-20 relative" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb" style={{ width: 700, height: 400, bottom: -200, left: "50%", transform: "translateX(-50%)", background: "radial-gradient(ellipse, rgba(251,191,36,0.10), transparent 70%)", filter: "blur(100px)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-12 mb-14">
          {/* Column 1: Brand */}
          <div>
            <div className="mb-4">
              <Logo size={48} />
            </div>
            <p className="text-sm text-muted leading-relaxed">
              AI-powered car advisor for NL, BE, DE, and PL. Find the right car in minutes.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold mb-5" style={{ color: "#f5f1ea" }}>Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => smoothNavigate ? smoothNavigate("home") : setView("home")} className="text-sm text-muted hover:text-amber-400 transition">
                  Discover
                </button>
              </li>
              <li>
                <button onClick={() => smoothNavigate ? smoothNavigate("about") : setView("about")} className="text-sm text-muted hover:text-amber-400 transition">
                  How it works
                </button>
              </li>
              <li>
                <button onClick={() => smoothScrollTo ? smoothScrollTo("home-calculator", "home") : setView("home")} className="text-sm text-muted hover:text-amber-400 transition">
                  Cost Calculator
                </button>
              </li>
              <li>
                <button onClick={() => smoothScrollTo ? smoothScrollTo("home-faq", "home") : setView("faq")} className="text-sm text-muted hover:text-amber-400 transition">
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-sm font-bold mb-5" style={{ color: "#f5f1ea" }}>Legal</h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => smoothNavigate ? smoothNavigate("privacy") : setView("privacy")} className="text-sm text-muted hover:text-amber-400 transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => smoothNavigate ? smoothNavigate("terms") : setView("terms")} className="text-sm text-muted hover:text-amber-400 transition">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setView("cookies")} className="text-sm text-muted hover:text-amber-400 transition">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact — founder business cards */}
        <div className="mb-14">
          <h3 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#f5f1ea" }}>
            Contact
            <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf24" }} />
          </h3>
          <div className="grid gap-5 md:grid-cols-2 max-w-4xl">
            {[
              { icon: Sparkles, name: "Fryderyk Strycharz", role: "CEO & Founder", email: "06fryderyk@gmail.com", phone: "+48 798 353 930", phoneHref: "+48798353930" },
              { icon: Star, name: "Mykhailo Shchur", role: "Founder", email: "m.shchur2006@gmail.com", phone: "+380 50 315 3863", phoneHref: "+380503153863" },
            ].map((p) => (
              <div key={p.name} className="rounded-3xl p-6"
                style={{ background: "linear-gradient(180deg, #161310 0%, #0f0d0b 100%)", border: "1px solid var(--border)", boxShadow: "inset 0 1px 0 rgba(251,191,36,0.07)" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.28), rgba(146,64,14,0.18))", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <p.icon className="w-4.5 h-4.5 amber-text" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold" style={{ color: "#f9fafb" }}>{p.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted mt-0.5">{p.role}</div>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm text-muted">
                  <a href={`mailto:${p.email}`} className="block hover:text-amber-400 transition">{p.email}</a>
                  <a href={`tel:${p.phoneHref}`} className="block hover:text-amber-400 transition">{p.phone}</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>© 2026 FindMyCar · All rights reserved.</span>
            <div className="flex items-center gap-3">
              <span>NL</span>
              <span>BE</span>
              <span>DE</span>
              <span>PL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 text-sm text-muted hover:text-amber-400 transition group">
      {Icon && <Icon className="w-3.5 h-3.5 group-hover:amber-text transition" />}
      <span>{children}</span>
    </button>
  );
}
