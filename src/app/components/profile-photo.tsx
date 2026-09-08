import { uploadProfilePhoto } from "@/api/user";
import { useAuthStore } from "@/store/authStore";
import { COLORS } from "@/styles/appStyles";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function PickProfilePhoto({ initials }: { initials: string }) {
  const { user, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      setUploading(true);
      const updatedUser = await uploadProfilePhoto(result.assets[0].uri);
      setUser(updatedUser);
    } catch (err) {
      console.error(err);
      alert("Couldn't save your photo. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable onPress={pickImage} disabled={uploading}>
      <View style={styles.avatar}>
        {user?.image_url ? (
          <Image source={{ uri: user.image_url }} style={styles.profileImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <View style={styles.cameraButton}>
        {uploading ? (
          <ActivityIndicator size="small" color={COLORS.bg} />
        ) : (
          <Ionicons name="camera" size={14} color={COLORS.bg} />
        )}
      </View>
    </Pressable>
  );
}

export function ProfilePhoto({ initials }: { initials: string }) {
  const { user } = useAuthStore();

  return (
    <View style={styles.avatar}>
      {user?.image_url ? (
        <Image source={{ uri: user.image_url }} style={styles.profileImage} />
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(164, 164, 164, 0)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.accent, fontSize: 18, fontWeight: "900" },
});
