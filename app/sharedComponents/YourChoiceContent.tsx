import Feather from '@expo/vector-icons/Feather';
import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { API_URL } from '../../constants/Config';
import VerseModule from '../VerseModule/VerseModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// interface BackButtonProps {
//   text: string;
// }

const categoriesToList = [
  { label: 'Anxiety', value: 'Anxiety' },
  { label: 'Acceptance', value: 'Acceptance' },
  { label: 'Assurance', value: 'Assurance' },
  { label: 'Belief', value: 'Belief' },
  { label: 'Blessings', value: 'Blessings' },
  { label: 'Confidence', value: 'Confidence' },
  { label: 'Courage', value: 'Courage' },
  { label: 'Depression', value: 'Depression' },
  { label: 'Encouragement', value: 'Encouragement' },
  { label: 'Faith', value: 'Faith' },
  { label: 'Fear', value: 'Fear' },
  { label: 'Friendship', value: 'Friendship' },
  { label: 'Gratitude', value: 'Gratitude' },
  { label: 'Grief', value: 'Grief' },
  { label: 'Guilt', value: 'Guilt' },
  { label: 'Health', value: 'Health' },
  { label: 'Inspiration', value: 'Inspiration' },
  { label: 'Kindness', value: 'Kindness' },
  { label: 'Loneliness', value: 'Loneliness' },
  { label: 'Love', value: 'Love' },
  { label: 'Peace', value: 'Peace' },
  { label: 'Prayer', value: 'Prayer' },
  { label: 'Protection', value: 'Protection' },
  { label: 'Provision', value: 'Provision' },
  { label: 'Respect', value: 'Respect' },
  { label: 'Salvation', value: 'Salvation' },
  { label: 'Serving', value: 'Serving' },
  { label: 'Stress', value: 'Stress' },
  { label: 'Trust', value: 'Trust' },
  { label: 'Truth', value: 'Truth' },
  { label: 'Worry', value: 'Worry' },
]

const YourChoiceContent: React.FC = () => {
  
  const [verseComponentVisibility, setVerseComponentVisibility] = useState(true)
  const [url, setUrl] = useState("")
  const dropdownRef = useRef<any>(null)

  const updateUrl = (category: string) => {
    setUrl(`${API_URL}/verses/search?category=${category}`)
  };

  const toggleVerseComponent = () => {
    setVerseComponentVisibility(!verseComponentVisibility)
  }

  const handleChevronPress = () => {
    if (dropdownRef.current) {
      // If open() doesn't work, we can use a workaround
      try {
        dropdownRef.current.open?.();
      } catch (e) {
        dropdownRef.current.focus?.();
      }
    }
  }

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
          itemTextStyle={{ color: 'white', textAlign: 'center', fontSize: screenWidth * 0.05, fontWeight: '400' }}
          data={categoriesToList}
          maxHeight={screenHeight * 0.4}
          autoScroll={false}
          activeColor="transparent"
          labelField="label"
          valueField="value"
          placeholder="Select a category"
          containerStyle={styles.containerss}
          onFocus={toggleVerseComponent}
          onBlur={toggleVerseComponent}
          iconColor={'transparent'}
          onChange={item => {
            updateUrl(item.value);
          } } />
      </View>
      {verseComponentVisibility &&
        <View style={styles.chevronContainer}>
          <Pressable onPress={handleChevronPress} style={{paddingLeft:70, paddingRight: 70}}>
            <Feather name="chevron-down" size={screenWidth * 0.065} color="white" />
          </Pressable>
        </View>}
  
        {verseComponentVisibility && <VerseModule data={[]} active={0} url={url} />}
    </>
  );
};

export default YourChoiceContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 44,
    lineHeight: 84,
    fontWeight: 'light',
    textAlign: 'center',
  },
  separator: {
    marginVertical: screenHeight * 0.01,
    width:"80%",
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
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
  icon: {
    marginRight: screenWidth * 0.013,
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
    // fontStyle: 'italic',
  },
  iconStyle: {
    color: 'transparent',
    display: 'none'
  },
  inputSearchStyle: {
    height: screenHeight * 0.05,
    fontSize: screenWidth * 0.04,
  },
  containerss: {
    backgroundColor: 'transparent',
    borderWidth: 0
  }
});

// MVP: make sure it renders