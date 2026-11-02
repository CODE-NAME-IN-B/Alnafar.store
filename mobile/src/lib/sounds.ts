/**
 * أصوات التطبيق — نغمة نجاح قصيرة عند إضافة لعبة/باقة للسلة.
 * تعتمد مكتبة expo-audio (مصريحة SDK 58 بدل expo-av المهجورة) وتفشل بصمت دائماً:
 * الصوت تحسين تجربي ولا يجب أن يعطّل التدفق أبداً.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SUCCESS = require('../../assets/sounds/success.wav');

let player: AudioPlayer | null = null;

async function ensurePlayer(): Promise<AudioPlayer | null> {
  if (player) return player;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      // صوت UI: قصير، لا مرتبط بتحكم إعلامي
    });
    player = createAudioPlayer(SUCCESS);
    return player;
  } catch {
    return null;
  }
}

/** نغمة النجاح — تعاود بناء اللاعب عند الفشل، ولا ترمي أخطاء أبداً */
export function playSuccessSound(): void {
  void (async () => {
    try {
      const p = await ensurePlayer();
      if (!p) return;
      p.seekTo(0);
      p.play();
    } catch {
      /* الصوت عنصر زينة — تجاهل الفشل */
    }
  })();
}
