import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { DifficultyRating } from '../../types/review';

const SWIPE_THRESHOLD = 100;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Glow colors: left swipe = known (green), right swipe = unknown (red)
const GLOW_LEFT  = '#4CAF50';   // known / mastered
const GLOW_RIGHT = '#F44336';   // unknown / don't know
const GLOW_NONE  = 'transparent';

interface SwipeDeckProps {
  children: React.ReactNode;
  onSwipe: (rating: DifficultyRating) => void;
  isFlipped: boolean;
  enabled?: boolean;
}

export function SwipeDeck({ children, onSwipe, isFlipped, enabled = true }: SwipeDeckProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Reset position when card changes (isFlipped goes back to false)
  useEffect(() => {
    if (!isFlipped) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  }, [isFlipped]);

  const flyOff = (direction: 'left' | 'right', rating: DifficultyRating) => {
    const targetX = direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(onSwipe)(rating);
      translateX.value = 0;
      translateY.value = 0;
    });
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate(e => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.2;
    })
    .onEnd(e => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        // Left swipe = Mastered / known
        runOnJS(flyOff)('left', 'known');
      } else if (e.translationX > SWIPE_THRESHOLD) {
        // Right swipe = Don't Know / unknown
        runOnJS(flyOff)('right', 'unknown');
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Left edge glow: lights up green when swiping left (mastered)
  const leftGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -20, 0],
      [0.9, 0.2, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Right edge glow: lights up red when swiping right (unknown)
  const rightGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, 20, SWIPE_THRESHOLD],
      [0, 0.2, 0.9],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <View style={styles.wrapper}>
      {/* Edge glow overlays */}
      <Animated.View style={[styles.glowLeft, leftGlowStyle]} pointerEvents="none" />
      <Animated.View style={[styles.glowRight, rightGlowStyle]} pointerEvents="none" />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
  },
  glowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: GLOW_LEFT,
    borderRadius: 4,
    zIndex: 10,
  },
  glowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: GLOW_RIGHT,
    borderRadius: 4,
    zIndex: 10,
  },
});
