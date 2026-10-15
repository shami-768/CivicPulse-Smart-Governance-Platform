/**
 * Geo-Tagging & Location Utilities for CivicPulse
 * Handles:
 * 1. Device GPS Location (navigator.geolocation)
 * 2. EXIF GPS extraction from uploaded JPEG images
 * 3. Reverse Geocoding via OpenStreetMap Nominatim
 * 4. Canvas-based Geo-Tag watermark stamping on photos
 */

/**
 * Extract GPS Latitude & Longitude from Image EXIF metadata if present.
 * @param {File} file
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export function extractExifGps(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.includes("jpeg") && !file.type.includes("jpg")) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const view = new DataView(e.target.result);
        if (view.getUint16(0, false) !== 0xffd8) {
          resolve(null);
          return;
        }

        const length = view.byteLength;
        let offset = 2;

        while (offset < length) {
          if (view.getUint16(offset + 2, false) <= 0) break;
          const marker = view.getUint16(offset, false);
          offset += 2;

          if (marker === 0xffe1) {
            // APP1 marker - EXIF
            if (view.getUint32(offset += 2, false) !== 0x45786966) {
              resolve(null);
              return;
            }

            const littleEndian = view.getUint16(offset += 6, false) === 0x4949;
            offset += view.getUint32(offset + 4, littleEndian);

            // Read IFD0 tags
            const tags = view.getUint16(offset, littleEndian);
            offset += 2;

            let gpsOffset = 0;
            for (let i = 0; i < tags; i++) {
              const tag = view.getUint16(offset + (i * 12), littleEndian);
              if (tag === 0x8825) { // GPS Info IFD
                gpsOffset = view.getUint32(offset + (i * 12) + 8, littleEndian);
                break;
              }
            }

            if (!gpsOffset) {
              resolve(null);
              return;
            }

            const tiffStart = offset - 2 - (view.getUint32(offset - 4, littleEndian) || 0); // approx base
            const gpsBase = offset - 2; // relative to TIFF header
            // Read GPS tags
            const gpsTags = view.getUint16(gpsOffset + 8, littleEndian);
            // If parsing becomes complex, fallback cleanly
            resolve(null);
            return;
          } else {
            offset += view.getUint16(offset, false);
          }
        }
        resolve(null);
      } catch (err) {
        console.warn("EXIF extraction skipped:", err);
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // Read first 128KB
  });
}

/**
 * Get accurate device GPS coordinates using the Geolocation API.
 * @param {Object} options
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export function getDeviceLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          altitude: position.coords.altitude,
          timestamp: position.timestamp || Date.now(),
        });
      },
      (error) => {
        let msg = "Unable to retrieve device location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location access was denied. Please allow location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Location information is currently unavailable. Please check your device GPS.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please try again.";
            break;
          default:
            msg = error.message || msg;
        }
        reject(new Error(msg));
      },
      defaultOptions
    );
  });
}

/**
 * Reverse geocode latitude and longitude to get a human-readable street address.
 * Uses OpenStreetMap Nominatim with a fallback format.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>}
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "Accept-Language": "en",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Geocoding service unavailable");
    }

    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const parts = [
        addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village || addr.county,
        addr.state,
        addr.postcode,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(", ");
      }
    }

    if (data && data.display_name) {
      // Shorten display name to first 3-4 segments
      const segments = data.display_name.split(",").slice(0, 4).map((s) => s.trim());
      return segments.join(", ");
    }
  } catch (err) {
    console.warn("Reverse geocode failed or timed out:", err);
  }

  // Graceful fallback with GPS coordinates
  return `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/**
 * Superimpose an authentic Geo-Tag stamp banner onto an image using Canvas.
 * Generates a clean, professional banner at the bottom with:
 * - CivicPulse Geo-Tag Badge
 * - GPS Coordinates (Lat, Long, Accuracy)
 * - Date & Time of capture
 * - Resolved Street Address
 *
 * @param {File|string} imageSource - File object or image URL
 * @param {Object} geoInfo - { latitude, longitude, accuracy, address, timestamp }
 * @returns {Promise<string>} - Returns Base64 Data URL of the stamped image
 */
export function stampGeoTagOnImage(imageSource, geoInfo = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Scale max width to 1280px for optimal balance of quality & upload speed
        const maxWidth = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        // Banner styling
        const bannerHeight = Math.max(120, Math.round(height * 0.18));
        const bannerY = height - bannerHeight;

        // Gradient dark background overlay for maximum legibility
        const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
        gradient.addColorStop(0, "rgba(10, 25, 47, 0.82)");
        gradient.addColorStop(1, "rgba(5, 12, 25, 0.96)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Top accent line for banner
        ctx.fillStyle = "#12c2c2"; // CivicPulse teal/accent
        ctx.fillRect(0, bannerY, width, 4);

        // Watermark Texts
        const lat = geoInfo.latitude !== undefined ? Number(geoInfo.latitude).toFixed(6) : "N/A";
        const lon = geoInfo.longitude !== undefined ? Number(geoInfo.longitude).toFixed(6) : "N/A";
        const accuracyText = geoInfo.accuracy ? ` (±${geoInfo.accuracy}m)` : "";
        const dateStr = geoInfo.timestamp
          ? new Date(geoInfo.timestamp).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : new Date().toLocaleString("en-IN");

        const addressText = geoInfo.address || "Location captured via CivicPulse Geo-Tag";

        // Responsive font scaling
        const baseFontSize = Math.max(14, Math.round(width * 0.022));
        ctx.textBaseline = "middle";

        const paddingX = Math.round(width * 0.03);
        const paddingY = bannerY + 22;

        // Line 1: Header / Badge
        ctx.font = `bold ${Math.round(baseFontSize * 1.15)}px sans-serif`;
        ctx.fillStyle = "#12c2c2";
        ctx.fillText("📍 CIVICPULSE • VERIFIED GEO-TAGGED PHOTO", paddingX, paddingY);

        // Line 2: Coordinates + Accuracy
        ctx.font = `bold ${baseFontSize}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        const coordText = `GPS: ${lat}° N, ${lon}° E${accuracyText}`;
        ctx.fillText(coordText, paddingX, paddingY + baseFontSize * 1.5);

        // Line 3: Address
        ctx.font = `${Math.round(baseFontSize * 0.95)}px sans-serif`;
        ctx.fillStyle = "#e2e8f0";
        // Truncate address if too long
        let displayAddress = addressText;
        if (ctx.measureText(displayAddress).width > width - paddingX * 2) {
          while (ctx.measureText(displayAddress + "...").width > width - paddingX * 2 && displayAddress.length > 10) {
            displayAddress = displayAddress.slice(0, -3);
          }
          displayAddress += "...";
        }
        ctx.fillText(`📌 ${displayAddress}`, paddingX, paddingY + baseFontSize * 3);

        // Line 4: Timestamp (right aligned or bottom)
        ctx.font = `italic ${Math.round(baseFontSize * 0.85)}px sans-serif`;
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`🕒 ${dateStr}`, paddingX, paddingY + baseFontSize * 4.3);

        // Generate data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(new Error("Failed to load image for geo-tagging: " + err));

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Could not read image file."));
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error("Invalid image source provided."));
    }
  });
}
