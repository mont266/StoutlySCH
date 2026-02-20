const currencyMap: { [key: string]: string } = {
  'GB': '£', // Great Britain
  'IE': '€', // Ireland
  'US': '$', // United States
  // Add more as needed
};

export const formatCurrency = (price: number, countryCode: string | undefined): string => {
  const symbol = countryCode ? currencyMap[countryCode.toUpperCase()] || '£' : '£'; // Default to £
  return `${symbol}${price.toFixed(2)}`;
};
