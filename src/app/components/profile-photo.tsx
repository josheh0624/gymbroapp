import { COLORS } from "@/styles/appStyles";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export function PickProfilePhoto({ initials }: { initials: string }) {
  const [image, setImage] = useState<string | null>(null);

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

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <Pressable onPress={pickImage}>
      <View style={styles.avatar}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <View style={styles.cameraButton}>
        <Ionicons name="camera" size={14} color={COLORS.bg} />
      </View>
    </Pressable>
  );
}

export function ProfilePhoto({ initials }: { initials: string }) {
  const [image, setImage] = useState<string | null>(null);

  return (
    <>
      <View style={styles.avatar}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
    </>
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
