import { api } from "@/api/api";
import * as SecureStore from "expo-secure-store";
import { SafeUser } from "../store/authStore";

export async function uploadProfilePhoto(uri: string): Promise<SafeUser> {
  const token = await SecureStore.getItemAsync("token");

  const filename = uri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : "jpg";

  const formData = new FormData();
  formData.append("photo", {
    uri,
    name: filename,
    type: `image/${ext}`,
  } as any); // RN's FormData typing doesn't match the DOM lib

  const res = await fetch(`${api}/users/profile-photo`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to upload photo");
  }

  return res.json();
}
