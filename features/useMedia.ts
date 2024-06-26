import { useState } from "react";
import ImageUploading, { ImageType } from "react-images-uploading";

export default function useMedia() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadMetadata = async (image: ImageType, data: {}) => {
    setIsUploading(true);

    const formData = new FormData();

    formData.append("file", image.file!, "image");
    formData.append("data", JSON.stringify(data));

    const res = await fetch("/api/media", {
      method: "POST",
      body: formData,
    });

    setIsUploading(false)

    return await res.text();
  };

  return {
    uploadMetadata,
    ImageInput: ImageUploading,
    isUploading
  };
}
