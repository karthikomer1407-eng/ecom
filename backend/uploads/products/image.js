const API_SERVER = "http://127.0.0.1:5000";

export function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_SERVER}/${image.replace(/^\/+/, "")}`;
}