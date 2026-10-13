import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('brandspyre_sales_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('brandspyre_sales_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {}
  }, [wishlistIds]);

  useEffect(() => {
    const fetchRemoteWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/wishlist');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setWishlistProducts(res.data.data);
          setWishlistIds(res.data.data.map((p: Product) => p._id));
        }
      } catch (e) {}
    };

    fetchRemoteWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const isCurrent = wishlistIds.includes(product._id);
    if (isCurrent) {
      setWishlistIds(prev => prev.filter(id => id !== product._id));
      setWishlistProducts(prev => prev.filter(p => p._id !== product._id));
    } else {
      setWishlistIds(prev => [...prev, product._id]);
      setWishlistProducts(prev => [...prev, product]);
    }

    try {
      await api.post('/wishlist/toggle', { product_id: product._id });
    } catch (e) {
      // Rollback on fail
      if (isCurrent) {
        setWishlistIds(prev => [...prev, product._id]);
      } else {
        setWishlistIds(prev => prev.filter(id => id !== product._id));
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        isInWishlist,
        toggleWishlist,
        wishlistCount: wishlistIds.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
