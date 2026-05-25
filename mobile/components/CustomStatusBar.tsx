import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';

/**
 * CustomStatusBar component that ensures a solid brand-colored status bar
 * across both Android and iOS devices.
 * 
 * - Android: Uses solid, non-translucent status bar colored with Coffee Brown (`#4B2C20`).
 * - iOS: Renders an absolute-positioned top bar matching the status bar height to color it Coffee Brown,
 *   with white status bar icons for clean readability.
 */
export function CustomStatusBar() {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* 
        On Android: Setting translucent={false} places the app content BELOW the status bar,
        and backgroundColor sets the background color of the status bar.
        On iOS: translucent/backgroundColor are ignored, and it sets the icon styles to light.
      */}
      <StatusBar 
        style="light" 
        backgroundColor={Colors.primary} 
        translucent={false} 
      />
      
      {/* 
        On iOS, we overlay a solid background color on the status bar area.
        Since screen layouts use SafeAreaView or paddingTop: insets.top,
        their content will start exactly below this background overlay.
      */}
      {Platform.OS === 'ios' && (
        <View 
          style={[
            styles.statusBarBackground, 
            { 
              height: insets.top, 
              backgroundColor: Colors.primary 
            }
          ]} 
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
  },
});
