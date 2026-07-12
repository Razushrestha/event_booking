export function withUploadToken(path?: string | null) {
  if (!path) return "/placeholder.svg";

  const baseUrl = import.meta.env.VITE_IMAGE_URL || "";
  const token = localStorage.getItem("token");

  if (!token || !path.startsWith("/uploads/")) {
    return `${baseUrl}${path}`;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${baseUrl}${path}${separator}token=${encodeURIComponent(token)}`;
}
