import * as Localization from "expo-localization";

export const getCurrencyFromLocale = (localeStr) => {
  if (!localeStr) return "USD";

  const parts = localeStr.replace("-", "_").split("_");
  const region = parts[1] ? parts[1].toUpperCase() : null;

  if (region === "CH") return "CHF";
  if (region === "EU") return "EUR";

  return "USD";
};

export const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol", // <<< THIS FIXES US$ → $
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(amount);
  } catch (e) {
    const symbol =
      currency === "EUR" ? "€ " : currency === "CHF" ? "CHF " : "$ ";
    return `${symbol}${Number(amount).toFixed(2)}`;
  }
};
