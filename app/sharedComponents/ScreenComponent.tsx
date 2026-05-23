import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;
// Define the navigation stack param list
type RootStackParamList = {
  Home: undefined;
  VerseModule: undefined;
};

// Type the navigation prop

// Type the Home component
interface ScreenComponentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const ScreenComponent: React.FC<ScreenComponentProps> = ({ children, style }) => {
  // Helper function to wrap string/number children in Text component
  const processChildren = (children: React.ReactNode): React.ReactNode => {
    // Handle null, undefined, or boolean
    if (children == null || typeof children === 'boolean') {
      return null;
    }

    // If children is a single string or number, wrap it directly
    if (typeof children === 'string' || typeof children === 'number') {
      return <Text>{children}</Text>;
    }

    // If children is an array, process each child
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (child == null || typeof child === 'boolean') {
          return null;
        }
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={index}>{child}</Text>;
        }
        // If it's a valid React element, recursively process its children if needed
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

    // If it's a valid React element with children, recursively process
    if (React.isValidElement(children)) {
      const props = children.props as { children?: React.ReactNode };
      if (props.children) {
        return React.cloneElement(children, {
          ...props,
          children: processChildren(props.children),
        } as any);
      }
    }

    // Return as-is for other cases
    return children;
  };

  return (

      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screenContainer, style]}>
      {processChildren(children)}
        </View>
      </SafeAreaView>
  
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    // Same as app.json splash — avoids a transparent flash before bg.jpg decodes on new screens
    backgroundColor: '#6E9AB1',
  } as ViewStyle,
  screenContainer: {
    width: width * 0.84,
  } as ViewStyle, 
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    
  } as ViewStyle,
  })
export default ScreenComponent;