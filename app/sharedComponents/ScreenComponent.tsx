import React from 'react';
import {
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
import { getAppWindow } from '@/constants/appViewport';
import AppScreenFooter from './AppScreenFooter';

const cappedContentWidth = getAppWindow().width * SCREEN_CONTENT_WIDTH_RATIO;

interface ScreenComponentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  contentFlex?: boolean;
  footerLogoOffset?: number;
  showFooter?: boolean;
  /**
   * When false, content uses the full device width (not capped to iPhone 16 Pro Max).
   * Used by screens that should remain layout-dynamic (e.g. Timeline).
   */
  constrainToPhoneViewport?: boolean;
}

const ScreenComponent: React.FC<ScreenComponentProps> = ({
  children,
  style,
  contentFlex = false,
  footerLogoOffset,
  showFooter = true,
  constrainToPhoneViewport = true,
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

  const columnStyle: ViewStyle = constrainToPhoneViewport
    ? {
        width: cappedContentWidth,
        maxWidth: cappedContentWidth,
        alignSelf: 'center',
      }
    : {
        width: '100%',
        maxWidth: '100%',
        alignSelf: 'stretch',
      };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        !constrainToPhoneViewport ? styles.safeAreaStretch : null,
      ]}
    >
      <View style={[styles.screenContainer, columnStyle, style]}>
        <View style={{ height: SCREEN_TOP_HEIGHT }} />
        <View
          style={
            contentFlex
              ? styles.flexContent
              : { height: showFooter ? SCREEN_CONTENT_HEIGHT : '85%' }
          }
        >
          {processChildren(children)}
        </View>
        {showFooter ? (
          <View style={{ height: SCREEN_FOOTER_HEIGHT }}>
            <AppScreenFooter logoOffset={footerLogoOffset} />
          </View>
        ) : null}
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
  } as ViewStyle,
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  } as ViewStyle,
  safeAreaStretch: {
    alignItems: 'stretch',
  } as ViewStyle,
});

export default ScreenComponent;
