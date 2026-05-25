import { useState } from 'react';

export const useCart = () => {
  const [items, setItems] = useState([]);

  const addToCart = (item: any) => {
    // @ts-ignore
    setItems((prev) => [...prev, item]);
  };

  return {
    items,
    addToCart,
  };
};
