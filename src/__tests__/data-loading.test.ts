import { describe, it, expect } from 'vitest';
import type { HabitState, ProgressState, UserProfileUpdate } from '../engine/progress';

describe('HabitState shape', () => {
  it('has all required fields', () => {
    const defaultHabit: HabitState = {
      lastPracticeDate: null,
      currentWird: 0,
      longestWird: 0,
      todayLessonCount: 0,
    };
    expect(defaultHabit).toHaveProperty('lastPracticeDate');
    expect(defaultHabit).toHaveProperty('currentWird');
    expect(defaultHabit).toHaveProperty('longestWird');
    expect(defaultHabit).toHaveProperty('todayLessonCount');
    expect(Object.keys(defaultHabit)).toHaveLength(4);
  });
});

describe('ProgressState shape', () => {
  it('has returnHadithLastShown as a typed field', () => {
    const partial: Pick<ProgressState, 'returnHadithLastShown'> = {
      returnHadithLastShown: null,
    };
    expect(partial).toHaveProperty('returnHadithLastShown');
  });

  it('has all expected top-level fields', () => {
    const requiredKeys: (keyof ProgressState)[] = [
      'completedLessonIds', 'mastery', 'habit', 'onboarded',
      'onboardingStartingPoint', 'onboardingMotivation',
      'onboardingDailyGoal', 'onboardingCommitmentComplete',
      'onboardingVersion', 'wirdIntroSeen', 'postLessonOnboardSeen',
      'returnHadithLastShown',
    ];
    expect(requiredKeys).toHaveLength(12);
  });
});

describe('onboarding persistence contract', () => {
  it('UserProfileUpdate accepts the fields handleFinish writes', () => {
    const onboardingFinishPayload: UserProfileUpdate = {
      onboarded: true,
      onboardingVersion: 2,
      startingPoint: 'new',
      commitmentComplete: true,
    };
    expect(onboardingFinishPayload).toHaveProperty('onboarded', true);
    expect(onboardingFinishPayload).toHaveProperty('onboardingVersion', 2);
    expect(onboardingFinishPayload).toHaveProperty('startingPoint', 'new');
    expect(onboardingFinishPayload).toHaveProperty('commitmentComplete', true);
  });

  it('all valid startingPoint values are accepted', () => {
    const validValues = ['new', 'some_arabic', 'rusty', 'can_read'] as const;
    for (const val of validValues) {
      const payload: UserProfileUpdate = { startingPoint: val };
      expect(payload.startingPoint).toBe(val);
    }
  });
});
