import { useState } from 'react';
import { colors } from '@/lib/colors';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  createBranch,
  createUser,
  deactivateUser,
  deleteBranch,
  fetchUsers,
  updateBranch,
  updateUser,
} from '@/api/admin';
import { fetchBranches } from '@/api/branches';
import { apiErrorText } from '@/api/client';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { showToast } from '@/lib/toast';

interface Props {
  mode: 'users' | 'branches';
}

/** قسم إدارة المستخدمين (للمدير) وإدارة الفروع (للمدير الرئيسي) */
export default function UsersBranchesSection({ mode }: Props) {
  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchUsers,
    enabled: mode === 'users',
  });
  const branchesQ = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [userBranchId, setUserBranchId] = useState<number>(1);
  const [busyUser, setBusyUser] = useState(false);

  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [busyBranch, setBusyBranch] = useState(false);

  const handleAddUser = async () => {
    if (!username.trim() || password.length < 6) {
      showToast('اسم المستخدم وكلمة مرور (6 أحرف على الأقل) مطلوبان', 'error');
      return;
    }
    setBusyUser(true);
    try {
      await createUser({
        username: username.trim(),
        password,
        full_name: fullName.trim() || username.trim(),
        role,
        branch_id: userBranchId,
      });
      setUsername('');
      setPassword('');
      setFullName('');
      showToast('تم إنشاء المستخدم بنجاح');
      await usersQ.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyUser(false);
    }
  };

  const handleAddBranch = async () => {
    if (!branchName.trim()) {
      showToast('اسم الفرع مطلوب', 'error');
      return;
    }
    setBusyBranch(true);
    try {
      await createBranch({
        name: branchName.trim(),
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        is_active: true,
      });
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
      showToast('تم إنشاء الفرع بنجاح');
      await branchesQ.refetch();
    } catch (err) {
      showToast(apiErrorText(err), 'error');
    } finally {
      setBusyBranch(false);
    }
  };

  if (mode === 'users') {
    return (
      <View style={{ gap: 10 }}>
        <View style={card}>
          <Text style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 15, textAlign: 'right' }}>
            إضافة مستخدم جديد
          </Text>
          <AppInput label="اسم المستخدم *" placeholder="staff2" value={username} onChangeText={setUsername} />
          <AppInput label="الاسم الكامل" placeholder="أحمد محمد" value={fullName} onChangeText={setFullName} />
          <AppInput
            label="كلمة المرور (6 أحرف فأكثر) *"
            placeholder="••••••"
            secure
            value={password}
            onChangeText={setPassword}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="موظف (Staff)" active={role === 'staff'} onPress={() => setRole('staff')} />
            <Chip label="مدير (Admin)" active={role === 'admin'} onPress={() => setRole('admin')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {(branchesQ.data ?? []).map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                active={userBranchId === b.id}
                onPress={() => setUserBranchId(b.id)}
              />
            ))}
          </ScrollView>
          <AppButton label="إنشاء حساب المستخدم" icon="plus" onPress={handleAddUser} loading={busyUser} />
        </View>

        {(usersQ.data ?? []).map((u) => (
          <View key={u.id} style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 14, textAlign: 'right' }}>
                {u.full_name || u.username} (@{u.username})
              </Text>
              <Text style={{ color: colors.faint, fontFamily: FONT.regular, fontSize: 12, textAlign: 'right' }}>
                الدور: {u.role === 'admin' ? 'مدير' : 'موظف'} • فرع #{u.branch_id ?? 1}{' '}
                {u.is_active === 0 ? '• معطّل' : ''}
              </Text>
            </View>
            {u.id !== 1 ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={async () => {
                    try {
                      await updateUser(u.id, { is_active: u.is_active ? 0 : 1 });
                      showToast('تم تحديث حالة المستخدم');
                      await usersQ.refetch();
                    } catch (err) {
                      showToast(apiErrorText(err), 'error');
                    }
                  }}
                  style={actBtn('#f59e0b')}
                >
                  <Text style={{ color: colors.warningText, fontFamily: FONT.bold, fontSize: 11 }}>
                    {u.is_active ? 'تعطيل' : 'تفعيل'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    try {
                      await deactivateUser(u.id);
                      showToast('تم تعطيل المستخدم');
                      await usersQ.refetch();
                    } catch (err) {
                      showToast(apiErrorText(err), 'error');
                    }
                  }}
                  style={actBtn('#ef4444')}
                >
                  <Text style={{ color: colors.dangerText, fontFamily: FONT.bold, fontSize: 11 }}>إيقاف</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={card}>
        <Text style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 15, textAlign: 'right' }}>
          إضافة فرع جديد
        </Text>
        <AppInput label="اسم الفرع *" placeholder="فرع وسط البلاد" value={branchName} onChangeText={setBranchName} />
        <AppInput label="العنوان" placeholder="الشارع / المعلم..." value={branchAddress} onChangeText={setBranchAddress} />
        <AppInput
          label="هاتف واتساب الفرع"
          placeholder="092XXXXXXX"
          keyboard="phone-pad"
          value={branchPhone}
          onChangeText={setBranchPhone}
        />
        <AppButton label="إنشاء الفرع" icon="plus" onPress={handleAddBranch} loading={busyBranch} />
      </View>

      {(branchesQ.data ?? []).map((b) => (
        <View key={b.id} style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontFamily: FONT.bold, fontSize: 14, textAlign: 'right' }}>
              {b.name} {b.is_main ? '• رئيسي' : ''} {!b.is_active ? '• متوقف' : ''}
            </Text>
            {b.address ? (
              <Text style={{ color: colors.faint, fontFamily: FONT.regular, fontSize: 12, textAlign: 'right' }}>
                {b.address}
              </Text>
            ) : null}
            {b.phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Icon name="phone" size={13} color="#2dd4bf" />
                <Text style={{ color: colors.brandLight, fontFamily: FONT.medium, fontSize: 12 }}>
                  {b.phone}
                </Text>
              </View>
            ) : null}
          </View>
          {!b.is_main ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={async () => {
                  try {
                    await updateBranch(b.id, { is_active: b.is_active ? 0 : 1 });
                    showToast('تم تحديث الفرع');
                    await branchesQ.refetch();
                  } catch (err) {
                    showToast(apiErrorText(err), 'error');
                  }
                }}
                style={actBtn('#f59e0b')}
              >
                <Text style={{ color: colors.warningText, fontFamily: FONT.bold, fontSize: 11 }}>
                  {b.is_active ? 'إيقاف' : 'تفعيل'}
                </Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  try {
                    await deleteBranch(b.id);
                    showToast('تم حذف/تعطيل الفرع');
                    await branchesQ.refetch();
                  } catch (err) {
                    showToast(apiErrorText(err), 'error');
                  }
                }}
                style={actBtn('#ef4444')}
              >
                <Text style={{ color: colors.dangerText, fontFamily: FONT.bold, fontSize: 11 }}>حذف</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const card = {
  backgroundColor: colors.elevated,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  padding: 14,
  gap: 8,
} as const;

const actBtn = (color: string) =>
  ({
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: color,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  }) as const;
