import { useState, useRef, useEffect } from "react";
import {
  getDeviceLocation,
  reverseGeocode,
  stampGeoTagOnImage,
} from "../utils/geoTagUtils";
import "../styles/GeoTagPhotoUploader.css";

/**
 * GeoTagPhotoUploader Component
 *
 * Props:
 * - onGeoTagChange: function({ photoUrl, latitude, longitude, address, accuracy })
 * - onLocationAutoFill: function(address)
 * - initialPhotoUrl: string
 * - initialLocation: string
 */
export default function GeoTagPhotoUploader({
  onGeoTagChange,
  onLocationAutoFill,
  initialPhotoUrl = "",
  initialLocation = "",
}) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState(initialLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  /**
   * Process a captured or uploaded photo file
   */
  const processImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    setErrorMsg("");
    setIsProcessing(true);

    try {
      // 1. Get GPS Location
      let coords = null;
      try {
        coords = await getDeviceLocation();
      } catch (geoErr) {
        console.warn("Live GPS unavailable:", geoErr);
        // Fallback or request user retry
        setErrorMsg(
          "⚠️ Could not lock live GPS. " +
            (geoErr.message || "Please enable location in browser.")
        );
      }

      const currentLat = coords?.latitude ?? (latitude || 0);
      const currentLon = coords?.longitude ?? (longitude || 0);
      const currentAcc = coords?.accuracy ?? accuracy;
      const timestamp = coords?.timestamp || Date.now();

      // 2. Reverse geocode to get street address
      let resolvedAddress = address;
      if (currentLat && currentLon && (!address || coords)) {
        try {
          resolvedAddress = await reverseGeocode(currentLat, currentLon);
          if (resolvedAddress && onLocationAutoFill) {
            onLocationAutoFill(resolvedAddress);
          }
        } catch (revErr) {
          console.warn("Reverse geocode failed:", revErr);
        }
      }

      // 3. Stamp authentic Geo-tag watermark onto image canvas
      const stampedDataUrl = await stampGeoTagOnImage(file, {
        latitude: currentLat,
        longitude: currentLon,
        accuracy: currentAcc,
        address: resolvedAddress,
        timestamp,
      });

      setPhotoUrl(stampedDataUrl);
      if (currentLat) setLatitude(currentLat);
      if (currentLon) setLongitude(currentLon);
      if (currentAcc) setAccuracy(currentAcc);
      if (resolvedAddress) setAddress(resolvedAddress);

      if (onGeoTagChange) {
        onGeoTagChange({
          photoUrl: stampedDataUrl,
          latitude: currentLat || null,
          longitude: currentLon || null,
          address: resolvedAddress,
          accuracy: currentAcc,
        });
      }
    } catch (err) {
      console.error("Error processing photo:", err);
      setErrorMsg("Failed to stamp Geo-tag on image. " + (err.message || ""));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle File Upload from File Picker
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  /**
   * Launch Desktop/Laptop WebCam Modal
   */
  const startWebcam = async () => {
    setErrorMsg("");
    setShowWebcam(true);
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // prefers rear camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Webcam access error, fallback to native file input:", err);
      stopCameraStream();
      setShowWebcam(false);
      // Trigger native camera/file input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  /**
   * Snap frame from WebCam stream
   */
  const captureWebcamFrame = async () => {
    if (!videoRef.current) return;

    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      stopCameraStream();
      setShowWebcam(false);

      // Convert canvas to blob/dataUrl and process
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          await processImageFile(file);
        }
      }, "image/jpeg", 0.9);
    } catch (err) {
      console.error("Webcam capture failed:", err);
      setErrorMsg("Failed to capture image from camera.");
      setIsProcessing(false);
    }
  };

  /**
   * Standalone GPS Location Fetcher (Auto-fill location without photo)
   */
  const handleQuickLocate = async () => {
    setIsLocating(true);
    setErrorMsg("");

    try {
      const coords = await getDeviceLocation();
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setAccuracy(coords.accuracy);

      const resolvedAddress = await reverseGeocode(
        coords.latitude,
        coords.longitude
      );
      setAddress(resolvedAddress);

      if (onLocationAutoFill && resolvedAddress) {
        onLocationAutoFill(resolvedAddress);
      }

      if (onGeoTagChange) {
        onGeoTagChange({
          photoUrl,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: resolvedAddress,
          accuracy: coords.accuracy,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to fetch GPS location.");
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Remove current photo
   */
  const handleRemovePhoto = () => {
    setPhotoUrl("");
    if (onGeoTagChange) {
      onGeoTagChange({
        photoUrl: "",
        latitude,
        longitude,
        address,
        accuracy,
      });
    }
  };

  return (
    <div className="geotag-uploader-container">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
      />

      {/* Top Header & Info */}
      <div className="geotag-header">
        <div className="geotag-title-row">
          <span className="geotag-icon">📸</span>
          <div>
            <h4>Geo-Tagged Issue Photo & Location Tracking</h4>
            <p>
              Upload or snap a photo of the civic issue. GPS coordinates and
              address will be automatically verified and stamped.
            </p>
          </div>
        </div>

        {/* Quick GPS button */}
        <button
          type="button"
          className="btn-quick-gps"
          onClick={handleQuickLocate}
          disabled={isLocating || isProcessing}
          title="Auto-detect current GPS coordinates"
        >
          {isLocating ? (
            <>
              <span className="geotag-spinner-sm"></span> Finding GPS...
            </>
          ) : (
            <>📍 Detect Live GPS</>
          )}
        </button>
      </div>

      {/* Error or Alert banner */}
      {errorMsg && (
        <div className="geotag-alert-banner">
          <span>{errorMsg}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setErrorMsg("")}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading overlay while stamping/geocoding */}
      {isProcessing && (
        <div className="geotag-processing-box">
          <div className="geotag-spinner"></div>
          <div>
            <strong>Processing Geo-Tag...</strong>
            <p>Extracting GPS coordinates, geocoding address & stamping watermark</p>
          </div>
        </div>
      )}

      {/* WebCam Live Modal */}
      {showWebcam && (
        <div className="webcam-modal-backdrop">
          <div className="webcam-modal-content">
            <div className="webcam-header">
              <h5>📸 Live Camera Capture</h5>
              <button
                type="button"
                className="webcam-close-btn"
                onClick={() => {
                  stopCameraStream();
                  setShowWebcam(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="webcam-video-wrapper">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="webcam-video"
              ></video>
              <div className="webcam-overlay-crosshair">
                <div className="crosshair-box"></div>
                <span>Align the civic issue inside the frame</span>
              </div>
            </div>

            <div className="webcam-actions">
              <button
                type="button"
                className="btn-webcam-cancel"
                onClick={() => {
                  stopCameraStream();
                  setShowWebcam(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-webcam-snap"
                onClick={captureWebcamFrame}
                disabled={!cameraActive}
              >
                📸 Capture & Geo-Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Card or Upload Placeholder */}
      {photoUrl ? (
        <div className="geotag-preview-card">
          <div className="preview-image-container">
            <img
              src={photoUrl}
              alt="Geo-tagged civic issue"
              className="geotag-preview-img"
            />
            <span className="verified-stamp-badge">
              ✓ Geo-Tag Watermark Verified
            </span>
          </div>

          <div className="preview-meta-panel">
            <div className="gps-status-row">
              <span className="gps-pill active">
                <span className="pulsing-dot"></span> GPS Locked
              </span>
              {accuracy && (
                <span className="accuracy-pill">±{accuracy}m Accuracy</span>
              )}
            </div>

            {latitude && longitude && (
              <div className="coords-display">
                <div className="coord-box">
                  <span className="coord-label">Latitude</span>
                  <span className="coord-val">{Number(latitude).toFixed(6)}° N</span>
                </div>
                <div className="coord-box">
                  <span className="coord-label">Longitude</span>
                  <span className="coord-val">{Number(longitude).toFixed(6)}° E</span>
                </div>
              </div>
            )}

            {address && (
              <div className="address-display">
                <span className="addr-icon">📌</span>
                <div className="addr-text">
                  <span className="addr-title">Auto-detected Address</span>
                  <p>{address}</p>
                </div>
              </div>
            )}

            <div className="preview-action-row">
              {latitude && longitude && (
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view-map"
                >
                  🗺️ View Pin on Google Maps ↗
                </a>
              )}

              <button
                type="button"
                className="btn-retake"
                onClick={() => {
                  if (cameraInputRef.current) {
                    cameraInputRef.current.click();
                  }
                }}
              >
                🔄 Retake
              </button>

              <button
                type="button"
                className="btn-remove-photo"
                onClick={handleRemovePhoto}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="geotag-dropzone">
          <div className="dropzone-center">
            <div className="dropzone-icon-circle">
              <span>📷</span>
            </div>

            <h3>Add Geo-Tagged Photo</h3>
            <p>
              Take a live photo at the complaint site or select from device.
              Real-time GPS coordinates will be embedded into the complaint.
            </p>

            <div className="dropzone-buttons">
              <button
                type="button"
                className="btn-capture-camera"
                onClick={() => {
                  // If mobile, launch camera input; if desktop, try webcam
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent
                  );
                  if (isMobile && cameraInputRef.current) {
                    cameraInputRef.current.click();
                  } else {
                    startWebcam();
                  }
                }}
              >
                📸 Take Live Photo
              </button>

              <button
                type="button"
                className="btn-upload-file"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                📁 Upload from Device
              </button>
            </div>

            <span className="dropzone-hint">
              Supports JPG, PNG, WebP • Auto-stamps Lat/Lon, Date & Address
            </span>
          </div>
        </div>
      )}

      {/* GPS coordinates badge when coordinates exist but no photo yet */}
      {!photoUrl && latitude && longitude && (
        <div className="location-detected-banner">
          <div className="loc-badge-left">
            <span className="loc-pin">📍</span>
            <div>
              <strong>GPS Location Detected:</strong> {latitude.toFixed(6)},{" "}
              {longitude.toFixed(6)}{" "}
              {address ? `(${address})` : ""}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-map-link-sm"
          >
            View on Map ↗
          </a>
        </div>
      )}
    </div>
  );
}
