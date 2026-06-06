import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SCREEN_CONTENT_HEIGHT,
  SCREEN_FOOTER_HEIGHT,
  SCREEN_TOP_HEIGHT,
} from '@/app/constants/screenLayout';
import AppScreenFooter from './AppScreenFooter';

const width = Dimensions.get('window').width;

interface ScreenComponentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenComponent: React.FC<ScreenComponentProps> = ({ children, style }) => {
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    if (children == null || typeof children === 'boolean') {
      return null;
    }

    if (typeof children === 'string' || typeof children === 'number') {
      return <Text>{children}</Text>;
    }

    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (child == null || typeof child === 'boolean') {
          return null;
        }
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={index}>{child}</Text>;
        }
        if (React.isValidElement(child)) {
          const props = child.props as { children?: React.ReactNode };
          if (props.children) {
            return React.cloneElement(child, {
              ...props,
              key: child.key || index,
              children: processChildren(props.children),
            } as any);
          }
        }
        return child;
      });
    }

    if (React.isValidElement(children)) {
      const props = children.props as { children?: React.ReactNode };
      if (props.children) {
        return React.cloneElement(children, {
          ...props,
          children: processChildren(props.children),
        } as any);
      }
    }

    return children;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.screenContainer, style]}>
        <View style={{ height: SCREEN_TOP_HEIGHT }} />
        <View style={{ height: SCREEN_CONTENT_HEIGHT }}>
          {processChildren(children)}
        </View>
        <View style={{ height: SCREEN_FOOTER_HEIGHT }}>
          <AppScreenFooter />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: width * 0.84,
  } as ViewStyle,
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  } as ViewStyle,
});

export default ScreenComponent;
