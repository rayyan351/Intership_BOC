// src/redux/location/locationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const getInitialLocation = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('boc_selected_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const initialState = {
  selectedLocation: getInitialLocation(),
  isLocationModalOpen: false,
};

export const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      state.selectedLocation = action.payload;
      state.isLocationModalOpen = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('boc_selected_location', JSON.stringify(action.payload));
      }
    },
    clearLocation: (state) => {
      state.selectedLocation = null;
      state.isLocationModalOpen = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('boc_selected_location');
      }
    },
    openLocationModal: (state) => {
      state.isLocationModalOpen = true;
    },
    closeLocationModal: (state) => {
      // Only allowed to close if a location is already chosen
      if (state.selectedLocation) {
        state.isLocationModalOpen = false;
      }
    },
  },
});

export const { setLocation, clearLocation, openLocationModal, closeLocationModal } = locationSlice.actions;
export default locationSlice.reducer;