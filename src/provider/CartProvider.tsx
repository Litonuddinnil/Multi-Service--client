import React, { createContext, useContext, useState, useEffect } from 'react';
import { CommerceProduct } from '../types';
import { StorageService } from '../services/storage';

interface CartItem {
  product: CommerceProduct;
  quantity: number;
}

export interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotalBDT: number;
  addToCart: (product: CommerceProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  enrollments: { productId: string; enrolledAt: string }[];
  isEnrolled: (productId: string) => boolean;
  checkoutCart: () => Promise<boolean>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [enrollments, setEnrollments] = useState<{ productId: string; enrolledAt: string }[]>([]);

  useEffect(() => {
    const ens = StorageService.getCommerceEnrollments();
    setEnrollments(ens);
  }, []);

  const addToCart = (product: CommerceProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isEnrolled = (productId: string) => {
    return enrollments.some(e => e.productId === productId);
  };

  const checkoutCart = async () => {
    if (cart.length === 0) return false;
    const now = new Date().toISOString();
    const newEnrollments = [...enrollments];

    cart.forEach(item => {
      if (!newEnrollments.some(e => e.productId === item.product.id)) {
        newEnrollments.push({ productId: item.product.id, enrolledAt: now });
      }
    });

    setEnrollments(newEnrollments);
    StorageService.saveCommerceEnrollments(newEnrollments);
    clearCart();
    return true;
  };

  const cartCount = cart.length;
  const cartTotalBDT = cart.reduce((sum, item) => sum + item.product.priceBDT * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartTotalBDT,
      addToCart,
      removeFromCart,
      clearCart,
      enrollments,
      isEnrolled,
      checkoutCart
    }}>
      {children}
    </CartContext.Provider>
  );
};