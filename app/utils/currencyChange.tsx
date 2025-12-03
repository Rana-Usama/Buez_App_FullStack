/// Exchange rates (USD → target currency) - Update these regularly

import axios from "axios";

export const getLiveExchangeRates = async () => {
  try {
    const response = await axios.get(
      "https://api.exchangerate.host/latest?base=USD"
    );
    console.log("getLiveExchangeRates...........", response);
    return response.data.rates; // returns { EUR: 0.92, GBP: 0.79, ... }
  } catch (error) {
    console.error("Error fetching live rates:", error);
    return null; // fallback handled below
  }
};

const exchangeRates = {
  USD: 1,
  EUR: 0.93,
  GBP: 0.8,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 150.25,
  CHF: 0.9,
  CNY: 7.24,
  INR: 83.12,
  BRL: 4.92,
  MXN: 17.01,
  SGD: 1.35,
  HKD: 7.82,
  KRW: 1330.5,
  RUB: 92.45,
  ZAR: 18.75,
  SEK: 10.45,
  NOK: 10.6,
  DKK: 6.92,
  PLN: 4.02,
  TRY: 32.15,
  AED: 3.67,
  SAR: 3.75,
  PKR: 278.5,

  // Additional currencies from countryCurrencyMap
  BYN: 3.28, // Belarusian Ruble
  CZK: 23.45, // Czech Koruna
  HUF: 365.8, // Hungarian Forint
  ISK: 138.5, // Icelandic Króna
  MKD: 57.8, // Macedonian Denar
  RON: 4.62, // Romanian Leu
  RSD: 108.9, // Serbian Dinar
  UAH: 39.2, // Ukrainian Hryvnia
  AFN: 71.5, // Afghan Afghani
  AMD: 387.9, // Armenian Dram
  AZN: 1.7, // Azerbaijani Manat
  BDT: 109.8, // Bangladeshi Taka
  BHD: 0.376, // Bahraini Dinar
  BND: 1.35, // Brunei Dollar
  BTN: 83.12, // Bhutanese Ngultrum (pegged to INR)
  GEL: 2.68, // Georgian Lari
  IDR: 15650, // Indonesian Rupiah
  ILS: 3.68, // Israeli Shekel
  IQD: 1310, // Iraqi Dinar
  IRR: 42000, // Iranian Rial
  JOD: 0.709, // Jordanian Dinar
  KGS: 89.3, // Kyrgyzstani Som
  KHR: 4075, // Cambodian Riel
  KPW: 900, // North Korean Won
  KWD: 0.308, // Kuwaiti Dinar
  KZT: 469.5, // Kazakhstani Tenge
  LAK: 20650, // Lao Kip
  LBP: 15000, // Lebanese Pound
  LKR: 323.5, // Sri Lankan Rupee
  MMK: 2100, // Myanmar Kyat
  MNT: 3430, // Mongolian Tögrög
  MOP: 8.06, // Macanese Pataca
  MVR: 15.4, // Maldivian Rufiyaa
  MYR: 4.72, // Malaysian Ringgit
  NPR: 133.2, // Nepalese Rupee
  OMR: 0.385, // Omani Rial
  PHP: 56.3, // Philippine Peso
  QAR: 3.64, // Qatari Riyal
  THB: 35.8, // Thai Baht
  TJS: 10.95, // Tajikistani Somoni
  TMT: 3.5, // Turkmenistan Manat
  TWD: 31.8, // New Taiwan Dollar
  UZS: 12350, // Uzbekistani Som
  VND: 24350, // Vietnamese Đồng
  YER: 250.3, // Yemeni Rial
  FJD: 2.25, // Fijian Dollar
  XPF: 110.3, // CFP Franc
  NZD: 1.64, // New Zealand Dollar
  PGK: 3.75, // Papua New Guinean Kina
  SBD: 8.4, // Solomon Islands Dollar
  TOP: 2.36, // Tongan Paʻanga
  VUV: 120.5, // Vanuatu Vatu
  WST: 2.75, // Samoan Tala
  AOA: 850, // Angolan Kwanza
  XOF: 608.5, // West African CFA franc
  BIF: 2850, // Burundian Franc
  BWP: 13.65, // Botswana Pula
  CDF: 2700, // Congolese Franc
  XAF: 608.5, // Central African CFA franc
  CVE: 102.3, // Cape Verdean Escudo
  DJF: 177.7, // Djiboutian Franc
  DZD: 134.5, // Algerian Dinar
  EGP: 30.9, // Egyptian Pound
  ERN: 15, // Eritrean Nakfa
  ETB: 56.7, // Ethiopian Birr
  GHS: 12.8, // Ghanaian Cedi
  GMD: 65.4, // Gambian Dalasi
  GNF: 8600, // Guinean Franc
  KES: 157.5, // Kenyan Shilling
  KMF: 458.2, // Comorian Franc
  LRD: 189.5, // Liberian Dollar
  LSL: 18.75, // Lesotho Loti (pegged to ZAR)
  LYD: 4.83, // Libyan Dinar
  MAD: 10.05, // Moroccan Dirham
  MGA: 4530, // Malagasy Ariary
  MRU: 36.8, // Mauritanian Ouguiya
  MUR: 46.2, // Mauritian Rupee
  MWK: 1680, // Malawian Kwacha
  MZN: 63.9, // Mozambican Metical
  NAD: 18.75, // Namibian Dollar (pegged to ZAR)
  NGN: 1500, // Nigerian Naira
  RWF: 1300, // Rwandan Franc
  SCR: 13.5, // Seychellois Rupee
  SDG: 601, // Sudanese Pound
  SLL: 21000, // Sierra Leonean Leone
  SOS: 571, // Somali Shilling
  SSP: 1300, // South Sudanese Pound
  STN: 22.5, // São Tomé and Príncipe Dobra
  SZL: 18.75, // Swazi Lilangeni (pegged to ZAR)
  TND: 3.12, // Tunisian Dinar
  TZS: 2500, // Tanzanian Shilling
  UGX: 3800, // Ugandan Shilling
  ZMW: 26.8, // Zambian Kwacha
  ZWL: 322, // Zimbabwean Dollar
  ARS: 850, // Argentine Peso
  BOB: 6.91, // Bolivian Boliviano
  CLP: 950, // Chilean Peso
  COP: 3900, // Colombian Peso
  GYD: 209, // Guyanese Dollar
  PEN: 3.78, // Peruvian Sol
  PYG: 7300, // Paraguayan Guaraní
  SRD: 35.2, // Surinamese Dollar
  UYU: 39.5, // Uruguayan Peso
  VES: 36.5, // Venezuelan Bolívar
};

// Country to currency mapping (ISO 3166-1 alpha-2 country codes)
const countryCurrencyMap = {
  // North America
  US: "USD", // United States
  CA: "CAD", // Canada
  MX: "MXN", // Mexico

  // Europe
  AD: "EUR", // Andorra
  AL: "EUR", // Albania
  AT: "EUR", // Austria
  BA: "EUR", // Bosnia and Herzegovina
  BE: "EUR", // Belgium
  BG: "EUR", // Bulgaria
  BY: "BYN", // Belarus
  CH: "CHF", // Switzerland
  CY: "EUR", // Cyprus
  CZ: "CZK", // Czech Republic
  DE: "EUR", // Germany
  DK: "DKK", // Denmark
  EE: "EUR", // Estonia
  ES: "EUR", // Spain
  FI: "EUR", // Finland
  FR: "EUR", // France
  GB: "GBP", // United Kingdom
  GR: "EUR", // Greece
  HR: "EUR", // Croatia
  HU: "HUF", // Hungary
  IE: "EUR", // Ireland
  IS: "ISK", // Iceland
  IT: "EUR", // Italy
  LI: "CHF", // Liechtenstein
  LT: "EUR", // Lithuania
  LU: "EUR", // Luxembourg
  LV: "EUR", // Latvia
  MC: "EUR", // Monaco
  ME: "EUR", // Montenegro
  MK: "MKD", // North Macedonia
  MT: "EUR", // Malta
  NL: "EUR", // Netherlands
  NO: "NOK", // Norway
  PL: "PLN", // Poland
  PT: "EUR", // Portugal
  RO: "RON", // Romania
  RS: "RSD", // Serbia
  RU: "RUB", // Russia
  SE: "SEK", // Sweden
  SI: "EUR", // Slovenia
  SK: "EUR", // Slovakia
  SM: "EUR", // San Marino
  TR: "TRY", // Turkey
  UA: "UAH", // Ukraine
  VA: "EUR", // Vatican City

  // Asia
  AE: "AED", // United Arab Emirates
  AF: "AFN", // Afghanistan
  AM: "AMD", // Armenia
  AZ: "AZN", // Azerbaijan
  BD: "BDT", // Bangladesh
  BH: "BHD", // Bahrain
  BN: "BND", // Brunei
  BT: "BTN", // Bhutan
  CN: "CNY", // China
  GE: "GEL", // Georgia
  HK: "HKD", // Hong Kong
  ID: "IDR", // Indonesia
  IL: "ILS", // Israel
  IN: "INR", // India
  IQ: "IQD", // Iraq
  IR: "IRR", // Iran
  JO: "JOD", // Jordan
  JP: "JPY", // Japan
  KG: "KGS", // Kyrgyzstan
  KH: "KHR", // Cambodia
  KP: "KPW", // North Korea
  KR: "KRW", // South Korea
  KW: "KWD", // Kuwait
  KZ: "KZT", // Kazakhstan
  LA: "LAK", // Laos
  LB: "LBP", // Lebanon
  LK: "LKR", // Sri Lanka
  MM: "MMK", // Myanmar
  MN: "MNT", // Mongolia
  MO: "MOP", // Macao
  MV: "MVR", // Maldives
  MY: "MYR", // Malaysia
  NP: "NPR", // Nepal
  OM: "OMR", // Oman
  PH: "PHP", // Philippines
  PK: "PKR", // Pakistan
  PS: "ILS", // Palestine
  QA: "QAR", // Qatar
  SA: "SAR", // Saudi Arabia
  SG: "SGD", // Singapore
  TH: "THB", // Thailand
  TJ: "TJS", // Tajikistan
  TM: "TMT", // Turkmenistan
  TW: "TWD", // Taiwan
  UZ: "UZS", // Uzbekistan
  VN: "VND", // Vietnam
  YE: "YER", // Yemen

  // Oceania
  AU: "AUD", // Australia
  FJ: "FJD", // Fiji
  NC: "XPF", // New Caledonia
  NZ: "NZD", // New Zealand
  PG: "PGK", // Papua New Guinea
  SB: "SBD", // Solomon Islands
  TO: "TOP", // Tonga
  VU: "VUV", // Vanuatu
  WS: "WST", // Samoa

  // Africa
  AO: "AOA", // Angola
  BF: "XOF", // Burkina Faso
  BI: "BIF", // Burundi
  BJ: "XOF", // Benin
  BW: "BWP", // Botswana
  CD: "CDF", // DR Congo
  CF: "XAF", // Central African Republic
  CG: "XAF", // Republic of the Congo
  CI: "XOF", // Ivory Coast
  CM: "XAF", // Cameroon
  CV: "CVE", // Cape Verde
  DJ: "DJF", // Djibouti
  DZ: "DZD", // Algeria
  EG: "EGP", // Egypt
  ER: "ERN", // Eritrea
  ET: "ETB", // Ethiopia
  GA: "XAF", // Gabon
  GH: "GHS", // Ghana
  GM: "GMD", // Gambia
  GN: "GNF", // Guinea
  GQ: "XAF", // Equatorial Guinea
  KE: "KES", // Kenya
  KM: "KMF", // Comoros
  LR: "LRD", // Liberia
  LS: "LSL", // Lesotho
  LY: "LYD", // Libya
  MA: "MAD", // Morocco
  MG: "MGA", // Madagascar
  ML: "XOF", // Mali
  MR: "MRU", // Mauritania
  MU: "MUR", // Mauritius
  MW: "MWK", // Malawi
  MZ: "MZN", // Mozambique
  NA: "NAD", // Namibia
  NE: "XOF", // Niger
  NG: "NGN", // Nigeria
  RW: "RWF", // Rwanda
  SC: "SCR", // Seychelles
  SD: "SDG", // Sudan
  SL: "SLL", // Sierra Leone
  SN: "XOF", // Senegal
  SO: "SOS", // Somalia
  SS: "SSP", // South Sudan
  ST: "STN", // São Tomé and Príncipe
  SZ: "SZL", // Eswatini
  TD: "XAF", // Chad
  TG: "XOF", // Togo
  TN: "TND", // Tunisia
  TZ: "TZS", // Tanzania
  UG: "UGX", // Uganda
  ZA: "ZAR", // South Africa
  ZM: "ZMW", // Zambia
  ZW: "ZWL", // Zimbabwe

  // South America
  AR: "ARS", // Argentina
  BO: "BOB", // Bolivia
  BR: "BRL", // Brazil
  CL: "CLP", // Chile
  CO: "COP", // Colombia
  EC: "USD", // Ecuador
  GF: "EUR", // French Guiana
  GY: "GYD", // Guyana
  PE: "PEN", // Peru
  PY: "PYG", // Paraguay
  SR: "SRD", // Suriname
  UY: "UYU", // Uruguay
  VE: "VES", // Venezuela
};

// Locale mapping for currency formatting
const currencyLocaleMap = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  CNY: "zh-CN",
  INR: "en-IN",
  BRL: "pt-BR",
  MXN: "es-MX",
  SGD: "en-SG",
  HKD: "zh-HK",
  KRW: "ko-KR",
  RUB: "ru-RU",
  ZAR: "en-ZA",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  PLN: "pl-PL",
  TRY: "tr-TR",
  AED: "ar-AE",
  SAR: "ar-SA",
  PKR: "ur-PK",

  // Additional locales
  BYN: "be-BY", // Belarus
  CZK: "cs-CZ", // Czech Republic
  HUF: "hu-HU", // Hungary
  ISK: "is-IS", // Iceland
  MKD: "mk-MK", // North Macedonia
  RON: "ro-RO", // Romania
  RSD: "sr-RS", // Serbia
  UAH: "uk-UA", // Ukraine
  AFN: "fa-AF", // Afghanistan
  AMD: "hy-AM", // Armenia
  AZN: "az-AZ", // Azerbaijan
  BDT: "bn-BD", // Bangladesh
  BHD: "ar-BH", // Bahrain
  BND: "ms-BN", // Brunei
  BTN: "dz-BT", // Bhutan
  GEL: "ka-GE", // Georgia
  IDR: "id-ID", // Indonesia
  ILS: "he-IL", // Israel
  IQD: "ar-IQ", // Iraq
  IRR: "fa-IR", // Iran
  JOD: "ar-JO", // Jordan
  KGS: "ky-KG", // Kyrgyzstan
  KHR: "km-KH", // Cambodia
  KPW: "ko-KP", // North Korea
  KWD: "ar-KW", // Kuwait
  KZT: "kk-KZ", // Kazakhstan
  LAK: "lo-LA", // Laos
  LBP: "ar-LB", // Lebanon
  LKR: "si-LK", // Sri Lanka
  MMK: "my-MM", // Myanmar
  MNT: "mn-MN", // Mongolia
  MOP: "zh-MO", // Macao
  MVR: "dv-MV", // Maldives
  MYR: "ms-MY", // Malaysia
  NPR: "ne-NP", // Nepal
  OMR: "ar-OM", // Oman
  PHP: "fil-PH", // Philippines
  QAR: "ar-QA", // Qatar
  THB: "th-TH", // Thailand
  TJS: "tg-TJ", // Tajikistan
  TMT: "tk-TM", // Turkmenistan
  TWD: "zh-TW", // Taiwan
  UZS: "uz-UZ", // Uzbekistan
  VND: "vi-VN", // Vietnam
  YER: "ar-YE", // Yemen
  FJD: "en-FJ", // Fiji
  XPF: "fr-NC", // New Caledonia
  NZD: "en-NZ", // New Zealand
  PGK: "en-PG", // Papua New Guinea
  SBD: "en-SB", // Solomon Islands
  TOP: "to-TO", // Tonga
  VUV: "fr-VU", // Vanuatu
  WST: "sm-WS", // Samoa
  AOA: "pt-AO", // Angola
  XOF: "fr-BF", // Burkina Faso
  BIF: "fr-BI", // Burundi
  BWP: "en-BW", // Botswana
  CDF: "fr-CD", // DR Congo
  XAF: "fr-CM", // Cameroon
  CVE: "pt-CV", // Cape Verde
  DJF: "fr-DJ", // Djibouti
  DZD: "ar-DZ", // Algeria
  EGP: "ar-EG", // Egypt
  ERN: "ti-ER", // Eritrea
  ETB: "am-ET", // Ethiopia
  GHS: "en-GH", // Ghana
  GMD: "en-GM", // Gambia
  GNF: "fr-GN", // Guinea
  KES: "sw-KE", // Kenya
  KMF: "ar-KM", // Comoros
  LRD: "en-LR", // Liberia
  LSL: "en-LS", // Lesotho
  LYD: "ar-LY", // Libya
  MAD: "ar-MA", // Morocco
  MGA: "mg-MG", // Madagascar
  MRU: "ar-MR", // Mauritania
  MUR: "en-MU", // Mauritius
  MWK: "en-MW", // Malawi
  MZN: "pt-MZ", // Mozambique
  NAD: "en-NA", // Namibia
  NGN: "en-NG", // Nigeria
  RWF: "rw-RW", // Rwanda
  SCR: "en-SC", // Seychelles
  SDG: "ar-SD", // Sudan
  SLL: "en-SL", // Sierra Leone
  SOS: "so-SO", // Somalia
  SSP: "en-SS", // South Sudan
  STN: "pt-ST", // São Tomé and Príncipe
  SZL: "en-SZ", // Eswatini
  TND: "ar-TN", // Tunisia
  TZS: "sw-TZ", // Tanzania
  UGX: "en-UG", // Uganda
  ZMW: "en-ZM", // Zambia
  ZWL: "en-ZW", // Zimbabwe
  ARS: "es-AR", // Argentina
  BOB: "es-BO", // Bolivia
  CLP: "es-CL", // Chile
  COP: "es-CO", // Colombia
  GYD: "en-GY", // Guyana
  PEN: "es-PE", // Peru
  PYG: "es-PY", // Paraguay
  SRD: "nl-SR", // Suriname
  UYU: "es-UY", // Uruguay
  VES: "es-VE", // Venezuela
};

// Currency symbols mapping
const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  SGD: "S$",
  HKD: "HK$",
  KRW: "₩",
  RUB: "₽",
  ZAR: "R",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  TRY: "₺",
  AED: "د.إ",
  SAR: "ر.س",
  PKR: "Rs",

  // Additional currency symbols
  BYN: "Br", // Belarusian Ruble
  CZK: "Kč", // Czech Koruna
  HUF: "Ft", // Hungarian Forint
  ISK: "kr", // Icelandic Króna
  MKD: "ден", // Macedonian Denar
  RON: "lei", // Romanian Leu
  RSD: "дин", // Serbian Dinar
  UAH: "₴", // Ukrainian Hryvnia
  AFN: "؋", // Afghan Afghani
  AMD: "֏", // Armenian Dram
  AZN: "₼", // Azerbaijani Manat
  BDT: "৳", // Bangladeshi Taka
  BHD: ".د.ب", // Bahraini Dinar
  BND: "B$", // Brunei Dollar
  BTN: "Nu.", // Bhutanese Ngultrum
  GEL: "₾", // Georgian Lari
  IDR: "Rp", // Indonesian Rupiah
  ILS: "₪", // Israeli Shekel
  IQD: "ع.د", // Iraqi Dinar
  IRR: "﷼", // Iranian Rial
  JOD: "د.ا", // Jordanian Dinar
  KGS: "с", // Kyrgyzstani Som
  KHR: "៛", // Cambodian Riel
  KPW: "₩", // North Korean Won
  KWD: "د.ك", // Kuwaiti Dinar
  KZT: "₸", // Kazakhstani Tenge
  LAK: "₭", // Lao Kip
  LBP: "ل.ل", // Lebanese Pound
  LKR: "Rs", // Sri Lankan Rupee
  MMK: "K", // Myanmar Kyat
  MNT: "₮", // Mongolian Tögrög
  MOP: "MOP$", // Macanese Pataca
  MVR: "Rf", // Maldivian Rufiyaa
  MYR: "RM", // Malaysian Ringgit
  NPR: "Rs", // Nepalese Rupee
  OMR: "ر.ع.", // Omani Rial
  PHP: "₱", // Philippine Peso
  QAR: "ر.ق", // Qatari Riyal
  THB: "฿", // Thai Baht
  TJS: "ЅМ", // Tajikistani Somoni
  TMT: "T", // Turkmenistan Manat
  TWD: "NT$", // New Taiwan Dollar
  UZS: "so'm", // Uzbekistani Som
  VND: "₫", // Vietnamese Đồng
  YER: "﷼", // Yemeni Rial
  FJD: "FJ$", // Fijian Dollar
  XPF: "₣", // CFP Franc
  NZD: "NZ$", // New Zealand Dollar
  PGK: "K", // Papua New Guinean Kina
  SBD: "SI$", // Solomon Islands Dollar
  TOP: "T$", // Tongan Paʻanga
  VUV: "VT", // Vanuatu Vatu
  WST: "WS$", // Samoan Tala
  AOA: "Kz", // Angolan Kwanza
  XOF: "CFA", // West African CFA franc
  BIF: "FBu", // Burundian Franc
  BWP: "P", // Botswana Pula
  CDF: "FC", // Congolese Franc
  XAF: "FCFA", // Central African CFA franc
  CVE: "$", // Cape Verdean Escudo
  DJF: "Fdj", // Djiboutian Franc
  DZD: "د.ج", // Algerian Dinar
  EGP: "£", // Egyptian Pound
  ERN: "Nfk", // Eritrean Nakfa
  ETB: "Br", // Ethiopian Birr
  GHS: "GH₵", // Ghanaian Cedi
  GMD: "D", // Gambian Dalasi
  GNF: "FG", // Guinean Franc
  KES: "KSh", // Kenyan Shilling
  KMF: "CF", // Comorian Franc
  LRD: "L$", // Liberian Dollar
  LSL: "L", // Lesotho Loti
  LYD: "ل.د", // Libyan Dinar
  MAD: "د.م.", // Moroccan Dirham
  MGA: "Ar", // Malagasy Ariary
  MRU: "UM", // Mauritanian Ouguiya
  MUR: "₨", // Mauritian Rupee
  MWK: "MK", // Malawian Kwacha
  MZN: "MT", // Mozambican Metical
  NAD: "N$", // Namibian Dollar
  NGN: "₦", // Nigerian Naira
  RWF: "FRw", // Rwandan Franc
  SCR: "₨", // Seychellois Rupee
  SDG: "£", // Sudanese Pound
  SLL: "Le", // Sierra Leonean Leone
  SOS: "S", // Somali Shilling
  SSP: "£", // South Sudanese Pound
  STN: "Db", // São Tomé and Príncipe Dobra
  SZL: "L", // Swazi Lilangeni
  TND: "د.ت", // Tunisian Dinar
  TZS: "TSh", // Tanzanian Shilling
  UGX: "USh", // Ugandan Shilling
  ZMW: "ZK", // Zambian Kwacha
  ZWL: "Z$", // Zimbabwean Dollar
  ARS: "$", // Argentine Peso
  BOB: "Bs", // Bolivian Boliviano
  CLP: "$", // Chilean Peso
  COP: "$", // Colombian Peso
  GYD: "G$", // Guyanese Dollar
  PEN: "S/", // Peruvian Sol
  PYG: "₲", // Paraguayan Guaraní
  SRD: "$", // Surinamese Dollar
  UYU: "$U", // Uruguayan Peso
  VES: "Bs.S", // Venezuelan Bolívar
};

/**
 * @param {string} countryCode
 * @returns {string}
 */

export const getCurrencyFromCountry = (countryCode) => {
  if (!countryCode) return "USD";
  const code = countryCode.toUpperCase();
  return countryCurrencyMap[code] || "USD";
};

/**
 * @param {string} currency
 * @returns {string}
 */

export const getLocaleForCurrency = (currency) => {
  return currencyLocaleMap[currency] || "en-US";
};

/**
 * @param {string} currency
 * @returns {string}
 */

export const getCurrencySymbol = (currency) => {
  return currencySymbols[currency] || "$";
};

/**
 * @param {Object} location
 * @returns {string}
 */

export const getCurrencySymbolFromLocation = (location = null) => {
  const targetCurrency = getCurrencyFromCountry(
    location?.countryCode || location?.country
  );
  return getCurrencySymbol(targetCurrency);
};

/**
 * @param {number} amount
 * @param {string} fromCurrency
 * @param {string} toCurrency
 * @returns {number}
 */

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (!amount || fromCurrency === toCurrency) return amount;
  if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
    console.log(
      `Exchange rate not available for ${fromCurrency} to ${toCurrency}`
    );
    return amount;
  }

  // Calculate direct exchange rate
  const directExchangeRate =
    exchangeRates[toCurrency] / exchangeRates[fromCurrency];
  const convertedAmount = amount * directExchangeRate;
  return convertedAmount;
};

/**
 * @param {number|string} amount -
 * @param {Object} location -
 * @param {Object} options -
 * @returns {string}
 */

export const formatCurrencyByLocation = (
  amount,
  location = null,
  options = {}
) => {
  const {
    fallbackCurrency = "USD",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  // Get target currency from location
  const targetCurrency =
    getCurrencyFromCountry(location?.countryCode || location?.country) ||
    fallbackCurrency;

  const locale = getLocaleForCurrency(targetCurrency);

  // Parse the input amount
  let numericAmount = 0;
  if (typeof amount === "string") {
    numericAmount = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  } else {
    numericAmount = Number(amount) || 0;
  }

  // Format the currency
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency: targetCurrency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(numericAmount);
};

/**
 * @param {string} formattedAmount
 * @returns {number}
 */

export const extractNumericValue = (formattedAmount) => {
  if (!formattedAmount) return 0;
  const numericString = formattedAmount.replace(/[^\d.]/g, "");
  return parseFloat(numericString) || 0;
};

/**
 * @param {string} formattedAmount
 * @returns {string}
 */

export const detectCurrencyFromString = (formattedAmount) => {
  if (!formattedAmount) return "USD";
  if (formattedAmount.includes("€")) return "EUR";
  if (formattedAmount.includes("£")) return "GBP";
  if (formattedAmount.includes("¥")) return "JPY";
  if (formattedAmount.includes("₹")) return "INR";
  if (formattedAmount.includes("R$")) return "BRL";
  if (formattedAmount.includes("$")) return "USD";
  return "USD";
};

/**
 * @param {number|string} amount
 * @param {Object} location
 * @param {Object} options
 * @returns {string}
 */
export const formatCurrency = (amount, location = null, options = {}) => {
  return formatCurrencyByLocation(amount, location, options);
};

/**
 * @param {Object} location -
 * @returns {Object}
 */
export const getCurrencyInfo = (location = null) => {
  const currency = getCurrencyFromCountry(
    location?.countryCode || location?.country
  );

  return {
    code: currency,
    symbol: getCurrencySymbol(currency),
    locale: getLocaleForCurrency(currency),
    exchangeRate: exchangeRates[currency] || 1,
  };
};

/**
 * Update exchange rates (call this periodically from your backend)
 * @param {Object} newRates - new exchange rates
 */
export const updateExchangeRates = (newRates) => {
  Object.keys(newRates).forEach((currency) => {
    if (exchangeRates.hasOwnProperty(currency)) {
      exchangeRates[currency] = newRates[currency];
    }
  });
};

/**
 * Get all supported currencies
 * @returns {Array} list of supported currency codes
 */
export const getSupportedCurrencies = () => {
  return Object.keys(exchangeRates);
};

/**
 * Get all supported countries
 * @returns {Array} list of supported country codes
 */
export const getSupportedCountries = () => {
  return Object.keys(countryCurrencyMap);
};

// Default export for backward compatibility
export default {
  formatCurrency,
  getCurrencyFromCountry,
  getCurrencySymbol,
  getCurrencySymbolFromLocation,
  convertCurrency,
  extractNumericValue,
  detectCurrencyFromString,
  getCurrencyInfo,
  updateExchangeRates,
  getSupportedCurrencies,
  getSupportedCountries,
};
