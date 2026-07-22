import { useAppTheme } from '@/features/downloader/hooks/useAppTheme';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ThemeSetting } from '@/shared/models/ThemeSettings';
import { Label } from '../ui/label';
import { useEffect, useState } from 'react';

const ThemeSelector = () => {
  const { theme, setAppTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  //   useEffect(() => {
  //     setMounted(true);
  //   }, []);

  //   if (!mounted) {
  //     return null;
  //   }

  return (
    <RadioGroup
      value={theme}
      onValueChange={(value) => setAppTheme(value as ThemeSetting)}
      className='space-y-3'
    >
      <div className='flex items-center space-x-2'>
        <RadioGroupItem value='light' id='theme-light' />
        <Label htmlFor='theme-light'>Light</Label>
      </div>
      <div className='flex items-center space-x-2'>
        <RadioGroupItem value='dark' id='theme-dark' />
        <Label htmlFor='theme-dark'>Dark</Label>
      </div>
      <div className='flex items-center space-x-2'>
        <RadioGroupItem value='system' id='theme-system' />
        <Label htmlFor='theme-system'>System</Label>
      </div>
    </RadioGroup>
  );
};

export default ThemeSelector;
