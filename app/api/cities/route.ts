import { germanCities } from "../../data/germanCities";

export async function GET() {
  return Response.json(germanCities);
}