import { createSlice } from '@reduxjs/toolkit';

// Helper to load initial cart state safely on client-side
const loadCartFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('burger_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  }
  return [];
};

// Helper to save cart state to localStorage
const saveCartToStorage = (items) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('burger_cart', JSON.stringify(items));
  }
};

// Helper function to recalculate totalQuantity & totalPrice
const calculateTotals = (state) => {
  state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};

const initialState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
  isCartOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart: (state) => {
      state.items = loadCartFromStorage();
      calculateTotals(state);
    },
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((i) => i.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      calculateTotals(state);
      saveCartToStorage(state.items);
    },
    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id);

      calculateTotals(state);
      saveCartToStorage(state.items);
    },
    decreaseQuantity: (state, action) => {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.id === id);

      if (existingItem) {
        if (existingItem.quantity === 1) {
          state.items = state.items.filter((item) => item.id !== id);
        } else {
          existingItem.quantity -= 1;
        }
      }

      calculateTotals(state);
      saveCartToStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      saveCartToStorage([]);
    },
    setIsCartOpen: (state, action) => {
      state.isCartOpen = action.payload;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
  },
});

export const {
  hydrateCart,
  addToCart,
  removeFromCart,
  decreaseQuantity,
  clearCart,
  setIsCartOpen,
  toggleCart,
} = cartSlice.actions;

export default cartSlice.reducer;