import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  keyboard?: KeyboardTypeOptions;
  secure?: boolean;
  error?: string | null;
  icon?: IconName;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  testID?: string;
  classNameExtra?: string;
  /** تركيز الحقل فور ظهور النافذة (الحقل الأول من الاستمارة) */
  autoFocus?: boolean;
  /** للوصول إلى input الحقيقي — سلسلة «التالي» بين حقول الاستمارة */
  inputRef?: (t: TextInputInstance | null) => void;
}

export default function AppInput({
  value,
  onChangeText,
  placeholder,
  label,
  multiline,
  keyboard,
  secure,
  error,
  icon,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize = 'none',
  testID,
  autoFocus,
  inputRef,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));
  const palette = usePalette();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: palette.textSub }]}>{label}</Text> : null}
      <View
        style={[
          styles.fieldWrap,
          multiline && styles.fieldMultiline,
          {
            backgroundColor: palette.surfaceRaised,
            borderColor: error ? palette.danger : focused ? palette.primary : palette.surfaceLine,
          },
        ]}
      >
        {icon ? (
          <View style={styles.iconSlot}>
            <Icon name={icon} size={18} color={focused ? palette.primary : palette.textFaint} />
          </View>
        ) : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.textFaint}
          multiline={multiline}
          keyboardType={keyboard}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlign="right"
          autoFocus={autoFocus}
          ref={inputRef}
          style={[styles.input, { color: palette.text }, multiline && styles.inputMultiline]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            style={styles.eyeBtn}
          >
            <Icon name={hidden ? 'eye' : 'eye-off'} size={18} color={palette.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontFamily: AR_FONT.semibold,
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  fieldWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  fieldMultiline: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  iconSlot: {
    marginLeft: 8,
  },
  eyeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 15,
    paddingVertical: 10,
    writingDirection: 'rtl',
    textAlign: 'right',
    includeFontPadding: false,
  },
  inputMultiline: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
