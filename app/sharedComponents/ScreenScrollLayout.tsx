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
};

const ScreenScrollLayout: React.FC<ScreenScrollLayoutProps> = ({
  children,
  contentContainerClassName,
}) => (
  <ScreenComponent>
    <ScrollView
      className={scrollViewClassName}
      contentContainerClassName={
        contentContainerClassName ?? scrollContentClassName
      }
      showsVerticalScrollIndicator={false}
    >
      <VStack space="md" className={contentStackClassName}>
        {children}
      </VStack>
    </ScrollView>
  </ScreenComponent>
);

export default ScreenScrollLayout;
