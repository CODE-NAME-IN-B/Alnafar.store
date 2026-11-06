import { StatusBar } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { usePalette, useThemeName } from '@/design/theme';

interface Props {
  children: ReactNode;
  edges?: Edge[];
}

/** غلاف الشاشة الموحد: خلفية الهوية (كريمي/حبر) + مساحات آمنة + StatusBar حسب السمة */
export default function Screen({ children, edges = ['top', 'bottom'] }: Props) {
  const palette = usePalette();
  const theme = useThemeName();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.canvas }]} edges={edges}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {children}
    </SafeAreaView>
  );
}

const styles = {
  root: {
    flex: 1,
  },
};
