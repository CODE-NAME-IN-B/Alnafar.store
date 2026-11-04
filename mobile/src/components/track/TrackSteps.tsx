import { Text, View } from 'react-native';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { colors } from '@/lib/colors';
import { TRACK_STEPS, stepIndexFor, type OrderStatus } from '@/lib/statuses';

/** مؤشر الخطوات الثلاث (تم الاستلام ← جاري التجهيز ← جاهز للاستلام) */
export default function TrackSteps({ status }: { status: OrderStatus }) {
  const { current, done } = stepIndexFor(status);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18 }}>
      {TRACK_STEPS.map((label, index) => {
        const stepDone = index < done;
        const stepActive = index === current && !stepDone;
        return (
          <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: stepDone
                    ? colors.brand
                    : stepActive
                      ? colors.brandSoft
                      : colors.surfaceRaised,
                  borderWidth: 1.5,
                  borderColor: stepDone || stepActive ? colors.brandLight : colors.borderSubtle,
                }}
              >
                {stepDone ? (
                  <Icon name="check" size={16} color={colors.brandDark} strokeWidth={2.5} />
                ) : (
                  <Text
                    style={{
                      color: stepActive ? colors.brandLight : colors.faint,
                      fontFamily: FONT.bold,
                      fontSize: 13,
                    }}
                  >
                    {String(index + 1)}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  color: stepDone || stepActive ? colors.text : colors.faint,
                  fontFamily: FONT.bold,
                  fontSize: 12,
                  lineHeight: 18,
                  marginTop: 6,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {label}
              </Text>
            </View>
            {index < TRACK_STEPS.length - 1 ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  /* الخط يمتد حتى العقدة الحالية لا قبلها — لا انقطاع في
                     مؤشر الخطوات عند أكثر لحظة يهم فيها */
                  backgroundColor: index < done ? colors.brand : colors.surfaceRaised,
                  marginHorizontal: 6,
                  marginBottom: 20,
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
