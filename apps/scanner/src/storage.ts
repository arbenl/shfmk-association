import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocalCheckIn {
  registrationId: string;
  scannedAt: string;
  name: string;
  cat: string;
  conf: string;
}

const STORAGE_KEY = "shfmk_checkins";

export async function getCheckIns(): Promise<LocalCheckIn[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalCheckIn[];
  } catch (error) {
    console.error("Failed to parse cached check-ins", error);
    return [];
  }
}

export async function saveCheckIn(entry: LocalCheckIn) {
  const current = await getCheckIns();
  const updated = [entry, ...current.filter((c) => c.registrationId !== entry.registrationId)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearCheckIns(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

const ADMIN_SECRET_KEY = "shfmk_admin_secret";

export async function saveAdminSecret(secret: string): Promise<void> {
  await AsyncStorage.setItem(ADMIN_SECRET_KEY, secret);
}

export async function getAdminSecret(): Promise<string> {
  return (await AsyncStorage.getItem(ADMIN_SECRET_KEY)) ?? "";
}
