import { Text, TextInput, PixelRatio } from "react-native";

/**
 * Global font-scaling policy.
 *
 * Buez supports OS-level accessibility text sizing (Dynamic Type on iOS,
 * Font Size on Android). By default React Native scales `<Text>` /
 * `<TextInput>` by the OS `fontScale` with no upper bound, which causes
 * clipping and layout breakage in screens that rely on fixed heights.
 *
 * We keep scaling ENABLED for accessibility but CAP it so the UI stays
 * stable across the full range of accessibility settings. Tune this single
 * constant to make the app more (higher) or less (lower) responsive to large
 * text settings.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.1;

type ScalableDefaults = {
  defaultProps?: {
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
    [key: string]: unknown;
  };
};

/**
 * Applies the global font-scaling cap to the host `Text` and `TextInput`
 * components. Call once, as early as possible in the app entry point
 * (before the first render).
 *
 * Individual components can still override `maxFontSizeMultiplier` /
 * `allowFontScaling` locally when a specific element needs different behavior.
 */
export function applyGlobalFontScaling(
  maxMultiplier: number = MAX_FONT_SIZE_MULTIPLIER
): void {
  const components: ScalableDefaults[] = [
    Text as unknown as ScalableDefaults,
    TextInput as unknown as ScalableDefaults,
  ];

  components.forEach((component) => {
    component.defaultProps = component.defaultProps || {};
    component.defaultProps.allowFontScaling = true;
    component.defaultProps.maxFontSizeMultiplier = maxMultiplier;
  });
}

/**
 * Current OS font scale, already clamped to our cap. Useful for sizing
 * non-text elements (icons, badges, fixed boxes) so they grow in step with
 * text without exceeding the same bound.
 */
export function getClampedFontScale(
  maxMultiplier: number = MAX_FONT_SIZE_MULTIPLIER
): number {
  return Math.min(PixelRatio.getFontScale(), maxMultiplier);
}
