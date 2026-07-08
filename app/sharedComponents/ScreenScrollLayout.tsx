import React from 'react';
import { ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import {
  contentStackClassName,
  scrollContentClassName,
  scrollViewClassName,
} from '@/app/constants/screenLayout';
import ScreenComponent from './ScreenComponent';

type ScreenScrollLayoutProps = {
  children: React.ReactNode;
  contentContainerClassName?: string;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
};

const ScreenScrollLayout: React.FC<ScreenScrollLayoutProps> = ({
  children,
  contentContainerClassName,
  keyboardShouldPersistTaps,
}) => (
  <ScreenComponent>
    <ScrollView
      className={scrollViewClassName}
      contentContainerClassName={
        contentContainerClassName ?? scrollContentClassName
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      <VStack space="md" className={contentStackClassName}>
        {children}
      </VStack>
    </ScrollView>
  </ScreenComponent>
);

export default ScreenScrollLayout;
