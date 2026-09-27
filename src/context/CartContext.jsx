import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const removeFromCart = (productId) => { setCart((currentCart) => currentCart.filter( (item) => String(item.productId).toLowerCase() !== String(productId).toLowerCase() ) ); };

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) =>
          String(item.productId).toLowerCase() ===
          String(product.productId).toLowerCase()
      );

      if (existingProduct) {
        return currentCart.map((item) =>
          String(item.productId).toLowerCase() ===
          String(product.productId).toLowerCase()
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          productId: product.productId,
          productName: product.productName,
          sellingPrice: Number(product.sellingPrice) || 0,
          quantity: 1,
        },
      ];
    });
  };

  // =========================
  // INCREASE QUANTITY
  // =========================

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // =========================
  // DECREASE QUANTITY
  // =========================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // =========================
  // SET QUANTITY
  // =========================

  const setQuantity = (productId, quantity) => {
    const newQuantity = Number(quantity);

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity < 1
    ) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.productId).toLowerCase() ===
        String(productId).toLowerCase()
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );
  };

  // =========================
  // CLEAR CART
  // =========================

  const clearCart = () => {
    setCart([]);
  };

  // =========================
  // CART TOTAL
  // =========================

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.sellingPrice) *
        Number(item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,

        addToCart,

        increaseQuantity,
        decreaseQuantity,
        setQuantity,
        removeFromCart,
        clearCart,

        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

