/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: "#F5F8FF",
    background: "#071D43",
    tint: "#D9B56A",
    icon: "#B5C6E3",
    tabIconDefault: "#B5C6E3",
    tabIconSelected: "#D9B56A",
    card: "#0C2A57",
    ui: {
      screen: "#071D43",
      surface: "#0C2A57",
      elevated: "#123262",
      border: "#2A4C7D",
      accent: "#8FC6FF",
      accentSoft: "#254C7A",
      highlight: "#D9B56A",
      textPrimary: "#F5F8FF",
      textSecondary: "#B5C6E3",
      optionSelected: "#1A4476",
      optionUnselected: "#0C2A57",
      success: "#4FD6A0",
    },
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
    card: "#1F2937",
    ui: {
      screen: "#071D43",
      surface: "#0C2A57",
      elevated: "#123262",
      border: "#2A4C7D",
      accent: "#8FC6FF",
      accentSoft: "#254C7A",
      highlight: "#D9B56A",
      textPrimary: "#F5F8FF",
      textSecondary: "#B5C6E3",
      optionSelected: "#1A4476",
      optionUnselected: "#0C2A57",
      success: "#4FD6A0",
    },
  },
};

/** primary / accent text color */
export function labelOnTint(isDark: boolean) {
  return isDark ? "#151718" : "#FFFFFF";
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
