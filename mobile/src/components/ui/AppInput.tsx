import { TextInput, Text, View } from 'react-native';
import { FONT } from '@/lib/fonts';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  keyboard?: 'default' | 'phone-pad' | 'numeric' | 'visible-password';
  secure?: boolean;
  error?: string | null;
  classNameExtra?: string;
}

/** حقل إدخال موحد (رأس ومربع بنفس أسلوب الواجهة الويب) */
export default function AppInput({
  value,
  onChangeText,
  placeholder,
  label,
  multiline = false,
  keyboard = 'default',
  secure = false,
  error,
}: Props) {
  return (
    <View>
      {label ? (
        <Text style={{ color: '#94a3b8', fontFamily: FONT.medium, fontSize: 13, marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboard === 'phone-pad' ? 'phone-pad' : keyboard}
        textAlign="right"
        style={{
          backgroundColor: '#10203a',
          color: '#f1f5f9',
          fontFamily: FONT.regular,
          fontSize: 15,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          textAlignVertical: 'top',
          borderWidth: 1,
          borderColor: error ? '#ef4444' : 'rgba(255,255,255,0.08)',
        }}
      />
      {error ? (
        <Text
          style={{
            color: '#ef4444',
            fontFamily: FONT.regular,
            fontSize: 12,
            marginTop: 6,
            textAlign: 'right',
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
