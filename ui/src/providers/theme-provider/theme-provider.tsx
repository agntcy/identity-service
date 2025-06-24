import {useThemeStore} from '@/store';
import {ThemeProvider as SparkThemeProvider} from '@outshift/spark-design';
import {useShallow} from 'zustand/react/shallow';

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const {isDarkMode} = useThemeStore(
    useShallow((store) => ({
      isDarkMode: store.isDarkMode
    }))
  );
  return <SparkThemeProvider isDarkMode={isDarkMode}>{children}</SparkThemeProvider>;
};
