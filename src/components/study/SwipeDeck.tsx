import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ThemedText } from '../common/ThemedText';
import { DifficultyRating } from '../../types/review';
import { Colors } from '../../theme/colors';
import { useColorScheme } from '../../hooks/useColorScheme';

const SWIPE_THRESHOLD = 100;
const SCREEN_WIDTH = 400;

interface SwipeDeckProps {
  children: React.ReactNode;
  onSwipe: (rating: DifficultyRating) => void;
  isFlipped: boolean;
  enabled?: boolean;
}

export function SwipeDeck({ children, onSwipe, isFlipped, enabled = true }: SwipeDeckProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
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
        runOnJS(flyOff)('left', 'again');
      } else if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(flyOff)('right', 'easy');
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

  const againOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -20, 0], [1, 0.3, 0], Extrapolation.CLAMP),
  }));

  const easyOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, SWIPE_THRESHOLD], [0, 0.3, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrapper}>
      {/* Swipe hint labels */}
      <Animated.View style={[styles.hintLeft, againOpacity]}>
        <ThemedText style={[styles.hintText, { color: colors.again }]}>AGAIN</ThemedText>
      </Animated.View>
      <Animated.View style={[styles.hintRight, easyOpacity]}>
        <ThemedText style={[styles.hintText, { color: colors.easy }]}>EASY</ThemedText>
      </Animated.View>

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
  hintLeft: {
    position: 'absolute',
    left: 24,
    top: '40%',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '-15deg' }],
  },
  hintRight: {
    position: 'absolute',
    right: 24,
    top: '40%',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    transform: [{ rotate: '15deg' }],
  },
  hintText: {
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 2,
  },
});
