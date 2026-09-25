export const FARMER_QUOTES: string[] = [
  "To sow a seed is to believe in tomorrow.",
  "Agriculture is the most healthful, most useful, and most noble work.",
  "Hard work in the field brings sweet fruit at harvest.",
  "Farming is not just a job — it's a way of life.",
  "Healthy soil, happy crop, prosperous farmer.",
  "Every seed planted is a step towards feeding the world.",
  "Nature works with the farmer who cares for the land.",
  "Patience in planting leads to joy in harvesting.",
  "Small daily care in the field leads to great harvests.",
  "The farmer makes the earth smile with green crops."
];

export function getRandomQuote(): string {
  const index = Math.floor(Math.random() * FARMER_QUOTES.length);
  return FARMER_QUOTES[index];
}
