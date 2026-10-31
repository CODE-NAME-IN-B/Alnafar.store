import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Icon, { IconName } from './Icon';
import { FONT } from '@/lib/fonts';
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
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.fieldWrap,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {icon ? (
          <View style={styles.iconSlot}>
            <Icon name={icon} size={18} color={focused ? '#2dd4bf' : '#64748b'} />
          </View>
        ) : null}
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
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
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            style={styles.eyeBtn}
          >
            <Icon name={hidden ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontFamily: FONT.semibold,
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  fieldWrap: {
    flexDirection: ROW,
    alignItems: 'center',
    backgroundColor: '#0b1324',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  fieldMultiline: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  fieldFocused: {
    borderColor: '#14b8a6',
    backgroundColor: '#0f1b33',
  },
  fieldError: {
    borderColor: '#ef4444',
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
    fontFamily: FONT.medium,
    color: '#f8fafc',
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
    fontFamily: FONT.medium,
    color: '#f87171',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
