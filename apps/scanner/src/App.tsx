import "expo-standard-web-crypto";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Share, ScrollView, TextInput, ActivityIndicator } from "react-native";
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

// IMPORTANT: Replace with your production web app URL
const API_BASE_URL = "http://localhost:3000";

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
    if (scanState.status === "valid" && scanState.repeat) return "#fbbf24";
    if (scanState.status === "valid") return "#22c55e";
    if (scanState.status === "invalid") return "#ef4444";
    return "#334155";
  }, [scanState]);

  async function handleBarCodeScanned(result: BarCodeScannedResult) {
    setScanned(true);
    if (!publicKeyPem) {
      setScanState({ status: "invalid", message: "Çelësi publik mungon. Riniseni app-in." });
      return;
    }

    try {
      const payload = await verifyRegistrationToken(result.data, publicKeyPem);
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
        setCheckIns([checkInRecord, ...checkIns]);
        setScanState({ status: "valid", repeat: false, payload });
      } else {
        setScanState({ status: "valid", repeat: true, payload });
      }
    } catch (error) {
      setScanState({ status: "invalid", message: "Kodi QR është i pavlefshëm ose i korruptuar." });
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
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify(checkIns.map(c => ({ registrationId: c.registrationId, scannedAt: c.scannedAt }))),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Sync failed");
      }
      
      await clearCheckIns();
      setCheckIns([]);
      setSyncStatus('success');
      setLastSyncMessage(`Sukses! ${data.updated} rekorde u sinkronizuan.`);

    } catch (err) {
      setSyncStatus('error');
      setLastSyncMessage(`Gabim: ${(err as Error).message}`);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>SHFMK Scanner</Text>
      <Text style={styles.subTitle}>Verifikim offline i kodeve QR</Text>

      {/* SCANNER UI */}
      <View style={[styles.statusCard, { borderColor: statusColor, backgroundColor: statusColor + '20' }]}>
        {scanState.status === "valid" && (
          <>
            <Text style={[styles.statusLabel, { color: statusColor, fontSize: 22 }]}>{scanState.repeat ? "⚠️ E përdorur" : "✅ E vlefshme"}</Text>
            <Text style={[styles.name, { marginTop: 8 }]}>{scanState.payload.name}</Text>
            <Text style={styles.detail}>{scanState.payload.cat}</Text>
            <Text style={styles.detail}>Konferenca: {scanState.payload.conf}</Text>
            <Text style={[styles.statusInstructions, { color: statusColor }]}>{scanState.repeat ? "Vëmendje: Ky person tashmë është bërë check-in!" : "Lejo hyrjen"}</Text>
          </>
        )}
        {scanState.status === "invalid" && (
          <>
            <Text style={[styles.statusLabel, { color: statusColor, fontSize: 22 }]}>❌ E pavlefshme</Text>
            <Text style={[styles.statusInstructions, { color: statusColor, marginTop: 8 }]}>{scanState.message}</Text>
          </>
        )}
        {scanState.status === "idle" && <Text style={styles.detail}>Gati për skenim</Text>}
      </View>

      <View style={styles.scannerBox}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      <TouchableOpacity style={[styles.button, styles.secondary, { marginBottom: 16 }]} onPress={() => setScanned(false)} disabled={!scanned}>
        <Text style={styles.buttonText}>Skano prapë</Text>
      </TouchableOpacity>

      {/* SYNC UI */}
      <View style={styles.syncBox}>
         <Text style={styles.detail}>Të dhënat e pa-sinkronizuara: {checkIns.length}</Text>
        <TextInput
          style={styles.input}
          placeholder="Admin Secret"
          placeholderTextColor="#94a3b8"
          value={adminSecret}
          onChangeText={setAdminSecret}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSync} disabled={syncStatus === 'syncing' || checkIns.length === 0}>
          {syncStatus === 'syncing' ? <ActivityIndicator color="#e2e8f0" /> : <Text style={styles.buttonText}>Sinkronizo</Text>}
        </TouchableOpacity>
        {lastSyncMessage && <Text style={[styles.detail, { marginTop: 8, textAlign: 'center', color: syncStatus === 'error' ? '#fca5a5' : '#86efac' }]}>{lastSyncMessage}</Text>}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: '5%'
  },
  title: {
    color: "#e2e8f0",
    fontSize: 26,
    fontWeight: "800"
  },
  subTitle: {
    color: "#94a3b8",
    marginBottom: 16
  },
  statusCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    minHeight: 150,
    justifyContent: 'center'
  },
  statusLabel: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 18
  },
  statusInstructions: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4
  },
  name: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 20
  },
  nameSmall: {
    color: "#e2e8f0",
    fontWeight: "700"
  },
  detail: {
    color: "#cbd5e1"
  },
  scannerBox: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 320,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111827",
    marginBottom: 12
  },
  button: {
    width: '100%',
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  secondary: {
    backgroundColor: "#1f2937"
  },
  buttonText: {
    color: "#e2e8f0",
    fontWeight: "700"
  },
  text: {
    color: "#e2e8f0"
  },
  syncBox: {
    width: '100%',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    gap: 10
  },
  input: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    padding: 10,
    borderRadius: 8
  }
});

