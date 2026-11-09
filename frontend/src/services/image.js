
const RENDER_BACKEND_URL = "https://ecom-t54z.onrender.com";

const getApiServer = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname.endsWith(".onrender.com")) {
      return window.location.origin;
    }
  }
  return RENDER_BACKEND_URL;
};

export function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const server = getApiServer();
  return `${server}/${image.replace(/^\/+/, "")}`;
}
