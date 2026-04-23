import type { EdgeInsets } from "react-native-safe-area-context";

const MIN_INSET = 12;

/** Vertical padding for scroll content so headers clear the status bar / home indicator. */
export function scrollContentInsetPadding(
  insets: EdgeInsets,
  extraTop: number,
  extraBottom: number,
) {
  return {
    paddingTop: Math.max(insets.top, MIN_INSET) + extraTop,
    paddingBottom: Math.max(insets.bottom, MIN_INSET) + extraBottom,
  };
}
