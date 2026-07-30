import React, { useEffect, useRef, useState } from "react";

// Helper to dynamically load the Google Maps Script once, queuing callbacks if loaded concurrently
const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  if (!window.googleMapsCallbacks) {
    window.googleMapsCallbacks = [];
  }
  window.googleMapsCallbacks.push(callback);

  if (document.getElementById("google-maps-script")) {
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("VITE_GOOGLE_MAPS_API_KEY is not defined in frontend environment");
    return;
  }

  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    while (window.googleMapsCallbacks && window.googleMapsCallbacks.length) {
      const cb = window.googleMapsCallbacks.shift();
      if (cb) cb();
    }
  };
  script.onerror = () => {
    console.error("Failed to load Google Maps API script");
  };
  document.head.appendChild(script);
};

const MapPreview = ({ latitude, longitude, destinationName }) => {
  const mapRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      setError(true);
      return;
    }

    setError(false);

    const initMap = () => {
      if (!mapRef.current || !window.google || !window.google.maps) return;

      const position = { lat: Number(latitude), lng: Number(longitude) };

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "administrative",
              elementType: "labels.text.fill",
              stylers: [{ color: "#444444" }],
            },
            {
              featureType: "landscape",
              elementType: "all",
              stylers: [{ color: "#f2f2f2" }],
            },
            {
              featureType: "poi",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "road",
              elementType: "all",
              stylers: [{ saturation: -100 }, { lightness: 45 }],
            },
            {
              featureType: "road.highway",
              elementType: "all",
              stylers: [{ visibility: "simplified" }],
            },
            {
              featureType: "road.arterial",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "water",
              elementType: "all",
              stylers: [{ color: "#c8ede9" }, { visibility: "on" }],
            },
          ],
        });

        new window.google.maps.Marker({
          position: position,
          map: map,
          title: destinationName || "Destination",
          animation: window.google.maps.Animation.DROP,
        });
      } catch (err) {
        console.error("Error creating Google Map instance:", err);
        setError(true);
      }
    };

    loadGoogleMapsScript(initMap);
  }, [latitude, longitude, destinationName]);

  if (error) {
    return (
      <div 
        className="w-full h-48 rounded-[18px] bg-slate-100 flex flex-col items-center justify-center border border-slate-200 p-4 text-center"
        role="alert"
        aria-live="polite"
      >
        <span className="text-2xl mb-1" role="img" aria-label="Map icon">🗺️</span>
        <p className="text-xs font-bold text-slate-500">Map details not available</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Please check coordinates or your connection</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-[18px] overflow-hidden border border-slate-100 shadow-inner"
      role="application"
      aria-label={`Interactive Google Map showing location for ${destinationName}`}
    >
      <div
        ref={mapRef}
        className="w-full h-48 sm:h-56 bg-slate-100"
        style={{ minHeight: "192px" }}
      />
    </div>
  );
};

export default MapPreview;
