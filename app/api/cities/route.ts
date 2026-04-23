const cities = require("all-the-cities");

export async function GET() {
  const germanCities = Array.from(
    new Set(
      cities
        .filter((city: { country: string; name: string }) => city.country === "DE")
        .map((city: { name: string }) => city.name)
    )
  ).sort((left, right) => left.localeCompare(right, "de"));

  return Response.json(germanCities);
}