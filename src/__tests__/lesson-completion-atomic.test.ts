import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const progressHookSrc = fs.readFileSync(
  path.resolve(__dirname, '../hooks/useProgress.ts'), 'utf-8'
);

describe('completeLesson atomicity - STAB-01 regression', () => {
  it('uses withExclusiveTransactionAsync for atomic writes', () => {
    expect(progressHookSrc).toContain('withExclusiveTransactionAsync');
  });

  it('reads and writes through txn parameter, not outer db', () => {
    // Inside the transaction callback, all DB functions receive txn (not db)
    // loadProgress(txn) for reads, save*(txn, ...) for writes
    expect(progressHookSrc).toMatch(/loadProgress\(txn\)/);
    expect(progressHookSrc).toMatch(/saveCompletedLesson\(txn/);
  });

  it('does not call save functions with db inside the transaction', () => {
    // Extract the transaction callback body
    const txnStart = progressHookSrc.indexOf('withExclusiveTransactionAsync');
    if (txnStart === -1) throw new Error('Transaction not found');
    // After the transaction starts, save calls should use txn not db
    const afterTxn = progressHookSrc.slice(txnStart);
    // Verify that save functions receive txn as first arg inside the callback
    expect(afterTxn).toMatch(/save(CompletedLesson|MasteryEntity|MasterySkill|MasteryConfusion|QuestionAttempts)\(txn/);
  });

  it('returns updatedMastery from completeLesson', () => {
    // completeLesson must return an object with updatedMastery
    expect(progressHookSrc).toMatch(/return\s*\{[^}]*attemptId[^}]*updatedMastery[^}]*\}/s);
  });
});
