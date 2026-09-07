import React from 'react';
import { ScrollView, type ViewStyle } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import {
  contentStackClassName,
  scrollContentClassName,
  scrollContentStyle,
  scrollViewClassName,
  stackGapStyle,
} from '@/app/constants/screenLayout';
import ScreenComponent from './ScreenComponent';

type ScreenScrollLayoutProps = {
  children: React.ReactNode;
  contentContainerClassName?: string;
  contentContainerStyle?: ViewStyle;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
};

const ScreenScrollLayout: React.FC<ScreenScrollLayoutProps> = ({
  children,
  contentContainerClassName,
  contentContainerStyle,
  keyboardShouldPersistTaps,
}) => (
  <ScreenComponent contentFlex>
    <ScrollView
      className={scrollViewClassName}
      contentContainerClassName={
        contentContainerClassName ?? scrollContentClassName
      }
      contentContainerStyle={contentContainerStyle ?? scrollContentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      <VStack className={contentStackClassName} style={stackGapStyle}>
        {children}
      </VStack>
    </ScrollView>
  </ScreenComponent>
);

export default ScreenScrollLayout;
