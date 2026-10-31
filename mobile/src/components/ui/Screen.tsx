import { StatusBar } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  edges?: Edge[];
}

/** غلاف الشاشة الموحد: خلفية النفار + مساحات آمنة + StatusBar فاتح */
export default function Screen({ children, edges = ['top', 'bottom'] }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
          <StatusBar barStyle="light-content" />
      {children}
    </SafeAreaView>
  );
}

const styles = {
  root: {
    flex: 1,
    backgroundColor: '#0f1724',
  },
};
