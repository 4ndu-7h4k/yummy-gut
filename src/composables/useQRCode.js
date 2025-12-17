import { ref } from "vue";
import { supabase } from "@/config/supabase";

const qrCodes = ref([]);
const loading = ref(false);
const error = ref(null);

// LocalStorage keys
const STORAGE_KEY_LATEST_QR = "pos_latest_qr_code";
const STORAGE_KEY_QR_TIMESTAMP = "pos_latest_qr_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper functions for localStorage
const getCachedQRCode = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_LATEST_QR);
    const timestamp = localStorage.getItem(STORAGE_KEY_QR_TIMESTAMP);

    if (!cached || !timestamp) return null;

    const now = Date.now();
    const cacheTime = parseInt(timestamp, 10);

    // Check if cache is still valid (within 5 minutes)
    if (now - cacheTime > CACHE_DURATION) {
      // Cache expired, clear it
      localStorage.removeItem(STORAGE_KEY_LATEST_QR);
      localStorage.removeItem(STORAGE_KEY_QR_TIMESTAMP);
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error("Error reading cached QR code:", error);
    return null;
  }
};

const setCachedQRCode = (qrCode) => {
  try {
    if (qrCode) {
      localStorage.setItem(STORAGE_KEY_LATEST_QR, JSON.stringify(qrCode));
      localStorage.setItem(STORAGE_KEY_QR_TIMESTAMP, Date.now().toString());
    } else {
      localStorage.removeItem(STORAGE_KEY_LATEST_QR);
      localStorage.removeItem(STORAGE_KEY_QR_TIMESTAMP);
    }
  } catch (error) {
    console.error("Error caching QR code:", error);
  }
};

export function useQRCode() {
  // Upload QR code image to Supabase Storage
  const uploadQRCode = async (file, fileName = null) => {
    loading.value = true;
    error.value = null;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath =
        fileName ||
        `images/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("qr_images")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("qr_images")
        .getPublicUrl(filePath);

      // Save QR code info to database
      const { data: qrData, error: dbError } = await supabase
        .from("qr_codes")
        .insert({
          file_path: filePath,
          public_url: urlData.publicUrl,
          type: "uploaded",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const result = {
        ...qrData,
        publicUrl: urlData.publicUrl,
      };

      // Update cache with new QR code
      setCachedQRCode(result);

      return result;
    } catch (err) {
      error.value = err.message;
      console.error("Error uploading QR code:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Save generated QR code to database
  const saveGeneratedQR = async (text, dataUrl) => {
    loading.value = true;
    error.value = null;

    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-${Date.now()}.png`, {
        type: "image/png",
      });

      // Upload to storage
      const fileExt = "png";
      const filePath = `images/generated-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("qr_images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("qr-codes")
        .getPublicUrl(filePath);

      // Save QR code info to database
      const { data: qrData, error: dbError } = await supabase
        .from("qr_codes")
        .insert({
          file_path: filePath,
          public_url: urlData.publicUrl,
          qr_text: text,
          type: "generated",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const result = {
        ...qrData,
        publicUrl: urlData.publicUrl,
      };

      // Update cache with new QR code
      setCachedQRCode(result);

      return result;
    } catch (err) {
      error.value = err.message;
      console.error("Error saving generated QR code:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Fetch latest QR code (with localStorage cache)
  const fetchLatestQRCode = async (forceRefresh = false) => {
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cached = getCachedQRCode();
      if (cached) {
        return cached;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        // If no QR code exists, return null instead of throwing
        if (fetchError.code === "PGRST116") {
          setCachedQRCode(null); // Cache the null result
          return null;
        }
        throw fetchError;
      }

      // Cache the result
      setCachedQRCode(data);
      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching latest QR code:", err);
      // Return null if error (e.g., no QR codes exist)
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Fetch all QR codes
  const fetchQRCodes = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      qrCodes.value = data || [];
      return data;
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching QR codes:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete QR code
  const deleteQRCode = async (qrId, filePath) => {
    loading.value = true;
    error.value = null;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("qr_images")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("qr_codes")
        .delete()
        .eq("id", qrId);

      if (dbError) throw dbError;

      qrCodes.value = qrCodes.value.filter((qr) => qr.id !== qrId);

      // Clear cache if deleted QR was the latest one
      const cached = getCachedQRCode();
      if (cached && cached.id === qrId) {
        setCachedQRCode(null);
        // Try to fetch the next latest QR code
        await fetchLatestQRCode(true);
      }
    } catch (err) {
      error.value = err.message;
      console.error("Error deleting QR code:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    qrCodes,
    loading,
    error,
    uploadQRCode,
    saveGeneratedQR,
    fetchLatestQRCode,
    fetchQRCodes,
    deleteQRCode,
  };
}
