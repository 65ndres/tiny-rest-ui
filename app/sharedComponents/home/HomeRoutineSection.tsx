import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import {
  homeAddStepClassName,
  homeAddStepStyle,
  homeSectionLabelClassName,
  homeSectionLabelStyle,
  layout,
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
    <View className="items-center" style={{ width: layout.space16 }}>
      <View
        className="flex-1 border-l border-white/20"
        style={{ marginLeft: layout.space6 }}
      />
    </View>
    <VStack className="flex-1" style={{ paddingBottom: layout.space24, gap: layout.space8 }}>
      <Text className={homeSectionLabelClassName} style={homeSectionLabelStyle}>
        {title}
      </Text>
      {children}
      {addLabel && onAddPress ? (
        <Pressable
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
        >
          <Text className={homeAddStepClassName} style={homeAddStepStyle}>
            {addLabel}
          </Text>
        </Pressable>
      ) : null}
    </VStack>
  </View>
);

export default HomeRoutineSection;
