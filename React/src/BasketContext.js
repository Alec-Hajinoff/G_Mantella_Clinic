import React, { createContext, useContext, useState, useEffect } from "react";

const BasketContext = createContext();

export const BasketProvider = ({ children }) => {
  const [basket, setBasket] = useState(() => {
    const saved = localStorage.getItem("loveday_basket");
    return saved ? JSON.parse(saved) : [];
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("loveday_basket", JSON.stringify(basket));
  }, [basket]);

  const addToBasket = (product, quantity = 1, openDrawer = true) => {
    setBasket((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { ...product, quantity }];
    });

    if (openDrawer) {
      setIsDrawerOpen(true);
    }
  };

  const removeFromBasket = (productId) => {
    setBasket((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromBasket(productId);
      return;
    }
    setBasket((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearBasket = () => setBasket([]);

  const basketCount = basket.reduce((acc, item) => acc + item.quantity, 0);
  const basketSubtotal = basket.reduce(
    (acc, item) => acc + parseFloat(item.price_gbp) * item.quantity,
    0,
  );

  return (
    <BasketContext.Provider
      value={{
        basket,
        addToBasket,
        removeFromBasket,
        updateQuantity,
        clearBasket,
        basketCount,
        basketSubtotal,
        isDrawerOpen,
        setIsDrawerOpen,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
};

export const useBasket = () => useContext(BasketContext);
