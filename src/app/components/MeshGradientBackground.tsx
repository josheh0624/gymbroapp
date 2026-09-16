import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';

export function MeshGradientBackground() {
  const isLight = useThemeStore((s) => s.theme === "light");

  // Soft, classic SwiftUI Mesh Gradient using Royal Blues
  const lightColors = {
    bg: "#1a3673", 
    blob1: "#4169E1", // Bright Royal Blue
    blob2: "#8eb2ff", // Light highlight
    blob3: "#2c4bb3", // Mid-tone sweeping across center
    blob4: "#0B1D40", // Very Dark Blue
    blob5: "#050F26", // Near Black Blue
  };

  const darkColors = {
    bg: "#0f1d45", // Lighter navy base instead of near-black
    blob1: "#6b8ae8", // Pushing brighter blues at the top
    blob2: "#4169E1", // Vibrant Royal Blue
    blob3: "#2c4bb3", // Mid-tone
    blob4: "#1a3673", // Deep navy
    blob5: "#0a122e", // Instead of absolute black, just a very dark blue
  };

  const colors = isLight ? lightColors : darkColors;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          {/* Main Top Bright Blue - Off-center to look organic */}
          <RadialGradient id="grad1" cx="20%" cy="-10%" r="90%">
            <Stop offset="0" stopColor={colors.blob1} stopOpacity="0.95" />
            <Stop offset="1" stopColor={colors.blob1} stopOpacity="0" />
          </RadialGradient>
          
          {/* Top Right Highlight - smaller, tighter radius */}
          <RadialGradient id="grad2" cx="110%" cy="20%" r="70%">
            <Stop offset="0" stopColor={colors.blob2} stopOpacity="0.85" />
            <Stop offset="1" stopColor={colors.blob2} stopOpacity="0" />
          </RadialGradient>

          {/* Mid-tone sweeping across the center-left to bridge top and bottom */}
          <RadialGradient id="grad3" cx="-10%" cy="50%" r="85%">
            <Stop offset="0" stopColor={colors.blob3} stopOpacity="0.8" />
            <Stop offset="1" stopColor={colors.blob3} stopOpacity="0" />
          </RadialGradient>

          {/* Bottom Right - Deep dark engulfing shadow */}
          <RadialGradient id="grad4" cx="90%" cy="110%" r="100%">
            <Stop offset="0" stopColor={colors.blob4} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.blob4} stopOpacity="0" />
          </RadialGradient>
          
          {/* Bottom Left - Pure dark anchor */}
          <RadialGradient id="grad5" cx="-20%" cy="90%" r="90%">
            <Stop offset="0" stopColor={colors.blob5} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.blob5} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#grad2)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#grad3)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#grad4)" />
        <Rect x="0" y="0" width="100" height="100" fill="url(#grad5)" />
      </Svg>
      <BlurView intensity={isLight ? 60 : 50} tint={isLight ? "light" : "dark"} style={StyleSheet.absoluteFill} />
    </View>
  );
}
