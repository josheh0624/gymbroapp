export function ProfilePhoto({ initials }: { initials: string }) {
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
