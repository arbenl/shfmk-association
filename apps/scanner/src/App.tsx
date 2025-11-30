import "expo-standard-web-crypto";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Camera, CameraPermissionStatus, CameraType, BarCodeScannedResult } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { verifyRegistrationToken } from "@shfmk/shared";
import { getPublicKeyPem } from "./constants";
import { getCheckIns, saveCheckIn, clearCheckIns, getAdminSecret, saveAdminSecret } from "./storage";

type ScanState =
  | { status: "idle" }
  | { status: "valid"; repeat: boolean; payload: { name: string; cat: string; conf: string; sub: string } }
  | { status: "invalid"; message: string };

type SyncState = "idle" | "syncing" | "success" | "error";

// Replace with your actual production URL when deploying
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [scanned, setScanned] = useState(false);
  const [publicKeyPem, setPublicKeyPem] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<
    { registrationId: string; scannedAt: string; name: string; cat: string; conf: string }[]
  >([]);
  const [adminSecret, setAdminSecret] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncState>("idle");
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === CameraPermissionStatus.GRANTED);

      const key = await getPublicKeyPem();
      setPublicKeyPem(key);

      const storedCheckins = await getCheckIns();
      setCheckIns(storedCheckins);

      const secret = await getAdminSecret();
      setAdminSecret(secret);
    };
    init();
  }, []);

  const statusColor = useMemo(() => {
    if (scanState.status === "valid" && scanState.repeat) return "#fbbf24"; // Yellow
    if (scanState.status === "valid") return "#22c55e"; // Green
    if (scanState.status === "invalid") return "#ef4444"; // Red
    return "#334155"; // Idle
  }, [scanState]);

  async function handleBarCodeScanned(result: BarCodeScannedResult) {
    setScanned(true);
    if (!publicKeyPem) {
      setScanState({ status: "invalid", message: "Mungon çelësi publik. Rinisni aplikacionin." });
      return;
    }

    try {
      let token = result.data;
      // Handle URL format: http://.../verify?token=...
      if (token.includes("token=")) {
        const url = new URL(token);
        const extracted = url.searchParams.get("token");
        if (extracted) token = extracted;
      }

      const payload = await verifyRegistrationToken(token, publicKeyPem);

      // Check if already scanned locally
      const existing = checkIns.find((c) => c.registrationId === payload.sub);

      const checkInRecord = {
        registrationId: payload.sub,
        scannedAt: new Date().toISOString(),
        name: payload.name,
        cat: payload.cat,
        conf: payload.conf
      };

      if (!existing) {
        await saveCheckIn(checkInRecord);
        setCheckIns((prev) => [checkInRecord, ...prev]);
        setScanState({ status: "valid", repeat: false, payload });
      } else {
        setScanState({ status: "valid", repeat: true, payload });
      }
    } catch (error) {
      setScanState({ status: "invalid", message: "QR Kod i pavlefshëm ose i dëmtuar." });
    }
  }

  async function handleSync() {
    if (syncStatus === 'syncing' || checkIns.length === 0) return;

    setSyncStatus('syncing');
    setLastSyncMessage(null);
    await saveAdminSecret(adminSecret);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminSecret,
        },
        body: JSON.stringify(checkIns.map(c => ({ registrationId: c.registrationId, scannedAt: c.scannedAt }))),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Dështoi sinkronizimi");
      }

      await clearCheckIns();
      setCheckIns([]);
      setSyncStatus('success');
      setLastSyncMessage(`✅ Sukses! ${data.updated} regjistrime u sinkronizuan.`);

    } catch (err) {
      setSyncStatus('error');
      setLastSyncMessage(`❌ Gabim: ${(err as Error).message}`);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.text}>Duke kërkuar leje për kamerën...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: '#ef4444' }]}>Kërkohet leje për kamerën.</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>SHFMK Scanner</Text>
      <Text style={styles.subTitle}>Check-in & Verifikim</Text>

      {/* STATUS CARD */}
      <View style={[styles.statusCard, { borderColor: statusColor, backgroundColor: statusColor + '20' }]}>
        {scanState.status === "valid" && (
          <>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {scanState.repeat ? "⚠️ TASHMË I SKANUAR" : "✅ I REGJISTRUAR"}
            </Text>
            <Text style={styles.name}>{scanState.payload.name}</Text>
            <Text style={styles.detail}>{scanState.payload.cat.toUpperCase()}</Text>
            <Text style={styles.detail}>{scanState.payload.conf}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>
                {scanState.repeat ? "Hyrja u shënua më parë" : "Hyrje e Lejuar"}
              </Text>
            </View>
          </>
        )}
        {scanState.status === "invalid" && (
          <>
            <Text style={[styles.statusLabel, { color: statusColor }]}>❌ GABIM</Text>
            <Text style={[styles.statusInstructions, { color: statusColor }]}>{scanState.message}</Text>
          </>
        )}
        {scanState.status === "idle" && (
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.statusLabel, { color: '#94a3b8' }]}>GATI PËR SKANIM</Text>
            <Text style={styles.detail}>Drejto kamerën drejt kodit QR</Text>
          </View>
        )}
      </View>

      {/* CAMERA VIEW */}
      <View style={styles.scannerBox}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        {scanned && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
              <Text style={styles.rescanText}>Skano Prapë</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* SYNC SECTION */}
      <View style={styles.syncBox}>
        <View style={styles.syncHeader}>
          <Text style={styles.syncTitle}>Radha Offline</Text>
          <View style={[styles.countBadge, checkIns.length > 0 ? { backgroundColor: '#fbbf24' } : { backgroundColor: '#22c55e' }]}>
            <Text style={styles.countText}>{checkIns.length}</Text>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Admin Secret"
          placeholderTextColor="#64748b"
          value={adminSecret}
          onChangeText={setAdminSecret}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, (syncStatus === 'syncing' || checkIns.length === 0) && styles.disabledButton]}
          onPress={handleSync}
          disabled={syncStatus === 'syncing' || checkIns.length === 0}
        >
          {syncStatus === 'syncing' ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sinkronizo me Serverin</Text>
          )}
        </TouchableOpacity>

        {lastSyncMessage && (
          <Text style={[styles.syncMessage, { color: syncStatus === 'error' ? '#fca5a5' : '#86efac' }]}>
            {lastSyncMessage}
          </Text>
        )}
      </View>

      <Text style={styles.footer}>v1.0.0 • {API_BASE_URL}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  subTitle: {
    color: "#94a3b8",
    fontSize: 16,
    marginBottom: 24
  },
  statusCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusLabel: {
    fontWeight: "900",
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center'
  },
  statusInstructions: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center'
  },
  name: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4
  },
  detail: {
    color: "#cbd5e1",
    fontSize: 16,
    marginBottom: 2
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20
  },
  badgeText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14
  },
  scannerBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rescanButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30
  },
  rescanText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16
  },
  syncBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    gap: 12
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  syncTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700'
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8
  },
  countText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14
  },
  input: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    fontSize: 16
  },
  button: {
    width: '100%',
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 10,
    alignItems: "center"
  },
  disabledButton: {
    backgroundColor: '#475569',
    opacity: 0.7
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16
  },
  syncMessage: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4
  },
  text: {
    color: "#e2e8f0",
    fontSize: 16,
    marginTop: 12
  },
  footer: {
    color: '#475569',
    fontSize: 12,
    marginTop: 24
  }
});

