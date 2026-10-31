import { Text, View } from 'react-native';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
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
                    ? '#14b8a6'
                    : stepActive
                      ? 'rgba(20,184,166,0.25)'
                      : '#1b2b48',
                  borderWidth: 1.5,
                  borderColor: stepDone || stepActive ? '#2dd4bf' : 'rgba(255,255,255,0.12)',
                }}
              >
                {stepDone ? (
                  <Icon name="check" size={16} color="#ffffff" strokeWidth={2.5} />
                ) : (
                  <Text
                    style={{
                      color: stepActive ? '#2dd4bf' : '#94a3b8',
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
                  color: stepDone || stepActive ? '#f8fafc' : '#94a3b8',
                  fontFamily: FONT.bold,
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            </View>
            {index < TRACK_STEPS.length - 1 ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: index < done - 1 ? '#14b8a6' : '#1b2b48',
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
