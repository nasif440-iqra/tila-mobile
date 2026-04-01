export interface OnboardingDraft {
  startingPoint: 'new' | 'some_arabic' | 'rusty' | 'can_read' | null;
  userName: string;
  motivation: 'read_quran' | 'pray_confidently' | 'connect_heritage' | 'teach_children' | 'personal_growth' | null;
}
