export function formatPrice(value) {
  if (value === null || value === undefined) return "Price unavailable";

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}
