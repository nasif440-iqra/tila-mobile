import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../auth/hooks';
import { useColors } from '../../design/theme';
import { fontFamilies, typography, spacing, radii, shadows } from '../../design/tokens';
import { track } from '../../analytics';

type AuthMode = 'sign_in' | 'sign_up';

export function AuthScreen() {
  const colors = useColors();
  const router = useRouter();
  const auth = useAuth();

  const [mode, setMode] = useState<AuthMode>('sign_up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('auth_screen_viewed', { source: 'direct' });
  }, []);

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setActiveMethod('email');
    setError(null);

    track('auth_method_selected', { method: 'email', mode });

    const result =
      mode === 'sign_up'
        ? await auth.signUpWithEmail(email.trim(), password)
        : await auth.signInWithEmail(email.trim(), password);

    setLoading(false);
    setActiveMethod(null);

    if (result.error) {
      setError(result.error.message);
    } else {
      router.back();
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setActiveMethod('apple');
    setError(null);

    track('auth_method_selected', { method: 'apple', mode });

    const result = await auth.signInWithApple();
    setLoading(false);
    setActiveMethod(null);

    if (result.error) {
      setError(result.error.message);
    } else {
      router.back();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setActiveMethod('google');
    setError(null);

    track('auth_method_selected', { method: 'google', mode });

    const result = await auth.signInWithGoogle();
    setLoading(false);
    setActiveMethod(null);

    if (result.error) {
      setError(result.error.message);
    } else {
      router.back();
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'sign_in' ? 'sign_up' : 'sign_in'));
    setError(null);
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;
  const title = mode === 'sign_up' ? 'Create Account' : 'Sign In';
  const submitLabel = mode === 'sign_up' ? 'Create Account' : 'Sign In';
  const toggleText =
    mode === 'sign_up'
      ? 'Already have an account? Sign in'
      : "Don't have an account? Create one";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Social auth buttons */}
          <View style={styles.socialSection}>
            {Platform.OS === 'ios' && (
              <Pressable
                style={[
                  styles.socialButton,
                  { backgroundColor: colors.black },
                ]}
                onPress={handleAppleSignIn}
                disabled={loading}
                accessibilityRole="button"
              >
                {activeMethod === 'apple' ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={[styles.socialButtonText, { color: colors.white }]}>
                    Continue with Apple
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              style={[
                styles.socialButton,
                { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={handleGoogleSignIn}
              disabled={loading}
              accessibilityRole="button"
            >
              {activeMethod === 'google' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={[styles.socialButtonText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email/password form */}
          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgCard,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.bgCard,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
              editable={!loading}
            />

            <Pressable
              style={[
                styles.submitButton,
                {
                  backgroundColor: isFormValid && !loading ? colors.accent : colors.border,
                },
              ]}
              onPress={handleEmailSubmit}
              disabled={!isFormValid || loading}
              accessibilityRole="button"
            >
              {activeMethod === 'email' ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: isFormValid ? colors.white : colors.textMuted },
                  ]}
                >
                  {submitLabel}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Toggle sign in / sign up */}
          <Pressable
            onPress={toggleMode}
            style={styles.toggleButton}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {toggleText}
            </Text>
          </Pressable>

          {/* Error display */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  backText: {
    ...typography.bodyLarge,
  },
  title: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  headerSpacer: {
    width: 50,
  },
  socialSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  socialButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.card,
  },
  socialButtonText: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.bodySmall,
    marginHorizontal: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.body,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  submitButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: spacing.xs,
  },
  submitButtonText: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  toggleText: {
    ...typography.body,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radii.md,
  },
  errorText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
