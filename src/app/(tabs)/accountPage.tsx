import { useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PickProfilePhoto } from "../components/profile-photo";

export default function AccountScreen() {
  const colors = useThemeColors();
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  

  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const memberSince = user?.created_at
    ? new Date(user.created_at)
        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
        .toUpperCase()
    : "—";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCentered}>
          <Text style={styles.accountTitleCentered}>Account</Text>
        </View>

        <View style={styles.grid}>
          {/* Full Width Profile Widget */}
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.widget, styles.widgetFull]}
          >
            <View style={styles.profileTop}>
              <View style={styles.avatarRing}>
                <PickProfilePhoto />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username} numberOfLines={1}>
                  {user?.username ?? "GYM BRO"}
                </Text>
                <Text style={styles.memberSince}>
                  Member Since {memberSince}
                </Text>
              </View>
            </View>
          </BlurView>

          {/* 4 Stat Widgets (2x2 Grid) */}
          <StatWidget
            label="Age"
            value={user?.age ? `${user.age}` : "—"}
            icon="calendar"
          />
          <StatWidget
            label="Weight"
            value={user?.weight_lbs ? `${user.weight_lbs}` : "—"}
            icon="barbell"
          />
          <StatWidget
            label="Height"
            value={user?.height_ft ? `${user.height_ft}'` : "—"}
            icon="body"
          />
          <StatWidget
            label="Sex"
            value={user?.sex ? user.sex.toUpperCase() : "—"}
            icon="male-female"
          />

          {/* Section Divider */}
          <View style={styles.sectionHeader}>
            
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.listCard}>
              <Pressable style={styles.listItem} onPress={toggleTheme}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <Ionicons name={isLight ? "moon" : "sunny"} size={18} color={colors.textFaint} />
                  </View>
                  <Text style={styles.itemText}>Toggle Theme</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemValue}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </View>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          {/* Action Widgets */}
          <ActionWidget label="Units" subLabel="Lbs" icon="swap-horizontal" />
          <ActionWidget label="Theme" subLabel="Dark" icon="moon" />
          <ActionWidget label="Rest Timer" subLabel="Off" icon="timer" />
          <ActionWidget
            label="Notifications"
            subLabel="On"
            icon="notifications"
          />

          {/* Section Divider */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <ActionWidget label="Edit Profile" icon="person" />
          <ActionWidget label="Password" icon="lock-closed" />
          <ActionWidget label="Privacy" icon="shield-checkmark" />
          <ActionWidget label="Support" icon="help-buoy" />

          {/* Danger Zone */}
          <Pressable style={styles.logoutWidget} onPress={logout}>
            <Ionicons name="log-out" size={24} color={COLORS.bg} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Pressable style={styles.deleteAccountBtn}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function StatWidget({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  return (
    <BlurView
      intensity={20}
      tint="dark"
      style={[styles.widget, styles.widgetHalf, styles.statWidget]}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.accent} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </BlurView>
  );
}

function ActionWidget({
  label,
  subLabel,
  icon,
}: {
  label: string;
  subLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.widgetHalf,
        styles.actionWidgetPressable,
        pressed && styles.widgetPressed,
      ]}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={[styles.widget, styles.actionWidget]}
      >
        <Ionicons
          name={icon}
          size={28}
          color={colors.text}
          style={styles.actionIcon}
        />
        <Text style={styles.actionLabel}>{label}</Text>
        {subLabel && <Text style={styles.actionSubLabel}>{subLabel}</Text>}
      </BlurView>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 64 },

  headerCentered: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  accountTitleCentered: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 0.35,
    lineHeight: 41,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  widget: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: "hidden",
  },
  widgetFull: {
    width: "100%",
  },
  widgetHalf: {
    width: "48%",
  },
  widgetPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionWidgetPressable: {
    marginBottom: 12,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },
  memberSince: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },

  statWidget: {
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 120,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statContent: {
    alignItems: "flex-start",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.textFaint,
    fontSize: 11,
    fontWeight: "normal",
    marginTop: 4,
  },

  sectionHeader: {
    width: "100%",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.35,
  },

  actionWidget: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    marginBottom: 0,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "normal",
    textAlign: "center",
  },
  actionSubLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "normal",
    marginTop: 6,
  },

  logoutWidget: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.coral,
    borderRadius: 24,
    paddingVertical: 18,
    marginTop: 32,
    shadowColor: COLORS.coral,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logoutText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 10,
  },
  deleteAccountBtn: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  
  section: {
    marginBottom: 24,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemValue: {
    color: colors.textMuted,
    fontSize: 16,
    marginRight: 8,
  },

  deleteText: {
    color: COLORS.textFaint,
    fontSize: 13,
    fontWeight: "700",
  },
});
