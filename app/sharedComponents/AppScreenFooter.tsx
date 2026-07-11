import { useFonts } from 'expo-font';
import React from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

const AppScreenFooter: React.FC = () => {
  const [loaded] = useFonts({
    PlaywriteGBJ: require('../../assets/fonts/PlaywriteGBJ-VariableFont_wght.ttf'),
  });

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <VStack className="w-full items-center justify-center flex-1" space="xs">
        <Image
          source={require('@/assets/images/footer-logo.png')}
          style={styles.logo}
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
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  logo: {
    height: 100,
    // width: 70,
  },
});

export default AppScreenFooter;
