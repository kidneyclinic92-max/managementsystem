import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem } from '@/types';

interface CartItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: InventoryItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [cart]);

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem('cart');
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item: InventoryItem, quantity: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.itemId === item.id);
      if (existing) {
        return prevCart.map((c) =>
          c.itemId === item.id
            ? {
                ...c,
                quantity: c.quantity + quantity,
                subtotal: (c.quantity + quantity) * c.price,
              }
            : c
        );
      }
      return [
        ...prevCart,
        {
          itemId: item.id,
          itemName: item.name,
          quantity,
          price: item.price,
          subtotal: quantity * item.price,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((c) =>
        c.itemId === itemId
          ? { ...c, quantity, subtotal: quantity * c.price }
          : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

















