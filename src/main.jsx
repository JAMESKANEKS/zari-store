import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/layout.css";
import { CartProvider } from "./context/CartContext";
import "./styles/login.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <CartProvider>
    <App />
    </CartProvider>
  </React.StrictMode>
);
