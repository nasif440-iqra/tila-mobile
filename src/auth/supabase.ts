import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';

/**
 * LargeSecureStore: encrypts Supabase session data stored in AsyncStorage
 * with an AES-256 key kept in SecureStore (iOS Keychain / Android Keystore).
 *
 * Supabase sessions exceed SecureStore's 2KB per-item limit, so we use
 * AsyncStorage for the payload and SecureStore only for the 32-byte key.
 */
class LargeSecureStore {
  private async _getEncryptionKey(): Promise<Uint8Array> {
    const existing = await SecureStore.getItemAsync('supabase-encryption-key');
    if (existing) {
      return aesjs.utils.hex.toBytes(existing);
    }
    const key = crypto.getRandomValues(new Uint8Array(32));
    await SecureStore.setItemAsync(
      'supabase-encryption-key',
      aesjs.utils.hex.fromBytes(key),
    );
    return key;
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    const encKey = await this._getEncryptionKey();
    const bytes = aesjs.utils.hex.toBytes(encrypted);
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey);
    const decrypted = aesCtr.decrypt(bytes);
    return aesjs.utils.utf8.fromBytes(decrypted);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encKey = await this._getEncryptionKey();
    const bytes = aesjs.utils.utf8.toBytes(value);
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey);
    const encrypted = aesCtr.encrypt(bytes);
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
