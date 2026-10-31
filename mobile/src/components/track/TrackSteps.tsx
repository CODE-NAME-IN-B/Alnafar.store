import { Text, View } from 'react-native';
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
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: stepDone ? '#14b8a6' : stepActive ? 'rgba(20,184,166,0.25)' : '#1b2740',
                  borderWidth: 1,
                  borderColor: stepDone ? '#14b8a6' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ color: stepDone ? '#062b27' : '#64748b', fontFamily: FONT.bold }}>
                  {stepDone ? '✓' : String(index + 1)}
                </Text>
              </View>
              <Text
                style={{
                  color: stepDone || stepActive ? '#f1f5f9' : '#64748b',
                  fontFamily: FONT.medium,
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
                  backgroundColor: index < done - 1 ? '#14b8a6' : '#1b2740',
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
