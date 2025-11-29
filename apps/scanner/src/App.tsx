import "expo-standard-web-crypto";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Share, ScrollView } from "react-native";
import { Camera, CameraPermissionStatus, CameraType, BarCodeScannedResult } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { verifyRegistrationToken } from "@shfmk/shared";
import { getPublicKeyPem } from "./constants";
import { getCheckIns, saveCheckIn } from "./storage";

type ScanState =
  | { status: "idle" }
  | { status: "valid"; repeat: boolean; payload: { name: string; cat: string; conf: string; sub: string } }
  | { status: "invalid"; message: string };

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [scanned, setScanned] = useState(false);
  const [publicKeyPem, setPublicKeyPem] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState<
    { registrationId: string; scannedAt: string; name: string; cat: string; conf: string }[]
  >([]);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === CameraPermissionStatus.GRANTED);
    };

    requestPermissions();
    getPublicKeyPem().then((key) => setPublicKeyPem(key));
    getCheckIns().then(setCheckIns);
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
      setScanState({ status: "invalid", message: "Public key missing." });
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
      setScanState({ status: "invalid", message: "Invalid or malformed token." });
    }
  }

  async function exportCheckIns() {
    const payload = JSON.stringify(checkIns, null, 2);
    await Share.share({ message: payload });
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
      <Text style={styles.subTitle}>Offline QR verification</Text>

      <View style={[styles.statusCard, { borderColor: statusColor }]}>
        {scanState.status === "valid" && (
          <>
            <Text style={styles.statusLabel}>{scanState.repeat ? "Already checked-in" : "Valid"}</Text>
            <Text style={styles.name}>{scanState.payload.name}</Text>
            <Text style={styles.detail}>{scanState.payload.cat}</Text>
            <Text style={styles.detail}>Conf: {scanState.payload.conf}</Text>
          </>
        )}
        {scanState.status === "invalid" && (
          <>
            <Text style={styles.statusLabel}>Invalid token</Text>
            <Text style={styles.detail}>{scanState.message}</Text>
          </>
        )}
        {scanState.status === "idle" && <Text style={styles.detail}>Ready to scan</Text>}
      </View>

      <View style={styles.scannerBox}>
        <Camera
          style={StyleSheet.absoluteFillObject}
          type={CameraType.back}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Scan again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={exportCheckIns}>
          <Text style={styles.buttonText}>Export check-ins</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {checkIns.map((c) => (
          <View key={c.registrationId} style={styles.listItem}>
            <View>
              <Text style={styles.nameSmall}>{c.name}</Text>
              <Text style={styles.detail}>{c.cat}</Text>
            </View>
            <Text style={styles.detail}>{new Date(c.scannedAt).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    paddingTop: 60
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
    width: "90%",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  statusLabel: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 18
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
    width: "90%",
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111827",
    marginBottom: 12
  },
  actions: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12
  },
  button: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  secondary: {
    backgroundColor: "#1f2937"
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700"
  },
  list: {
    width: "90%",
    marginTop: 6
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937"
  },
  text: {
    color: "#e2e8f0"
  }
});
