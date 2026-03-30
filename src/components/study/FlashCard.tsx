import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { VocabCard } from '../../types/vocab';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';

interface FlashCardProps {
  card: VocabCard;
  isFlipped: boolean;
}

export function FlashCard({ card, isFlipped }: FlashCardProps) {
  const { colors } = useTheme();
  const rotateY = useSharedValue(0);

  useEffect(() => {
    rotateY.value = withTiming(isFlipped ? 180 : 0, { duration: 350 });
  }, [isFlipped]);

  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    const opacity = interpolate(rotateY.value, [89, 90], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    const opacity = interpolate(rotateY.value, [89, 90], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      {/* Front face */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          styles.frontFace,
          frontStyle,
        ]}
      >
        <CardFront card={card} />
      </Animated.View>
      {/* Back face */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          styles.backFace,
          backStyle,
        ]}
      >
        <CardBack card={card} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 0.7,
    maxHeight: 520,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  frontFace: {},
  backFace: {},
});
