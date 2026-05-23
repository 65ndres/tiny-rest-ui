import Feather from '@expo/vector-icons/Feather';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { BROWSE_CATEGORIES } from '../../constants/sampleItems';
import SampleModule from '../SampleModule/SampleModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const categoriesToList = BROWSE_CATEGORIES.map((c) => ({ label: c, value: c }));

const BrowseContent: React.FC = () => {
  const [moduleVisible, setModuleVisible] = useState(true);
  const [category, setCategory] = useState<string>(BROWSE_CATEGORIES[0]);
  const dropdownRef = useRef<any>(null);

  const toggleModule = () => {
    setModuleVisible(!moduleVisible);
  };

  const handleChevronPress = () => {
    if (dropdownRef.current) {
      try {
        dropdownRef.current.open?.();
      } catch {
        dropdownRef.current.focus?.();
      }
    }
  };

  return (
    <>
      <View style={styles.dropdownContainer}>
        <Dropdown
          ref={dropdownRef}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          itemTextStyle={{
            color: 'white',
            textAlign: 'center',
            fontSize: screenWidth * 0.05,
            fontWeight: '400',
          }}
          data={categoriesToList}
          maxHeight={screenHeight * 0.4}
          autoScroll={false}
          activeColor="transparent"
          labelField="label"
          valueField="value"
          placeholder="Select a category"
          containerStyle={styles.containerss}
          onFocus={toggleModule}
          onBlur={toggleModule}
          iconColor="transparent"
          onChange={(item) => {
            setCategory(item.value);
          }}
        />
      </View>
      {moduleVisible && (
        <View style={styles.chevronContainer}>
          <Pressable
            onPress={handleChevronPress}
            style={{ paddingLeft: 70, paddingRight: 70 }}
          >
            <Feather name="chevron-down" size={screenWidth * 0.065} color="white" />
          </Pressable>
        </View>
      )}

      {moduleVisible && (
        <SampleModule source="category" category={category} active={0} />
      )}
    </>
  );
};

export default BrowseContent;

const styles = StyleSheet.create({
  dropdownContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  dropdown: {
    height: screenHeight * 0.06,
    backgroundColor: 'transparent',
    textAlign: 'center',
    borderWidth: 0,
    width: '100%',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },
  placeholderStyle: {
    fontSize: screenWidth * 0.06,
    color: 'white',
    textAlign: 'center',
    fontWeight: '400',
  },
  selectedTextStyle: {
    fontSize: screenWidth * 0.06,
    color: 'white',
    textAlign: 'center',
    fontWeight: '400',
  },
  iconStyle: {
    color: 'transparent',
    display: 'none',
  },
  inputSearchStyle: {
    height: screenHeight * 0.05,
    fontSize: screenWidth * 0.04,
  },
  containerss: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
