// ── تحديد الفرع الذي تُنسب إليه فاتورة جديدة (POST /api/invoices) ──
// القواعد:
//  1) زائر (بدون توكن صالح): يُحترم الفرع المطلوب من الحمولة ?branch_id أو ?branchId= وإلا الرئيسي 1
//  2) الأدمن الرئيسي (role=admin + الفرع 1): يُحترم الفرع المختار في المتجر/اللوحة
//  3) أي مستخدم آخر (مشرف/موظف فرع): مقيّد دائماً بفرعه — يتجاوز طلبه مهما أرسل
//     (يتسق مع branchScopeFor الذي يقيّد القراءة والتعديل والدفع والحذف بفرع المستخدم)
//
// dbBranchId: الفرع الفعلي من جدول users — يحمي من توكن قديم (7 أيام) بعد نقل
// المستخدم إلى فرع آخر، فيُنسب للفرع الصحيح بدل فرع التوكن القديم.

function toBranchId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function resolveInvoiceBranchId({ user = null, bodyBranchId, queryBranchId, dbBranchId } = {}) {
  const requested = toBranchId(bodyBranchId) ?? toBranchId(queryBranchId);

  // زائر: الفرع المطلوب وإلا الرئيسي
  if (!user) return requested ?? 1;

  // فرع المستخدم الفعلي: قاعدة البيانات أولاً، وإلا فرع التوكن، وإلا الرئيسي
  const ownBranch = toBranchId(dbBranchId) ?? toBranchId(user.branch_id) ?? 1;

  // الأدمن الرئيسي يختار الفرع؛ غيره مقيّد بفرعه
  const isSuper = !!(user.role === 'admin' && Number(user.branch_id || 1) === 1);
  if (isSuper) return requested ?? ownBranch;
  return ownBranch;
}

module.exports = { resolveInvoiceBranchId, toBranchId };
