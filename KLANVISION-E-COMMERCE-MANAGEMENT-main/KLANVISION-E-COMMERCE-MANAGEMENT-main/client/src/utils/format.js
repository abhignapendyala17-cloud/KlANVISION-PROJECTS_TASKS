const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

export function formatPrice(amount) {
  return inrFormatter.format(Number(amount) || 0);
}
