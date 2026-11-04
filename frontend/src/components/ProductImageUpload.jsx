
import { useState } from "react";
import api from "../services/api";
import { getImageUrl } from "../services/image";

function ProductImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);

      const response = await api.post(
        "/uploads/product-image",
        formData
      );

      const imagePath = response.data.image;

      setPreview(imagePath);
      onChange(imagePath);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Image upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="product-image-upload">
      <label htmlFor="product-image">
        Product Image
      </label>

      <input
        id="product-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && <p>Uploading image...</p>}

      {error && <p className="upload-error">{error}</p>}

      {preview && (
        <img
          src={getImageUrl(preview)}
          alt="Product preview"
          className="product-image-preview"
        />
      )}
    </div>
  );
}

export default ProductImageUpload;