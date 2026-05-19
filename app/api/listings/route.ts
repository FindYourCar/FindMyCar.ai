import { NextResponse } from "next/server";
import type { CarSearchFilters } from "@/lib/searchFilters";

type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  year: number;
  mileageKm: number;
  fuel: string;
  transmission: string;
  location: string;
  imageUrl: string;
  listingUrl: string;
  source: string;
};

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "BMW 330i M Sport",
    price: 23950,
    currency: "EUR",
    year: 2020,
    mileageKm: 84200,
    fuel: "petrol",
    transmission: "automatic",
    location: "Amsterdam, Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    listingUrl: "https://www.autoscout24.com/",
    source: "AutoScout24",
  },
  {
    id: "2",
    title: "Audi A4 Avant 40 TFSI",
    price: 25900,
    currency: "EUR",
    year: 2021,
    mileageKm: 67800,
    fuel: "petrol",
    transmission: "automatic",
    location: "Rotterdam, Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
    listingUrl: "https://www.autoscout24.com/",
    source: "AutoScout24",
  },
  {
    id: "3",
    title: "Mercedes-Benz C 200 AMG Line",
    price: 27990,
    currency: "EUR",
    year: 2019,
    mileageKm: 91500,
    fuel: "petrol",
    transmission: "automatic",
    location: "Utrecht, Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    listingUrl: "https://www.autoscout24.com/",
    source: "AutoScout24",
  },
  {
    id: "4",
    title: "Volkswagen Golf 1.5 eTSI",
    price: 21950,
    currency: "EUR",
    year: 2020,
    mileageKm: 73400,
    fuel: "hybrid",
    transmission: "automatic",
    location: "The Hague, Netherlands",
    imageUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    listingUrl: "https://www.autoscout24.com/",
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
      filters.maxPrice == null || listing.price <= filters.maxPrice;

    const matchesMileage =
      filters.maxMileage == null || listing.mileageKm <= filters.maxMileage;

    const matchesFuel =
      filters.fuel === "any" || listing.fuel === filters.fuel;

    const matchesTransmission =
      filters.transmission === "any" ||
      listing.transmission === filters.transmission;

    const matchesCountry =
      !filters.country ||
      listing.location.toLowerCase().includes(
        filters.country === "NL"
          ? "netherlands"
          : filters.country === "BE"
          ? "belgium"
          : filters.country === "DE"
          ? "germany"
          : "poland"
      );

    return (
      matchesMake &&
      matchesModel &&
      matchesPrice &&
      matchesMileage &&
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