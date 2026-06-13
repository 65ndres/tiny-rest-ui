import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  homeAddStepClassName,
  homeSectionLabelClassName,
} from '@/app/constants/screenLayout';

type HomeRoutineSectionProps = {
  title: string;
  children: React.ReactNode;
  addLabel?: string;
  onAddPress?: () => void;
};

const HomeRoutineSection: React.FC<HomeRoutineSectionProps> = ({
  title,
  children,
  addLabel,
  onAddPress,
}) => (
  <View className="w-full flex-row">
    <View className="w-4 items-center">
      <View className="flex-1 border-l border-white/20 ml-1.5" />
    </View>
    <VStack className="flex-1 pb-6" space="sm">
      <Text className={homeSectionLabelClassName}>{title}</Text>
      {children}
      {addLabel && onAddPress ? (
        <Pressable
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
        >
          <Text className={homeAddStepClassName}>{addLabel}</Text>
        </Pressable>
      ) : null}
    </VStack>
  </View>
);

export default HomeRoutineSection;
