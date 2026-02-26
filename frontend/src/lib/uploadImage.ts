export interface UploadResult {
  url: string;        
  publicId: string;   
}

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary config. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and " +
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local"
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "ticketnode");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url:      data.secure_url,  
          publicId: data.public_id,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message ?? "Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", endpoint);
    xhr.send(formData);
  });
}