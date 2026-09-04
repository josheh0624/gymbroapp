import { useAuthStore } from "@/store/authStore";
import { COLORS } from "@/styles/appStyles";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PickProfilePhoto } from "../components/profile-photo";

// Glass surface with a same-color fallback that renders instantly, with the
// actual glass effect fading in on top — same anti-flash pattern as the
// workout screen's bottom dock (opaque bg first, GlassView fades in after
// a short delay, rather than conditionally mounting/unmounting it).
function GlassSurface() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.glassFallback]} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor="rgba(255,255,255,0.06)"
        />
      </Animated.View>
    </>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();

  const username = useAuthStore((s) => s.user?.username);
  const id = useAuthStore((s) => s.user?.id);
  const email = useAuthStore((s) => s.user?.email); // add to SafeUser if not already there
  const raw_memberSince = useAuthStore((s) => s.user?.created_at);
  const logout = useAuthStore((s) => s.logout);

  const memberSince = raw_memberSince
    ? new Date(raw_memberSince)
        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
        .toUpperCase()
    : "—";

  const memberNo = id ? `${String(id).padStart(6, "0")}` : "——————";
  const initials = username ? username.slice(0, 2).toUpperCase() : "GB";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Account</Text>

        {/* Membership card — signature element for the screen */}
        <View style={styles.card}>
          <GlassSurface />

          <View style={styles.cardTopRow}>
            <Text style={styles.cardLabel}>GYMBRO MEMBER</Text>
            <Text style={[styles.cardLabel, styles.mono]}>{memberNo}</Text>
          </View>

          <View style={styles.avatarRow}>
            <View style={styles.avatarRing}>
              <PickProfilePhoto initials={initials} />
            </View>
            <View style={styles.identity}>
              <Text style={styles.username} numberOfLines={1}>
                {username ?? "GYM BRO"}
              </Text>
              <Text style={styles.memberSince}>MEMBER SINCE {memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionLabel}>Details</Text>
        <GlassCard>
          <InfoRow
            icon="person-outline"
            label="Username"
            value={username ?? "—"}
          />
          <Divider />
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={email ?? "Add email"}
            muted={!email}
          />
          <Divider />
          <InfoRow
            icon="finger-print-outline"
            label="Member ID"
            value={memberNo}
            mono
          />
          <Divider />
          <InfoRow
            icon="calendar-outline"
            label="Member Since"
            value={memberSince}
          />
        </GlassCard>

        {/* Fitness profile — feeds recommendations, plate/rep suggestions, etc. */}
        <Text style={styles.sectionLabel}>Fitness Profile</Text>
        <GlassCard padded={false}>
          <EditableRow icon="body-outline" label="Height" />
          <Divider />
          <EditableRow icon="barbell-outline" label="Weight" />
          <Divider />
          <EditableRow icon="flag-outline" label="Goal" />
          <Divider />
          <EditableRow icon="trending-up-outline" label="Experience Level" />
        </GlassCard>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <GlassCard padded={false}>
          <EditableRow
            icon="swap-horizontal-outline"
            label="Units"
            value="lbs"
          />
          <Divider />
          <EditableRow icon="moon-outline" label="Appearance" value="Dark" />
          <Divider />
          <EditableRow icon="timer-outline" label="Default Rest Timer" />
        </GlassCard>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <GlassCard padded={false}>
          <ActionRow icon="create-outline" label="Edit Profile" />
          <Divider />
          <ActionRow icon="lock-closed-outline" label="Change Password" />
          <Divider />
          <ActionRow icon="notifications-outline" label="Notifications" />
          <Divider />
          <ActionRow icon="shield-checkmark-outline" label="Privacy & Data" />
        </GlassCard>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <GlassCard padded={false}>
          <ActionRow icon="help-circle-outline" label="Help & Support" />
          <Divider />
          <ActionRow
            icon="document-text-outline"
            label="Terms & Privacy Policy"
          />
          <Divider />
          <InfoRow
            icon="information-circle-outline"
            label="Version"
            value="1.0.0"
            muted
          />
        </GlassCard>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.coral} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Pressable style={styles.deleteAccountButton}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </Pressable>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

function GlassCard({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <View style={styles.glassCard}>
      <GlassSurface />
      <View style={padded ? styles.glassCardInner : undefined}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
  muted = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons
        name={icon}
        size={18}
        color={COLORS.textMuted}
        style={styles.rowIcon}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          mono && styles.mono,
          muted && styles.rowValueMuted,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={COLORS.accent}
        style={styles.rowIcon}
      />
      <Text style={styles.rowLabelAction}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textFaint} />
    </Pressable>
  );
}

function EditableRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const isEmpty = !value;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={COLORS.textMuted}
        style={styles.rowIcon}
      />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, isEmpty && styles.rowValueMuted]}
        numberOfLines={1}
      >
        {value ?? "Add"}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={COLORS.textFaint}
        style={styles.chevronSpacing}
      />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  eyebrow: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 16,
  },

  glassFallback: {
    backgroundColor: COLORS.surface,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: "hidden",
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  cardLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(164, 164, 164, 0)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.accent, fontSize: 18, fontWeight: "900" },
  identity: { flex: 1 },
  username: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  memberSince: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  perforation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    borderStyle: "dashed",
  },
  perfDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceBorder,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  statLabel: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 10,
  },

  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: "hidden",
  },
  glassCardInner: { paddingHorizontal: 16 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowPressed: { opacity: 0.6 },
  rowIcon: { marginRight: 12 },
  rowLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  rowLabelAction: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowValue: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  rowValueMuted: { color: COLORS.textFaint },
  chevronSpacing: { marginLeft: 6 },
  mono: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    letterSpacing: 1,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.surfaceBorder,
    marginLeft: 46,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,77,94,0.35)",
    backgroundColor: "rgba(255,77,94,0.08)",
  },
  logoutText: {
    color: COLORS.coral,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  deleteAccountButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  deleteAccountText: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "600",
  },
  spacer: { height: 56 },
  profileImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },

  cameraButton: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
