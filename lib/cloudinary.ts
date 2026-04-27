export const CLOUDINARY_CLOUD_NAME = "dixsubm2p";
export const CLOUDINARY_UPLOAD_PRESET = "araop2wb";

export async function uploadToCloudinary(
  file: File,
  resourceType: "image" | "video" = "image"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("resource_type", resourceType);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.secure_url;
}
