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
  SCREEN_CONTENT_WIDTH_RATIO,
  SCREEN_FOOTER_HEIGHT,
  SCREEN_TOP_HEIGHT,
} from '@/app/constants/screenLayout';
import AppScreenFooter from './AppScreenFooter';

const width = Dimensions.get('window').width;

interface ScreenComponentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentFlex?: boolean;
  footerLogoOffset?: number;
}

const ScreenComponent: React.FC<ScreenComponentProps> = ({
  children,
  style,
  contentFlex = false,
  footerLogoOffset,
}) => {
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
        <View style={contentFlex ? styles.flexContent : { height: SCREEN_CONTENT_HEIGHT }}>
          {processChildren(children)}
        </View>
        <View style={{ height: SCREEN_FOOTER_HEIGHT }}>
          <AppScreenFooter logoOffset={footerLogoOffset} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexContent: {
    flex: 1,
    minHeight: 0,
  } as ViewStyle,
  screenContainer: {
    flex: 1,
    width: width * SCREEN_CONTENT_WIDTH_RATIO,
  } as ViewStyle,
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  } as ViewStyle,
});

export default ScreenComponent;
