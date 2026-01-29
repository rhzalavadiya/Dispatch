// src/utils/api.js
import axios from 'axios';
import { toast } from 'react-toastify';
import { config } from '../components/config/config'; // Your existing config file

// ────────────────────────────────────────────────────────────────────────────────
// SHARED ERROR HANDLER (used by both instances)
// ────────────────────────────────────────────────────────────────────────────────
const handleApiError = (error) => {
  // Fast offline / timeout detection
  if (
    !navigator.onLine ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout') ||
    error.message?.includes('Network Error')
  ) {
    // toast.warn("You're offline. Action will sync when internet is available.", {
    //   position: "top-right",
    //   autoClose: 5000,
    //   toastId: "offline-warning", // Prevents duplicate toasts
    //   icon: "🌐📴"
    // });

    // Return special error so you can handle differently if needed
    return Promise.reject(new Error("OFFLINE"));
  }

  // Normal server errors
  const errorMessage =
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again.";

//   toast.error(errorMessage, {
//     position: "top-right",
//     autoClose: 4000,
//   });

  return Promise.reject(error);
};

// ────────────────────────────────────────────────────────────────────────────────
// LOCAL SERVER (your main backend)
// ────────────────────────────────────────────────────────────────────────────────
export const localApi = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,               // Fail fast when offline/slow network
  headers: {
    'Content-Type': 'application/json',
  },
});

localApi.interceptors.response.use(
  (response) => response,      // Just return successful response
  handleApiError
);

// ────────────────────────────────────────────────────────────────────────────────
// VPS / CENTRAL SERVER
// ────────────────────────────────────────────────────────────────────────────────
export const vpsApi = axios.create({
  baseURL: config.apiBaseUrlVPS,
  timeout: 10000,              // VPS can be slower, give it a bit more time
  headers: {
    'Content-Type': 'application/json',
  },
});

vpsApi.interceptors.response.use(
  (response) => response,
  handleApiError
);

// Optional: helper for success toast (use when you want consistent success message)
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
  });
};
