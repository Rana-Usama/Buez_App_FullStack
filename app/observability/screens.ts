import en from "../translation/locales/en.json";
import de from "../translation/locales/de.json";
import deDE from "../translation/locales/de-DE.json";
import deCH from "../translation/locales/de-CH.json";
import fr from "../translation/locales/fr.json";
import it from "../translation/locales/it.json";
import es from "../translation/locales/es.json";

type BottomTabKey = "txt1" | "txt2" | "txt3" | "txt4" | "txt5";

/** Translation key → stable screen key (mirrors MainTabNavigator order). */
const TAB_SCREEN_KEYS: Record<BottomTabKey, string> = {
  txt1: "my_requests",
  txt2: "post_dashboard",
  txt3: "home",
  txt4: "messages",
  txt5: "settings",
};

const LOCALES = [en, de, deDE, deCH, fr, it, es] as Array<{
  bottomTab?: Partial<Record<BottomTabKey, string>>;
}>;

/** Every translated tab label (all locales) → stable key. */
const TRANSLATED_TAB_NAMES: Map<string, string> = (() => {
  const map = new Map<string, string>();
  LOCALES.forEach((locale) => {
    (Object.keys(TAB_SCREEN_KEYS) as BottomTabKey[]).forEach((key) => {
      const label = locale.bottomTab?.[key];
      if (label) map.set(label, TAB_SCREEN_KEYS[key]);
    });
  });
  return map;
})();

const toSnakeCase = (name: string): string =>
  name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();


export const toScreenKey = (routeName?: string | null): string => {
  if (!routeName) return "unknown";

  const tabKey = TRANSLATED_TAB_NAMES.get(routeName);
  if (tabKey) return tabKey;

  const key = toSnakeCase(routeName);
  // Anything non-ASCII left here is an unmapped translated name — never let
  // localized text become a screen key.
  return /^[a-z0-9_]+$/.test(key) ? key : "unknown";
};
