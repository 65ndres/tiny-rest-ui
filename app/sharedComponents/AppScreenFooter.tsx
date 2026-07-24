import { useFonts } from 'expo-font';
import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { VStack } from '@/components/ui/vstack';

type AppScreenFooterProps = {
  /** Extra downward offset for the logo (e.g. onboarding). */
  logoOffset?: number;
};

const AppScreenFooter: React.FC<AppScreenFooterProps> = ({ logoOffset = 0 }) => {
  const [loaded] = useFonts({
    PlaywriteGBJ: require('../../assets/fonts/PlaywriteGBJ-VariableFont_wght.ttf'),
  });

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <VStack className="w-full items-center justify-center flex-1 p-3" space="xs">
        <Image
          source={require('@/assets/images/footer-logo.png')}
          style={[styles.logo, { marginTop: 15 + logoOffset }]}
          resizeMode="contain"
        />
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  } as ViewStyle,
  logo: {
    height: 100,
  },
});

export default AppScreenFooter;
