import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AR_FONT } from './fonts';
import { usePalette } from './theme';
import Icon, { IconName } from '@/components/ui/Icon';
import Button from './Button';

interface StateProps {
  message: string;
  subMessage?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  subMessage,
  icon = 'package',
  actionLabel,
  onAction,
}: StateProps) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surface,
          borderColor: palette.surfaceLine,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: palette.surfaceRaised,
            borderColor: palette.surfaceLine,
          },
        ]}
      >
        <Icon name={icon} size={28} color={palette.textSub} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>{message}</Text>
      {subMessage ? (
        <Text style={[styles.sub, { color: palette.textSub }]}>{subMessage}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const palette = usePalette();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.surface,
          borderColor: palette.danger + '30',
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: palette.danger + '15',
            borderColor: palette.danger + '30',
          },
        ]}
      >
        <Icon name="close" size={24} color={palette.danger} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>{message}</Text>
      {onRetry ? (
        <Button
          label="إعادة المحاولة"
          icon="refresh"
          onPress={onRetry}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  sub: {
    fontFamily: AR_FONT.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: false,
  },
});
