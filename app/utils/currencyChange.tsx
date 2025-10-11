import i18n from "../translation/i18n";

// Exchange rates (USD → target currency)
const exchangeRates = {
  USD: 1,
  EUR: 0.8646,
};

// Map i18n language to locale & currency
const localeCurrencyMap = {
  en: { locale: "en-US", currency: "USD" },
  de: { locale: "de-DE", currency: "EUR" },
  fr: { locale: "fr-FR", currency: "EUR" },
  it: { locale: "it-IT", currency: "EUR" },
};

/**
 * Format USD value according to current app language
 * @param {number|string} amount - can be number or string with currency symbol
 * @param {string} language - optional, defaults to i18n.language
 * @returns {string} formatted currency
 */
export const formatCurrency = (amount, language = i18n.language) => {
  const langKey = language.toLowerCase();
  const { locale, currency: targetCurrency } =
    localeCurrencyMap[langKey] || localeCurrencyMap.en;

  let numericAmount = 0;
  let sourceCurrency = "USD"; // default

  if (typeof amount === "string") {
    if (amount.includes("$")) sourceCurrency = "USD";
    if (amount.includes("€")) sourceCurrency = "EUR";
    numericAmount = Number(amount.replace(/[€$]/g, ""));
  } else {
    numericAmount = Number(amount);
  }

  // If sourceCurrency === targetCurrency, no conversion
  let convertedAmount = numericAmount;
  if (sourceCurrency !== targetCurrency) {
    if (sourceCurrency === "USD" && targetCurrency === "EUR") {
      convertedAmount = numericAmount * exchangeRates["EUR"];
    } else if (sourceCurrency === "EUR" && targetCurrency === "USD") {
      convertedAmount = numericAmount / exchangeRates["EUR"];
    }
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: targetCurrency,
  }).format(convertedAmount);
};
