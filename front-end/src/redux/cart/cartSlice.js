import { createSlice } from '@reduxjs/toolkit';

// Generate unique identifier based on ID, customizations, and notes
const generateCartItemId = (item) => {
  const baseId = item._id || item.id || 'item';
  const choicesKey = item.selectedChoices
    ? JSON.stringify(item.selectedChoices)
    : '';
  const instructionsKey = (item.specialInstructions || '').trim().toLowerCase();

  return `${baseId}-${choicesKey}-${instructionsKey}`;
};

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
    try {
      localStorage.setItem('burger_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }
};

// Helper to recalculate totalQuantity & totalPrice
const calculateTotals = (state) => {
  state.totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
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
      const quantityToAdd = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const cartItemId = item.cartItemId || generateCartItemId(item);

      const existingItemIndex = state.items.findIndex(
        (i) => i.cartItemId === cartItemId
      );

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += quantityToAdd;
      } else {
        state.items.push({
          ...item,
          cartItemId,
          quantity: quantityToAdd,
        });
      }

      calculateTotals(state);
      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action) => {
      const cartItemId = action.payload;
      state.items = state.items.filter(
        (item) => item.cartItemId !== cartItemId && item.id !== cartItemId && item._id !== cartItemId
      );

      calculateTotals(state);
      saveCartToStorage(state.items);
    },

    decreaseQuantity: (state, action) => {
      const cartItemId = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.cartItemId === cartItemId || item.id === cartItemId || item._id === cartItemId
      );

      if (existingItemIndex > -1) {
        if (state.items[existingItemIndex].quantity <= 1) {
          state.items.splice(existingItemIndex, 1);
        } else {
          state.items[existingItemIndex].quantity -= 1;
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