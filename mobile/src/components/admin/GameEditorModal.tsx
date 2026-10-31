import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ModalSheet from '@/components/ui/ModalSheet';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import {
  analyzeGameGenreAi,
  classifyGameByTitle,
  createGame,
  recognizeGameByImage,
  updateGame,
  uploadBase64Image,
} from '@/api/admin';
import { apiErrorText } from '@/api/client';
import { FONT } from '@/lib/fonts';
import { showToast } from '@/lib/toast';
import type { Category, Game } from '@/api/types';

interface Props {
  visible: boolean;
  game: Game | null;
  categories: Category[];
  genres: string[];
  seriesList: string[];
  onClose: () => void;
  onSaved: () => void;
}

function isPs5Category(categories: Category[], categoryId: number | null): boolean {
  const cat = categories.find((c) => Number(c.id) === Number(categoryId));
  const name = String(cat?.name ?? '').toLowerCase();
  return name.includes('ps5') || name.includes('فايف');
}

/** نافذة إضافة وتعديل لعبة مع رفع غلاف بالكاميرا وتصنيف Gemini الذكي */
export default function GameEditorModal({
  visible,
  game,
  categories,
  genres,
  seriesList,
  onClose,
  onSaved,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [priceText, setPriceText] = useState('');
  const [pricePs5Text, setPricePs5Text] = useState('');
  const [sizeText, setSizeText] = useState('');
  const [genre, setGenre] = useState('');
  const [series, setSeries] = useState('');
  const [features, setFeatures] = useState('');
  const [description, setDescription] = useState('');

  const [cameraOpen, setCameraOpen] = useState(false);
  const [busyUpload, setBusyUpload] = useState(false);
  const [busyAi, setBusyAi] = useState(false);
  const [busySave, setBusySave] = useState(false);

  const ps5Only = isPs5Category(categories, categoryId);

  useEffect(() => {
    if (!visible) return;
    const defaultCat = game?.category_id ?? categories[0]?.id ?? 1;
    // إعادة تهيئة استمارة عند فتح نافذة التحرير (نموذج نافذة مقصود، وليس حالة مشتقة للعرض)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryId(Number(defaultCat));
    setTitle(game?.title ?? '');
    setImage(game?.image ?? '');
    setPriceText(game?.price != null ? String(game.price) : '');
    setPricePs5Text(game?.price_ps5 != null ? String(game.price_ps5) : '');
    setSizeText(game?.size_gb != null ? String(game.size_gb) : '');
    setGenre(game?.genre ?? '');
    setSeries(game?.series ?? '');
    setFeatures(game?.features ?? '');
    setDescription(game?.description ?? '');
    setCameraOpen(false);
  }, [visible, game, categories]);

  const handleCaptureCover = async () => {
    if (!cameraRef.current || busyUpload) return;
    setBusyUpload(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.55,
      });
      if (!photo?.base64) throw new Error('no_base64');
      setCameraOpen(false);
      const uploadedUrl = await uploadBase64Image(`cover_${Date.now()}.jpg`, photo.base64);
      setImage(uploadedUrl);
      showToast('تم رفع صورة الغلاف');

      if (!title.trim()) {
        try {
          const rec = await recognizeGameByImage(photo.base64);
          if (rec?.title) {
            setTitle(rec.title);
            showToast(`تعرّف Gemini على الغلاف: ${rec.title}`);
          }
        } catch {
          // اختياري إن تعذر التعرف
        }
      }
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyUpload(false);
    }
  };

  const handleGeminiFill = async () => {
    if (busyAi) return;
    setBusyAi(true);
    try {
      let currentTitle = title.trim();
      if (!currentTitle && image.trim()) {
        const rec = await recognizeGameByImage(image.trim());
        if (rec?.title) {
          currentTitle = rec.title;
          setTitle(rec.title);
        }
      }
      if (!currentTitle) {
        showToast('أدخل اسم اللعبة أو صورة الغلاف أولاً', 'error');
        return;
      }
      const [cls, ai] = await Promise.all([
        classifyGameByTitle(currentTitle).catch(() => null),
        analyzeGameGenreAi(currentTitle).catch(() => null),
      ]);
      if (ai?.arabicGenre || cls?.genre) setGenre(ai?.arabicGenre || cls?.genre || '');
      if (cls?.series) setSeries(cls.series);
      if (ai?.features) setFeatures(ai.features);
      if (cls?.summary && !description.trim()) setDescription(cls.summary);
      showToast('تم تحليل بيانات اللعبة عبر Gemini');
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyAi(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !image.trim()) {
      showToast('اسم اللعبة ورابط/صورة الغلاف مطلوبان', 'error');
      return;
    }
    setBusySave(true);
    try {
      const payload = {
        title: title.trim(),
        image: image.trim(),
        description: description.trim(),
        price: Number(priceText) || 0,
        price_ps5: ps5Only
          ? null
          : pricePs5Text.trim() !== ''
            ? Number(pricePs5Text)
            : null,
        size_gb: sizeText.trim() !== '' ? Number(sizeText) : null,
        category_id: categoryId,
        genre: genre.trim() || null,
        series: series.trim() || null,
        features: features.trim() || null,
      };
      if (game?.id) {
        await updateGame(game.id, payload);
        showToast('تم تحديث اللعبة');
      } else {
        await createGame(payload);
        showToast('تمت إضافة اللعبة');
      }
      onSaved();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusySave(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={game ? `تعديل: ${game.title}` : 'إضافة لعبة جديدة'}
    >
      <ScrollView
        style={{ maxHeight: 470 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#cbd5e1', fontFamily: FONT.bold, fontSize: 12, textAlign: 'right' }}>
            المنصة / الفئة *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                active={Number(categoryId) === Number(cat.id)}
                onPress={() => setCategoryId(Number(cat.id))}
                accent="#8a5cff"
              />
            ))}
          </ScrollView>

          <AppInput label="اسم اللعبة *" placeholder="مثال: FC 25" value={title} onChangeText={setTitle} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => void handleGeminiFill()}
              style={[toolBtn, { borderColor: 'rgba(167,139,250,0.45)', backgroundColor: 'rgba(138,92,255,0.12)', flex: 1 }]}
            >
              <Icon name="sparkles" size={16} color="#c4b5fd" />
              <Text style={{ color: '#c4b5fd', fontFamily: FONT.bold, fontSize: 12 }}>
                {busyAi ? 'جاري التحليل...' : 'تعبئة ذكية (Gemini)'}
              </Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                if (!permission?.granted) {
                  const res = await requestPermission();
                  if (!res.granted) {
                    showToast('يرجى السماح بالكاميرا', 'error');
                    return;
                  }
                }
                setCameraOpen((v) => !v);
              }}
              style={[toolBtn, { borderColor: 'rgba(45,212,191,0.45)', backgroundColor: 'rgba(20,184,166,0.12)', flex: 1 }]}
            >
              <Icon name="camera" size={16} color="#2dd4bf" />
              <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 12 }}>
                {busyUpload ? 'جاري الرفع...' : 'تصوير ورفع غلاف'}
              </Text>
            </Pressable>
          </View>

          {cameraOpen ? (
            <View style={{ gap: 8 }}>
              <View style={{ height: 180, borderRadius: 12, overflow: 'hidden' }}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
              </View>
              <AppButton label="التقاط ورفع الصورة" icon="camera" onPress={handleCaptureCover} loading={busyUpload} />
            </View>
          ) : null}

          <AppInput
            label="رابط صورة الغلاف *"
            placeholder="/uploads/... أو https://..."
            value={image}
            onChangeText={setImage}
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <AppInput
                label={ps5Only ? 'سعر الفايف (PS5) *' : 'سعر الفور (PS4) *'}
                placeholder="10"
                keyboard="numeric"
                value={priceText}
                onChangeText={setPriceText}
              />
            </View>
            {!ps5Only ? (
              <View style={{ flex: 1 }}>
                <AppInput
                  label="سعر الفايف (اختياري)"
                  placeholder="تلقائياً ضعف الفور"
                  keyboard="numeric"
                  value={pricePs5Text}
                  onChangeText={setPricePs5Text}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <AppInput
                label="الحجم (GB)"
                placeholder="45"
                keyboard="numeric"
                value={sizeText}
                onChangeText={setSizeText}
              />
            </View>
          </View>

          <AppInput
            label="النوع (Genre)"
            placeholder={genres[0] || 'أكشن، رعب، رياضة...'}
            value={genre}
            onChangeText={setGenre}
          />
          <AppInput
            label="السلسلة (Series)"
            placeholder={seriesList[0] || 'Resident Evil, FIFA...'}
            value={series}
            onChangeText={setSeries}
          />
          <AppInput
            label="المميزات (تكتب تقسيم الشاشة إن وجدت)"
            placeholder="تقسيم الشاشة، طور تعاوني..."
            value={features}
            onChangeText={setFeatures}
          />
          <AppInput
            label="الوصف (اختياري)"
            placeholder="نبذة مختصرة عن اللعبة..."
            value={description}
            onChangeText={setDescription}
          />

          <AppButton
            label={game ? 'حفظ التعديلات' : 'إضافة اللعبة للمتجر'}
            icon="check"
            onPress={handleSave}
            loading={busySave}
          />
        </View>
      </ScrollView>
    </ModalSheet>
  );
}

const toolBtn = {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 6,
  borderWidth: 1,
  borderRadius: 12,
  paddingVertical: 11,
  alignItems: 'center',
} as const;
