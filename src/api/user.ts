import { BASE_URL } from "@/api/api";
import * as SecureStore from "expo-secure-store";
import { SafeUser } from "../store/authStore";

export async function uploadProfilePhoto(uri: string): Promise<SafeUser> {
  const token = await SecureStore.getItemAsync("token");

  const filename = uri.split("/").pop()?.split("?")[0] ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = (match ? match[1] : "jpg").toLowerCase();
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  const fileResponse = await fetch(uri);
  const rawBlob = await fileResponse.blob();
  const blob = rawBlob.slice(0, rawBlob.size, mimeType);

  const formData = new FormData();
  formData.append("photo", blob, filename);

  const res = await fetch(`${BASE_URL}/users/profile-photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Upload failed:", res.status, text);
    throw new Error(text || "Failed to upload photo");
  }

  return res.json();
}
