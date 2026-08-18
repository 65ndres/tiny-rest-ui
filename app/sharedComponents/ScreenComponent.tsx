import React, { useCallback, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
const FOCUS_FADE_IN_MS = 220;

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
  /** When false, skips the focus fade-in (for screens with custom transitions). */
  enableFocusFade?: boolean;
}

const ScreenComponent: React.FC<ScreenComponentProps> = ({
  children,
  style,
  contentFlex = false,
  footerLogoOffset,
  showFooter = true,
  constrainToPhoneViewport = true,
  enableFocusFade = true,
}) => {
  // Start visible so a navigator remount (login/logout) cannot leave the body
  // stuck at opacity 0 if a spurious blur races the first focus fade.
  const opacity = useRef(new Animated.Value(1)).current;
  const hasFocusedRef = useRef(false);
  const fadeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!enableFocusFade) return;

      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        opacity.setValue(1);
        return () => {
          fadeAnimRef.current?.stop();
          fadeAnimRef.current = null;
        };
      }

      opacity.setValue(0);
      const anim = Animated.timing(opacity, {
        toValue: 1,
        duration: FOCUS_FADE_IN_MS,
        useNativeDriver: true,
      });
      fadeAnimRef.current = anim;
      anim.start();

      return () => {
        fadeAnimRef.current?.stop();
        fadeAnimRef.current = null;
      };
    }, [enableFocusFade, opacity])
  );

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
      <Animated.View
        style={[styles.screenContainer, columnStyle, style, { opacity }]}
      >
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
      </Animated.View>
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
