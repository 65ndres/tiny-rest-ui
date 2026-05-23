import { Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import React from 'react';

interface BackButtonProps {
  text: string;
}

const BackButton: React.FC<BackButtonProps> = ({ text }) => {
  const router = useRouter();

  return (
    <Button
      title={text}
      type="clear"
      titleStyle={{ color: 'white', fontWeight: 'bold' }}
      onPress={() => router.push(`/${text.toLowerCase()}`)}
    />
  );
};

export default BackButton;
