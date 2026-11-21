import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { VStack } from '@/components/ui/vstack';
import {
  stackGapStyle,
  timerContentStackClassName,
  timerScrollContentClassName,
  timerScrollContentStyle,
} from '@/app/constants/screenLayout';
import { useBabies } from '@/app/context/BabyContext';
import BabyProfileForm from '@/app/sharedComponents/babies/BabyProfileForm';
import ScreenScrollLayout from '@/app/sharedComponents/ScreenScrollLayout';
import {
  buildBabyInput,
  type BabyProfileValues,
} from '@/app/utils/babyProfileForm';

/**
 * Adds another baby with the same form onboarding uses for the first one.
 * On success the app switches to the new baby and returns Home.
 */
const AddBabyScreen: React.FC = () => {
  const navigation = useNavigation<{ navigate: (route: string) => void }>();
  const { addBaby } = useBabies();
  const [babyName, setBabyName] = useState('');
  const [babyBirthdate, setBabyBirthdate] = useState<string | null>(null);
  // Drawer screens stay mounted; start with an empty form on every visit.
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(
      () => () => {
        setBabyName('');
        setBabyBirthdate(null);
        setFormKey((key) => key + 1);
      },
      []
    )
  );

  const handleSubmit = async (values: BabyProfileValues) => {
    // addBaby shows the paywall or an error alert itself when it fails.
    const created = await addBaby(buildBabyInput(values));
    if (created) navigation.navigate('Home');
  };

  return (
    <ScreenScrollLayout
      contentContainerClassName={timerScrollContentClassName}
      contentContainerStyle={timerScrollContentStyle}
      stackClassName={timerContentStackClassName}
    >
      <VStack className={timerContentStackClassName} style={stackGapStyle}>
        <BabyProfileForm
          key={formKey}
          title="Add a baby"
          subtitle="We'll personalize nap guidance for your little one."
          submitLabel="Add baby"
          submitIcon="add-sharp"
          babyName={babyName}
          babyBirthdate={babyBirthdate}
          onBabyNameChange={setBabyName}
          onBabyBirthdateChange={setBabyBirthdate}
          onSubmit={handleSubmit}
        />
      </VStack>
    </ScreenScrollLayout>
  );
};

export default AddBabyScreen;
