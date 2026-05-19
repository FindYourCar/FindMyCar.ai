export type CountryCode = "NL" | "BE" | "DE" | "PL";

export type FuelType =
  | "any"
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric";

export type TransmissionType = "any" | "automatic" | "manual";

export type CarSearchFilters = {
  make: string;
  model: string;
  maxPrice: number | null;
  country: CountryCode;
  fuel: FuelType;
  transmission: TransmissionType;
  maxMileage: number | null;
};

export const COUNTRY_OPTIONS: { value: CountryCode; label: string }[] = [
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "DE", label: "Germany" },
  { value: "PL", label: "Poland" },
];

export const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "any", label: "Any fuel" },
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in Hybrid" },
  { value: "electric", label: "Electric" },
];

export const TRANSMISSION_OPTIONS: {
  value: TransmissionType;
  label: string;
}[] = [
  { value: "any", label: "Any transmission" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
];

export const DEFAULT_SEARCH_FILTERS: CarSearchFilters = {
  make: "",
  model: "",
  maxPrice: null,
  country: "NL",
  fuel: "any",
  transmission: "any",
  maxMileage: null,
};