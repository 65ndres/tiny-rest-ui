import React from 'react';
import { ScrollView, View } from 'react-native';
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
    <View style={{ height: '7%' }} />
    <View style={{ height: '83%' }}>
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
    </View>
    <View style={{ height: '10%' }} />
  </ScreenComponent>
);

export default ScreenScrollLayout;
