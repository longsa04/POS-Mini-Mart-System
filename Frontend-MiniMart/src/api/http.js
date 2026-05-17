import { getAuthToken } from "../utils/authStorage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export const buildAuthHeaders = (headers = {}) => {
  const token = getAuthToken();
  if (!token) {
    return headers;
  }
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};

export const handleJsonResponse = async (response, defaultMessage) => {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  const text = await response.text();
  const detail = text.trim();
  const message = `${defaultMessage} (status ${response.status}${
    detail ? ` - ${detail}` : ""
  })`;
  throw new Error(message);
};
