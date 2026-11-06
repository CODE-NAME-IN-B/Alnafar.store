import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';
import Icon from '@/components/ui/Icon';
import { triggerLightHaptic } from '@/lib/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterCount?: number;
  style?: ViewStyle;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'بحث...',
  onFilterPress,
  filterCount = 0,
  style,
}: Props) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.surfaceRaised,
          borderColor: palette.surfaceLine,
        },
        style,
      ]}
    >
      <Icon name="search" size={18} color={palette.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textFaint}
        textAlign="right"
        style={[styles.input, { color: palette.text }]}
      />
      {value ? (
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onChangeText('');
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="مسح نص البحث"
        >
          <Icon name="close" size={18} color={palette.textFaint} />
        </Pressable>
      ) : null}
      {onFilterPress ? (
        <Pressable
          onPress={() => {
            triggerLightHaptic();
            onFilterPress();
          }}
          style={[
            styles.filterBtn,
            filterCount > 0
              ? { backgroundColor: palette.primary }
              : { backgroundColor: palette.surface, borderColor: palette.surfaceLine, borderWidth: 1 },
          ]}
        >
          <Icon
            name="filter"
            size={14}
            color={filterCount > 0 ? palette.onPrimary : palette.textSub}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: filterCount > 0 ? palette.onPrimary : palette.textSub,
              },
            ]}
          >
            {filterCount > 0 ? `فلترة (${filterCount})` : 'فلترة'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchField;

const styles = StyleSheet.create({
  container: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 13.5,
    paddingVertical: 6,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    fontFamily: AR_FONT.bold,
    fontSize: 12,
    includeFontPadding: false,
  },
});
