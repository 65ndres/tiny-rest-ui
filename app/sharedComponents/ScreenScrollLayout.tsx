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
};

const ScreenScrollLayout: React.FC<ScreenScrollLayoutProps> = ({ children }) => (
  <ScreenComponent>
    <View style={{ height: '15%' }} />
    <View style={{ height: '80%' }}>
      <ScrollView
        className={scrollViewClassName}
        contentContainerClassName={scrollContentClassName}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="md" className={contentStackClassName}>
          {children}
        </VStack>
      </ScrollView>
    </View>
    <View style={{ height: '5%' }} />
  </ScreenComponent>
);

export default ScreenScrollLayout;
