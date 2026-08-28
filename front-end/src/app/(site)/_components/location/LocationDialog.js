// src/app/(site)/_components/location/LocationDialog.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLocation, closeLocationModal } from "@/redux/location/locationSlice";
import { useLocation } from "@/context/LocationContext";
import { Icon } from "@/components/ui/Icons";
import { useGetDeliveryAreasQuery } from "@/services/deliveryAreaApi";

export function LocationDialog() {
  const dispatch = useDispatch();
  const reduxLocation = useSelector((state) => state.location?.selectedLocation);
  const isReduxModalOpen = useSelector((state) => state.location?.isLocationModalOpen);

  const locationContext = useLocation ? useLocation() : {};
  const {
    isLocationOpen,
    setIsLocationOpen,
    selectedBranch,
    setSelectedBranch,
    setBranch,
    updateLocation,
  } = locationContext || {};

  const [activeCity, setActiveCity] = useState("Karachi");
  const [chosenAreaId, setChosenAreaId] = useState("");
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [gpsSuccessMessage, setGpsSuccessMessage] = useState("");

  const { data: rawDeliveryAreas, isLoading } = useGetDeliveryAreasQuery();

  const deliveryAreas = useMemo(() => {
    if (Array.isArray(rawDeliveryAreas)) return rawDeliveryAreas;
    if (Array.isArray(rawDeliveryAreas?.data)) return rawDeliveryAreas.data;
    if (Array.isArray(rawDeliveryAreas?.deliveryAreas)) return rawDeliveryAreas.deliveryAreas;
    return [];
  }, [rawDeliveryAreas]);

  const activeSavedLocation = reduxLocation || selectedBranch;

  const cityAreas = useMemo(() => {
    return deliveryAreas.filter((a) => {
      const cityMatches = a.city?.toLowerCase() === activeCity.toLowerCase();
      const isActive = a.isActive !== false;
      return cityMatches && isActive;
    });
  }, [deliveryAreas, activeCity]);

  useEffect(() => {
    if (activeSavedLocation?.city) {
      setActiveCity(activeSavedLocation.city);
    }
    if (activeSavedLocation?.areaId || activeSavedLocation?._id) {
      setChosenAreaId(activeSavedLocation.areaId || activeSavedLocation._id);
    }
  }, [activeSavedLocation]);

  useEffect(() => {
    if (cityAreas.length > 0) {
      const exists = cityAreas.some((a) => a._id === chosenAreaId);
      if (!exists) {
        setChosenAreaId(cityAreas[0]._id);
      }
    } else {
      setChosenAreaId("");
    }
  }, [activeCity, cityAreas, chosenAreaId]);

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleClose = () => {
    if (typeof setIsLocationOpen === "function") {
      setIsLocationOpen(false);
    }
    dispatch(closeLocationModal());
  };

  const saveLocationState = (payload) => {
    dispatch(setLocation(payload));

    if (typeof setSelectedBranch === "function") {
      setSelectedBranch(payload);
    } else if (typeof setBranch === "function") {
      setBranch(payload);
    } else if (typeof updateLocation === "function") {
      updateLocation(payload);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedBranch", JSON.stringify(payload));
      localStorage.setItem("boc_selected_location", JSON.stringify(payload));
    }

    handleClose();
  };

  const handleUseCurrentLocation = () => {
    setLocationError("");
    setGpsSuccessMessage("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let nearestZone = null;
        let minDistance = Infinity;

        deliveryAreas.forEach((area) => {
          if (area.latitude && area.longitude) {
            const dist = getDistanceKm(userLat, userLng, Number(area.latitude), Number(area.longitude));
            if (dist < minDistance) {
              minDistance = dist;
              nearestZone = area;
            }
          }
        });

        if (!nearestZone || minDistance > 20) {
          setIsLocatingGPS(false);
          setLocationError("Sorry! We do not deliver to your current location yet.");
          return;
        }

        setActiveCity(nearestZone.city);
        setChosenAreaId(nearestZone._id);
        setGpsSuccessMessage(`Detected Nearest Area: ${nearestZone.name}`);
        setIsLocatingGPS(false);
      },
      () => {
        setIsLocatingGPS(false);
        setLocationError("Unable to retrieve your GPS location. Please select your sector manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    const selectedArea = cityAreas.find((a) => a._id === chosenAreaId);
    if (!selectedArea) return;

    const locationPayload = {
      areaId: selectedArea._id,
      areaName: selectedArea.name,
      city: selectedArea.city,
      deliveryFee: selectedArea.deliveryFee || 0,
      estimatedMinutes: selectedArea.dynamicETA || selectedArea.estimatedDeliveryMinutes || 35,
      assignedBranch: selectedArea.assignedBranch,
      _id: selectedArea.assignedBranch?._id || selectedArea.assignedBranch,
      name: selectedArea.name,
      branchName: selectedArea.assignedBranch?.name || "Kitchen Outlet",
    };

    saveLocationState(locationPayload);
  };

  const isMandatory = !activeSavedLocation;
  const isVisible = isLocationOpen || isReduxModalOpen || isMandatory;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isMandatory) handleClose();
        }}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-[460px] bg-white border border-neutral-200/90 text-neutral-900 rounded-[28px] p-6 sm:p-7 shadow-2xl z-10 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#F4C61A] text-neutral-950 grid place-items-center font-bold shadow-2xs">
              <Icon name="location" size={17} strokeWidth={2.4} />
            </span>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 m-0 uppercase">
              Select Delivery Location
            </h3>
          </div>

          {!isMandatory && (
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-500 hover:text-neutral-900 grid place-items-center transition cursor-pointer"
            >
              <Icon name="close" size={15} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {locationError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            ⚠️ {locationError}
          </div>
        )}

        {gpsSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <span>✓</span>
            <span>{gpsSuccessMessage}</span>
          </div>
        )}

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocatingGPS}
          className="w-full mt-4 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-neutral-900 font-bold text-xs uppercase tracking-wider transition border border-slate-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          <span>🎯</span>
          <span>{isLocatingGPS ? "Locating via GPS..." : "Use My Current Location"}</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-neutral-100"></div>
          <span className="px-3 text-[10px] font-black uppercase text-neutral-400">or choose sector</span>
          <div className="flex-grow border-t border-neutral-100"></div>
        </div>

        {/* City Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["Karachi", "Lahore", "Islamabad"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setActiveCity(city);
                setChosenAreaId("");
                setGpsSuccessMessage("");
              }}
              className={`py-2.5 px-2 rounded-2xl border-2 transition text-xs font-black uppercase tracking-wider cursor-pointer ${
                activeCity.toLowerCase() === city.toLowerCase()
                  ? "border-[#F4C61A] bg-[#F4C61A]/15 text-neutral-950 font-extrabold shadow-2xs"
                  : "border-slate-100 bg-slate-50/70 text-neutral-500 hover:border-slate-200 hover:text-neutral-900"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Neighborhood Sector Dropdown */}
        <div className="space-y-1.5 mb-5">
          {isLoading ? (
            <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-neutral-400">
              Loading sectors...
            </div>
          ) : cityAreas.length === 0 ? (
            <div className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-neutral-500">
              No delivery sectors mapped for {activeCity}.
            </div>
          ) : (
            <select
              value={chosenAreaId}
              onChange={(e) => {
                setChosenAreaId(e.target.value);
                setGpsSuccessMessage("");
              }}
              className="w-full h-11 px-3.5 rounded-2xl bg-white border border-neutral-200/90 text-neutral-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#F4C61A] focus:ring-2 focus:ring-[#F4C61A]/20 cursor-pointer shadow-2xs"
            >
              <option value="" disabled>Select your sector</option>
              {cityAreas.map((area) => (
                <option key={area._id} value={area._id} className="text-neutral-900">
                  {area.name} {area.deliveryFee === 0 ? "(Free Delivery)" : `(Delivery: Rs. ${area.deliveryFee})`}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!chosenAreaId || cityAreas.length === 0}
          className="w-full h-12 rounded-2xl bg-[#F4C61A] hover:bg-[#e5b713] text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider transition disabled:opacity-40 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}