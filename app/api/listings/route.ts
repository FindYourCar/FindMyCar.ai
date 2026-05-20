import { NextResponse } from "next/server";
import type { CarSearchFilters } from "@/lib/searchFilters";

type Listing = {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  fuel: string;
  transmission: string;
  country: "NL" | "BE" | "DE" | "PL";
  imageUrl: string;
  listingUrl: string;
  source: string;
};

function buildAutoScoutUrl(filters: {
  country: "NL" | "BE" | "DE" | "PL";
  make: string;
  model?: string;
  maxPrice?: number | null;
  minYear?: number | null;
  maxMileage?: number | null;
}) {
  const domainMap: Record<"NL" | "BE" | "DE" | "PL", string> = {
    NL: "www.autoscout24.nl",
    BE: "www.autoscout24.be",
    DE: "www.autoscout24.de",
    PL: "www.autoscout24.pl",
  };

  const makeSlug = filters.make
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

  const modelSlug = filters.model
    ? `${filters.model
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")}-(all)`
    : "";

  const domain = domainMap[filters.country] || "www.autoscout24.com";
  const params = new URLSearchParams();

  params.set("atype", "C");
  params.set("desc", "0");
  params.set("sort", "standard");
  params.set("source", "detailsearch");
  params.set("ustate", "N,U");
  params.set("powertype", "kw");

  if (filters.minYear != null) {
    params.set("fregfrom", String(filters.minYear));
  }

  if (filters.maxMileage != null) {
    params.set("kmto", String(filters.maxMileage));
  }

  if (filters.maxPrice != null) {
    params.set("priceto", String(filters.maxPrice));
  }

  const path = modelSlug ? `${makeSlug}/${modelSlug}` : makeSlug;
  return `https://${domain}/lst/${path}?${params.toString()}`;
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "BMW 3 Series",
    subtitle: "Balanced premium daily driver with strong comfort and sporty handling.",
    priceLabel: "Up to €24,000",
    fuel: "petrol",
    transmission: "automatic",
    country: "NL",
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    listingUrl: buildAutoScoutUrl({
      country: "NL",
      make: "BMW",
      model: "3 Series",
    }),
    source: "AutoScout24",
  },
  {
    id: "2",
    title: "Audi A4 Avant",
    subtitle: "Comfortable motorway car with clean styling and strong everyday practicality.",
    priceLabel: "Up to €26,000",
    fuel: "petrol",
    transmission: "automatic",
    country: "NL",
    imageUrl:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
    listingUrl: buildAutoScoutUrl({
      country: "NL",
      make: "Audi",
      model: "A4",
    }),
    source: "AutoScout24",
  },
  {
    id: "3",
    title: "Mercedes-Benz C-Class",
    subtitle: "Refined executive option with premium feel and smooth long-distance driving.",
    priceLabel: "Up to €28,000",
    fuel: "petrol",
    transmission: "automatic",
    country: "NL",
    imageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    listingUrl: buildAutoScoutUrl({
      country: "NL",
      make: "Mercedes-Benz",
      model: "C-Class",
    }),
    source: "AutoScout24",
  },
  {
    id: "4",
    title: "Volkswagen Golf",
    subtitle: "Safe all-round hatchback with good efficiency and easy ownership costs.",
    priceLabel: "Up to €22,000",
    fuel: "hybrid",
    transmission: "automatic",
    country: "NL",
    imageUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    listingUrl: buildAutoScoutUrl({
      country: "NL",
      make: "Volkswagen",
      model: "Golf",
    }),
    source: "AutoScout24",
  },
];

function filterListings(filters: CarSearchFilters) {
  return MOCK_LISTINGS.filter((listing) => {
    const matchesMake =
      !filters.make ||
      listing.title.toLowerCase().includes(filters.make.toLowerCase());

    const matchesModel =
      !filters.model ||
      listing.title.toLowerCase().includes(filters.model.toLowerCase());

    const matchesPrice =
      filters.maxPrice == null ||
      Number(listing.priceLabel.replace(/[^\d]/g, "")) <= filters.maxPrice;

    const matchesFuel =
      filters.fuel === "any" || listing.fuel === filters.fuel;

    const matchesTransmission =
      filters.transmission === "any" ||
      listing.transmission === filters.transmission;

    const matchesCountry =
      !filters.country || listing.country === filters.country;

    return (
      matchesMake &&
      matchesModel &&
      matchesPrice &&
      matchesFuel &&
      matchesTransmission &&
      matchesCountry
    );
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Listings route is working",
    listings: MOCK_LISTINGS,
    count: MOCK_LISTINGS.length,
  });
}

export async function POST(req: Request) {
  try {
    const filters = (await req.json()) as CarSearchFilters;
    const results = filterListings(filters);

    return NextResponse.json({
      success: true,
      filters,
      count: results.length,
      listings: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch listings",
      },
      { status: 500 }
    );
  }
}