import { supabase } from "@/api/supabase";
import { SafeUser } from "../store/authStore";

export async function uploadProfilePhoto(uri: string): Promise<SafeUser> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error("Not logged in");

  const filename = uri.split("/").pop()?.split("?")[0] ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = (match ? match[1] : "jpg").toLowerCase();
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  // In React Native, we can fetch the local URI and convert to a Blob
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  // Create a unique filepath like: user_id/timestamp.jpg
  const filePath = `${authUser.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType: mimeType,
      upsert: true
    });

  if (uploadError) throw uploadError;

  // Get the public URL for the newly uploaded image
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update the user's profile with the new image URL
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ image_url: publicUrl })
    .eq('id', authUser.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedUser as SafeUser;
}
