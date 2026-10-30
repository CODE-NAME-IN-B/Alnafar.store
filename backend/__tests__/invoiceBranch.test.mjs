import { describe, it, expect } from 'vitest';
import { resolveInvoiceBranchId, toBranchId } from '../invoice-branch.js';

const superAdmin = { id: 1, username: 'owner', role: 'admin', branch_id: 1 };
const branch2Admin = { id: 7, username: 'b2admin', role: 'admin', branch_id: 2 };
const branch2Staff = { id: 9, username: 'b2staff', role: 'staff', branch_id: 2 };

describe('toBranchId', () => {
  it('accepts positive integers', () => {
    expect(toBranchId(2)).toBe(2);
    expect(toBranchId('5')).toBe(5);
  });
  it('rejects invalid values', () => {
    expect(toBranchId(null)).toBeNull();
    expect(toBranchId(undefined)).toBeNull();
    expect(toBranchId('')).toBeNull();
    expect(toBranchId(0)).toBeNull();
    expect(toBranchId(-3)).toBeNull();
    expect(toBranchId('abc')).toBeNull();
    expect(toBranchId('all')).toBeNull();
  });
});

describe('resolveInvoiceBranchId — زائر', () => {
  it('honors body branch_id (فرع الطلب)', () => {
    expect(resolveInvoiceBranchId({ bodyBranchId: 2 })).toBe(2);
  });
  it('honors ?branchId= query when body missing', () => {
    expect(resolveInvoiceBranchId({ queryBranchId: 3 })).toBe(3);
  });
  it('falls back to main branch 1', () => {
    expect(resolveInvoiceBranchId({})).toBe(1);
    expect(resolveInvoiceBranchId({ bodyBranchId: 'garbage' })).toBe(1);
  });
});

describe('resolveInvoiceBranchId — الأدمن الرئيسي', () => {
  it('honors the branch chosen in the store (body.branch_id)', () => {
    expect(resolveInvoiceBranchId({ user: superAdmin, bodyBranchId: 2 })).toBe(2);
  });
  it('honors ?branchId= (الفرع النشط في اللوحة)', () => {
    expect(resolveInvoiceBranchId({ user: superAdmin, queryBranchId: 4 })).toBe(4);
  });
  it('body wins over query', () => {
    expect(resolveInvoiceBranchId({ user: superAdmin, bodyBranchId: 2, queryBranchId: 4 })).toBe(2);
  });
  it('falls back to own branch when nothing requested', () => {
    expect(resolveInvoiceBranchId({ user: superAdmin })).toBe(1);
  });
  it('ignores invalid requested values', () => {
    expect(resolveInvoiceBranchId({ user: superAdmin, bodyBranchId: 0 })).toBe(1);
    expect(resolveInvoiceBranchId({ user: superAdmin, bodyBranchId: 'all' })).toBe(1);
  });
});

describe('resolveInvoiceBranchId — مستخدم فرع (مقيّد بفرعه)', () => {
  it('ignores requested branch — stays on own branch', () => {
    expect(resolveInvoiceBranchId({ user: branch2Staff, bodyBranchId: 5 })).toBe(2);
    expect(resolveInvoiceBranchId({ user: branch2Staff, queryBranchId: 5 })).toBe(2);
  });
  it('admin of a non-main branch is not super — stays on own branch', () => {
    expect(resolveInvoiceBranchId({ user: branch2Admin, bodyBranchId: 5 })).toBe(2);
  });
  it('prefers fresh DB branch over stale token branch (نقل المستخدم بين الفروع)', () => {
    expect(resolveInvoiceBranchId({ user: branch2Staff, dbBranchId: 3 })).toBe(3);
  });
  it('falls back to token branch when DB branch unavailable', () => {
    expect(resolveInvoiceBranchId({ user: branch2Staff, dbBranchId: null })).toBe(2);
  });
});
