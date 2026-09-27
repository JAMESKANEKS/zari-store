import { useEffect, useRef, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import "./BarcodeScanner.css";
import { useCart } from "../../context/CartContext";

function BarcodeScanner() {
  // =========================
  // PRODUCTS
  // =========================

  const [products, setProducts] = useState([]);
  const [quantityModal, setQuantityModal] = useState(null);
const [quantityValue, setQuantityValue] = useState("");
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [quickProductsModal, setQuickProductsModal] = useState(false);
const [quickProductSearch, setQuickProductSearch] = useState("");
    
const [paymentModal, setPaymentModal] = useState(false);
const [paymentMethod, setPaymentMethod] = useState("");
const [gcashAmount, setGcashAmount] = useState("");
const [cashAmount, setCashAmount] = useState("");
const [totalGrossProfit, setTotalGrossProfit] = useState(0);



  const [savingSale, setSavingSale] =
    useState(false);

  // =========================
  // BARCODE
  // =========================

  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  // =========================
  // BLUETOOTH
  // =========================

  const [showBluetoothForm, setShowBluetoothForm] =
    useState(false);

  const [bluetoothDevice, setBluetoothDevice] =
    useState(null);

  const [bluetoothConnecting, setBluetoothConnecting] =
    useState(false);

  const [bluetoothMessage, setBluetoothMessage] =
    useState("");

  // =========================
  // MANUAL BARCODE INPUT
  // =========================

  const [manualBarcode, setManualBarcode] =
    useState("");

  // =========================
  // SCANNER BUFFER
  // =========================

  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef(null);

  // =========================
  // SHARED CART
  // =========================

  const {
  cart,
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  removeFromCart,
  clearCart,
  cartTotal,
} = useCart();



const handlePaymentConfirmation = () => {
  const total = Number(cartTotal) || 0;

  // =========================
  // GCASH ONLY
  // =========================

  if (paymentMethod === "gcash") {
    setPaymentModal(false);

    completeSaleWithPayment({
      gcashAmount: total,
      paymentMethod: "GCash Only",
    });

    return;
  }

  // =========================
  // GCASH + CASH
  // =========================

  if (paymentMethod === "gcash_cash") {
    const gcash = Number(gcashAmount) || 0;
    const cash = Number(cashAmount) || 0;
    const paidAmount = gcash + cash;

    if (gcash < 0 || cash < 0) {
      alert("Payment amounts cannot be negative.");
      return;
    }

    if (paidAmount < total) {
      alert(
        `Payment is incomplete.\n\n` +
        `Total Payable: ₱${total.toFixed(2)}\n` +
        `GCash + Cash: ₱${paidAmount.toFixed(2)}\n` +
        `Remaining: ₱${(total - paidAmount).toFixed(2)}`
      );

      return;
    }

    if (paidAmount > total) {
      alert(
        `Payment exceeds the total payable amount.\n\n` +
        `Total Payable: ₱${total.toFixed(2)}\n` +
        `GCash + Cash: ₱${paidAmount.toFixed(2)}`
      );

      return;
    }

    setPaymentModal(false);

    completeSaleWithPayment({
      gcashAmount: gcash,
      cashAmount: cash,
      paymentMethod: "GCash + Cash",
    });
  }
};




const openQuantityModal = (item) => { const product = products.find( (product) => String(product.productId).trim().toLowerCase() === String(item.productId).trim().toLowerCase() ); if (!product) { alert("Product information could not be found."); return; } const currentStock = Number(product.stock) || 0; setQuantityModal({ productId: item.productId, productName: item.productName, currentStock, }); setQuantityValue(String(item.quantity)); }; const closeQuantityModal = () => { setQuantityModal(null); setQuantityValue(""); }; const handleSetQuantity = () => { if (!quantityModal) { return; } const quantity = Number(quantityValue); const currentStock = Number(quantityModal.currentStock) || 0; if (!quantityValue || !Number.isInteger(quantity)) { alert("Please enter a whole number."); return; } if (quantity < 1) { alert("Quantity must be at least 1."); return; } if (currentStock <= 0) { alert("This product is currently out of stock."); return; } if (quantity > currentStock) { alert( `You cannot set the quantity to ${quantity}. Only ${currentStock} item(s) are currently in stock.` ); return; } setQuantity( quantityModal.productId, quantity ); closeQuantityModal(); setMessage( `Quantity updated to ${quantity}.` ); setMessageType("success"); };

  // =========================
  // GET CURRENT USER INFO
  // =========================

  const getCurrentUserInfo = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User is not logged in.");
    }

    const userSnapshot = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    if (!userSnapshot.exists()) {
      throw new Error(
        "User information was not found."
      );
    }

    const userData = userSnapshot.data();

    return {
      userId: currentUser.uid,
      email:
        userData.email || currentUser.email,
      role: userData.role || "unknown",
    };
  };


const completeSaleWithPayment = async ({
  gcashAmount = 0,
  cashAmount = 0,
  paymentMethod = "Cash Only",
}) => {
  // ==========================================
  // CHECK CART
  // ==========================================

  if (cart.length === 0) {
    setMessage("Cannot complete sale. The cart is empty.");
    setMessageType("error");
    return;
  }

  // ==========================================
  // VALIDATE PAYMENT METHOD
  // ==========================================

  if (!paymentMethod) {
    setMessage("Please select a payment method.");
    setMessageType("error");
    return;
  }

  const cartTotalAmount = Number(cartTotal) || 0;

  const finalGcashAmount = Number(gcashAmount) || 0;
  const finalCashAmount = Number(cashAmount) || 0;

  // ==========================================
  // VALIDATE CASH ONLY
  // ==========================================

  if (paymentMethod === "Cash Only") {
    if (finalCashAmount <= 0) {
      setMessage("Please enter the cash received.");
      setMessageType("error");
      return;
    }

    if (finalCashAmount < cartTotalAmount) {
      setMessage(
        `Cash received is not enough. Required: ₱${cartTotalAmount.toFixed(
          2
        )}`
      );
      setMessageType("error");
      return;
    }
  }

  // ==========================================
  // VALIDATE GCASH ONLY
  // ==========================================

  if (paymentMethod === "GCash Only") {
    if (finalGcashAmount <= 0) {
      setMessage("Please enter the GCash amount.");
      setMessageType("error");
      return;
    }

    if (finalGcashAmount < cartTotalAmount) {
      setMessage(
        `GCash amount is not enough. Required: ₱${cartTotalAmount.toFixed(
          2
        )}`
      );
      setMessageType("error");
      return;
    }
  }

  // ==========================================
  // VALIDATE GCASH + CASH
  // ==========================================

  if (paymentMethod === "GCash + Cash") {
    if (finalGcashAmount < 0 || finalCashAmount < 0) {
      setMessage("Payment amounts cannot be negative.");
      setMessageType("error");
      return;
    }

    const combinedPayment =
      finalGcashAmount + finalCashAmount;

    if (combinedPayment < cartTotalAmount) {
      setMessage(
        `Payment is not enough. Required: ₱${cartTotalAmount.toFixed(
          2
        )}`
      );
      setMessageType("error");
      return;
    }
  }

  try {
    setSavingSale(true);

    // ==========================================
    // GET USER INFORMATION
    // ==========================================

    const userInfo = await getCurrentUserInfo();

    // ==========================================
    // CALCULATE CHANGE
    // ==========================================

    let changeAmount = 0;

    if (paymentMethod === "Cash Only") {
      changeAmount = finalCashAmount - cartTotalAmount;
    }

    // For GCash + Cash, cash can also be more than
    // the remaining amount, so calculate the change.
    if (paymentMethod === "GCash + Cash") {
      const remainingAmount =
        cartTotalAmount - finalGcashAmount;

      if (finalCashAmount > remainingAmount) {
        changeAmount =
          finalCashAmount - Math.max(0, remainingAmount);
      }
    }

    changeAmount = Number(changeAmount.toFixed(2));

    // ==========================================
    // FIRESTORE TRANSACTION
    // ==========================================

    const saleReference = await runTransaction(
      db,
      async (transaction) => {
        const productReferences = [];

        let totalSales = 0;
        let totalProfit = 0;
        let totalCostOfGoodsSold = 0;

        // ==========================================
        // CHECK ALL PRODUCTS FIRST
        // ==========================================

        for (const item of cart) {
          if (!item.id) {
            throw new Error(
              `Product "${item.productName}" is missing its database ID.`
            );
          }

          const productRef = doc(
            db,
            "products",
            item.id
          );

          const productSnapshot =
            await transaction.get(productRef);

          if (!productSnapshot.exists()) {
            throw new Error(
              `Product "${item.productName}" was not found.`
            );
          }

          const productData =
            productSnapshot.data();

          // ==========================================
          // CURRENT PRODUCT VALUES
          // ==========================================

          const currentStock =
            Number(productData.stock) || 0;

          const currentProductCost =
            Number(productData.productCost) || 0;

          const sellingPrice =
            Number(productData.sellingPrice) || 0;

          /*
            Use saved costPerItem.

            For older products that do not have
            costPerItem, calculate:

            productCost / stock
          */

          const currentCostPerItem =
            Number(productData.costPerItem) ||
            (
              currentStock > 0
                ? currentProductCost / currentStock
                : 0
            );

          const saleQuantity =
            Number(item.quantity) || 0;

          // ==========================================
          // VALIDATE QUANTITY
          // ==========================================

          if (saleQuantity <= 0) {
            throw new Error(
              `Invalid quantity for "${item.productName}".`
            );
          }

          // ==========================================
          // CHECK STOCK
          // ==========================================

          if (currentStock < saleQuantity) {
            throw new Error(
              `Not enough stock for "${item.productName}". Available: ${currentStock}, requested: ${saleQuantity}.`
            );
          }

          // ==========================================
          // CALCULATE SALE
          // ==========================================

          const subtotal =
            sellingPrice * saleQuantity;

          const costOfGoodsSold =
            currentCostPerItem * saleQuantity;

          const itemProfit =
            subtotal - costOfGoodsSold;

          // ==========================================
          // NEW INVENTORY VALUES
          // ==========================================

          const newStock =
            currentStock - saleQuantity;

          /*
            Remove the cost of the sold items
            from the current inventory cost.
          */

          let newProductCost =
            currentProductCost - costOfGoodsSold;

          // Prevent negative floating-point values
          if (newProductCost < 0) {
            newProductCost = 0;
          }

          newProductCost =
            Number(newProductCost.toFixed(2));

          /*
            Recalculate remaining average cost.
          */

          const newCostPerItem =
            newStock > 0
              ? newProductCost / newStock
              : 0;

          /*
            Selling price stays the same.

            Profit per item is based on the
            cost at the time of the sale.
          */

          const newProfitPerItem =
            sellingPrice - currentCostPerItem;

          // ==========================================
          // ADD TO SALE TOTALS
          // ==========================================

          totalSales += subtotal;

          totalCostOfGoodsSold +=
            costOfGoodsSold;

          totalProfit += itemProfit;

          // ==========================================
          // SAVE PRODUCT INFORMATION FOR UPDATE
          // ==========================================

          productReferences.push({
            ref: productRef,

            productId:
              productData.productId,

            productName:
              productData.productName,

            previousStock:
              currentStock,

            quantity:
              saleQuantity,

            newStock,

            previousProductCost:
              currentProductCost,

            costOfGoodsSold,

            newProductCost,

            costPerItem:
              currentCostPerItem,

            sellingPrice,

            profitPerItem:
              newProfitPerItem,

            itemProfit,

            subtotal,

            newCostPerItem,

            newProfitPerItem,
          });
        }

        // ==========================================
        // ROUND TOTALS
        // ==========================================

        totalSales =
          Number(totalSales.toFixed(2));

        totalCostOfGoodsSold =
          Number(totalCostOfGoodsSold.toFixed(2));

        totalProfit =
          Number(totalProfit.toFixed(2));

        // ==========================================
        // UPDATE PRODUCTS
        // ==========================================

        for (const product of productReferences) {
          transaction.update(
            product.ref,
            {
              // Decrease stock
              stock:
                product.newStock,

              // Decrease total inventory cost
              productCost:
                product.newProductCost,

              // Remaining average cost per item
              costPerItem:
                Number(
                  product.newCostPerItem.toFixed(2)
                ),

              // Expected profit per item
              profitPerItem:
                Number(
                  product.newProfitPerItem.toFixed(2)
                ),

              updatedAt:
                serverTimestamp(),
            }
          );
        }

        // ==========================================
        // PREPARE SALE ITEMS
        // ==========================================

        const saleItems =
          productReferences.map((product) => ({
            productId:
              product.productId,

            productName:
              product.productName,

            sellingPrice:
              Number(
                product.sellingPrice.toFixed(2)
              ),

            costPerItem:
              Number(
                product.costPerItem.toFixed(2)
              ),

            profitPerItem:
              Number(
                product.profitPerItem.toFixed(2)
              ),

            quantity:
              product.quantity,

            subtotal:
              Number(
                product.subtotal.toFixed(2)
              ),

            costOfGoodsSold:
              Number(
                product.costOfGoodsSold.toFixed(2)
              ),

            profit:
              Number(
                product.itemProfit.toFixed(2)
              ),
          }));

        // ==========================================
        // CREATE SALE DOCUMENT
        // ==========================================

        const saleRef = doc(
          collection(db, "sales")
        );

        transaction.set(
          saleRef,
          {
            // Products sold
            items: saleItems,

            // Total revenue
            total: totalSales,

            // Cost of products sold
            costOfGoodsSold:
              totalCostOfGoodsSold,

            // Gross profit
            profit:
              totalProfit,

            // Payment information
            paymentMethod,

            gcashAmount:
              finalGcashAmount,

            cashAmount:
              finalCashAmount,

            change:
              changeAmount,

            // User information
            userId:
              userInfo.userId,

            email:
              userInfo.email,

            role:
              userInfo.role,

            completedAt:
              serverTimestamp(),
          }
        );

        // ==========================================
        // CREATE STOCK MOVEMENTS
        // ==========================================

        for (const product of productReferences) {
          const stockMovementRef =
            doc(
              collection(
                db,
                "stockMovements"
              )
            );

          transaction.set(
            stockMovementRef,
            {
              productId:
                product.productId,

              productName:
                product.productName,

              action:
                "remove",

              quantity:
                product.quantity,

              previousStock:
                product.previousStock,

              newStock:
                product.newStock,

              previousCost:
                Number(
                  product.previousProductCost.toFixed(2)
                ),

              costAmount:
                Number(
                  product.costOfGoodsSold.toFixed(2)
                ),

              newCost:
                Number(
                  product.newProductCost.toFixed(2)
                ),

              previousCostPerItem:
                Number(
                  product.costPerItem.toFixed(2)
                ),

              newCostPerItem:
                Number(
                  product.newCostPerItem.toFixed(2)
                ),

              reason:
                "Sale",

              userId:
                userInfo.userId,

              email:
                userInfo.email,

              role:
                userInfo.role,

              createdAt:
                serverTimestamp(),
            }
          );
        }

        // ==========================================
        // CREATE SALE ACTIVITY
        // ==========================================

        const saleActivityRef =
          doc(
            collection(
              db,
              "saleActivity"
            )
          );

        transaction.set(
          saleActivityRef,
          {
            action:
              "sale_completed",

            saleId:
              saleRef.id,

            // Revenue
            total:
              totalSales,

            // Cost of products sold
            costOfGoodsSold:
              totalCostOfGoodsSold,

            // Gross profit
            profit:
              totalProfit,

            // Payment information
            paymentMethod,

            gcashAmount:
              finalGcashAmount,

            cashAmount:
              finalCashAmount,

            change:
              changeAmount,

            // Products
            items:
              saleItems,

            // User information
            userId:
              userInfo.userId,

            email:
              userInfo.email,

            role:
              userInfo.role,

            createdAt:
              serverTimestamp(),
          }
        );

        // ==========================================
        // RETURN SALE INFORMATION
        // ==========================================

        return {
          saleRef,
          totalSales,
          totalCostOfGoodsSold,
          totalProfit,
          cashAmount:
            finalCashAmount,
          gcashAmount:
            finalGcashAmount,
          change:
            changeAmount,
          paymentMethod,
        };
      }
    );

    // ==========================================
    // CLEAR CART AFTER SUCCESSFUL TRANSACTION
    // ==========================================

    clearCart();

    setBarcodeInput("");
    setManualBarcode("");

    setPaymentMethod("");
    setGcashAmount("");
    setCashAmount("");

    setPaymentModal(false);

    // ==========================================
    // SUCCESS MESSAGE
    // ==========================================

    let successMessage =
      `Sale completed successfully. ` +
      `Profit: ₱${saleReference.totalProfit.toLocaleString(
        "en-PH",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

    if (
      saleReference.paymentMethod ===
      "Cash Only"
    ) {
      successMessage +=
        ` | Change: ₱${saleReference.change.toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;
    }

    setMessage(successMessage);
    setMessageType("success");

    // ==========================================
    // CONSOLE LOGS
    // ==========================================

    console.log(
      "Sale completed:",
      saleReference.saleRef.id
    );

    console.log(
      "Payment Method:",
      saleReference.paymentMethod
    );

    console.log(
      "Cash Amount:",
      saleReference.cashAmount
    );

    console.log(
      "GCash Amount:",
      saleReference.gcashAmount
    );

    console.log(
      "Change:",
      saleReference.change
    );

    console.log(
      "Total Sales:",
      saleReference.totalSales
    );

    console.log(
      "Cost of Goods Sold:",
      saleReference.totalCostOfGoodsSold
    );

    console.log(
      "Total Profit:",
      saleReference.totalProfit
    );
  } catch (error) {
    console.error(
      "Error completing sale:",
      error
    );

    setMessage(
      error.message ||
        "Failed to complete sale."
    );

    setMessageType("error");
  } finally {
    setSavingSale(false);
  }
};


  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const snapshot = await getDocs(
        collection(db, "products")
      );

      const productList = snapshot.docs.map(
        (productDoc) => ({
          id: productDoc.id,
          ...productDoc.data(),
        })
      );

      setProducts(productList);
    } catch (error) {
      console.error(
        "Error loading products:",
        error
      );

      setMessage("Failed to load products.");
      setMessageType("error");
    } finally {
      setLoadingProducts(false);
    }
  };

  // =========================
  // FIND PRODUCT
  // =========================

  const findProduct = (barcode) => {
    const cleanBarcode = String(barcode)
      .trim()
      .toLowerCase();

    return products.find(
      (product) =>
        String(product.productId || "")
          .trim()
          .toLowerCase() === cleanBarcode
    );
  };

  // =========================
  // PROCESS BARCODE
  // =========================

  const processBarcode = (barcode) => {
    const cleanBarcode =
      String(barcode).trim();

    if (!cleanBarcode) {
      return;
    }

    setBarcodeInput(cleanBarcode);

    const product =
      findProduct(cleanBarcode);

    if (!product) {
      setMessage(
        `Product does not exist. Barcode: ${cleanBarcode}`
      );

      setMessageType("error");
      return;
    }

    addToCart(product);

    setMessage(
      `${product.productName} added to cart.`
    );

    setMessageType("success");
  };

  // =========================
  // MANUAL BARCODE SUBMIT
  // =========================

  const handleManualBarcodeSubmit = (
    event
  ) => {
    event.preventDefault();

    const cleanBarcode =
      manualBarcode.trim();

    if (!cleanBarcode) {
      setMessage(
        "Please enter a barcode or Product ID."
      );

      setMessageType("error");
      return;
    }

    processBarcode(cleanBarcode);

    setManualBarcode("");
  };

  // =========================
  // CLEAR CART
  // =========================

  const handleClearCart = () => {
    if (cart.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear the cart?"
    );

    if (!confirmed) {
      return;
    }

    clearCart();

    setMessage("Cart cleared.");
    setMessageType("success");
  };

  // =========================
  // BLUETOOTH CONNECT
  // =========================

  const connectBluetoothScanner =
    async () => {
      if (!navigator.bluetooth) {
        setBluetoothMessage(
          "Web Bluetooth is not supported by this browser. Your scanner can still work if it uses Bluetooth HID / keyboard mode."
        );

        return;
      }

      try {
        setBluetoothConnecting(true);
        setBluetoothMessage("");

        const device =
          await navigator.bluetooth.requestDevice(
            {
              acceptAllDevices: true,
            }
          );

        setBluetoothDevice(device);

        setBluetoothMessage(
          `${
            device.name ||
            "Bluetooth scanner"
          } selected successfully.`
        );

        setShowBluetoothForm(false);
      } catch (error) {
        console.error(
          "Bluetooth connection error:",
          error
        );

        if (
          error.name ===
          "NotFoundError"
        ) {
          setBluetoothMessage(
            "No Bluetooth device was selected."
          );
        } else {
          setBluetoothMessage(
            "Unable to select the Bluetooth device."
          );
        }
      } finally {
        setBluetoothConnecting(false);
      }
    };

  // =========================
  // BLUETOOTH DISCONNECT
  // =========================

  const disconnectBluetoothScanner =
    () => {
      if (
        bluetoothDevice?.gatt
          ?.connected
      ) {
        bluetoothDevice.gatt.disconnect();
      }

      setBluetoothDevice(null);

      setBluetoothMessage(
        "Bluetooth scanner disconnected."
      );
    };

  // =========================
  // BARCODE SCANNER LISTENER
  // =========================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;

      /*
       * Do not capture keyboard input while
       * the user is typing into a normal input.
       */

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      /*
       * Most USB/Bluetooth HID scanners send
       * the barcode followed by Enter.
       */

      if (event.key === "Enter") {
        event.preventDefault();

        const scannedBarcode =
          barcodeBuffer.current;

        barcodeBuffer.current = "";

        if (barcodeTimer.current) {
          clearTimeout(
            barcodeTimer.current
          );
        }

        processBarcode(
          scannedBarcode
        );

        return;
      }

      /*
       * Ignore special keys.
       */

      if (event.key.length !== 1) {
        return;
      }

      barcodeBuffer.current +=
        event.key;

      /*
       * Barcode scanners normally send
       * characters very quickly.
       *
       * If the scanner stops sending data,
       * clear the buffer after a short delay.
       */

      if (barcodeTimer.current) {
        clearTimeout(
          barcodeTimer.current
        );
      }

      barcodeTimer.current =
        setTimeout(() => {
          barcodeBuffer.current = "";
        }, 120);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      if (barcodeTimer.current) {
        clearTimeout(
          barcodeTimer.current
        );
      }
    };
  }, [products]);

  // =========================
  // LOAD PRODUCTS
  // =========================

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredQuickProducts = products.filter((product) => {
    const search = quickProductSearch.toLowerCase().trim();

    if (!search) return true;

    return (
      String(product.productName || "")
        .toLowerCase()
        .includes(search) ||
      String(product.productId || "")
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <div className="barcode-scanner-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="scanner-page-header">

        <div>
          <h1>Barcode Scanner</h1>

          <p>
            Connect a barcode scanner and
            scan products using their
            Product ID or barcode.
          </p>
        </div>

        <div className="scanner-header-actions">

          {!bluetoothDevice ? (
            <button
              type="button"
              className="bluetooth-connect-button"
              onClick={() =>
                setShowBluetoothForm(true)
              }
            >
              <span>⌁</span>
              Connect Bluetooth
            </button>
          ) : (
            <button
              type="button"
              className="bluetooth-disconnect-button"
              onClick={
                disconnectBluetoothScanner
              }
            >
              Disconnect Bluetooth
            </button>
          )}

        </div>

      </div>

      {/* =========================
          BLUETOOTH STATUS
      ========================= */}

      {bluetoothDevice && (
        <div className="bluetooth-connected">

          <span className="bluetooth-status-dot"></span>

          <div>
            <strong>
              Connected Successfully
            </strong>

            <p>
              {bluetoothDevice.name ||
                "Bluetooth Scanner"}
            </p>
          </div>

        </div>
      )}

      {bluetoothMessage &&
        !bluetoothDevice && (
          <div className="bluetooth-message">
            {bluetoothMessage}
          </div>
        )}

      {/* =========================
          SCANNER STATUS
      ========================= */}

      <div className="scanner-status-card">

        <div className="scanner-status-icon">
          ▣
        </div>

        <div>
          <strong>
            Scanner Ready
          </strong>

          <p>
            USB and Bluetooth HID
            scanners are supported.
          </p>
        </div>

        <span className="status-ready">
          Ready
        </span>

      </div>

      {/* =========================
          LAST SCANNED
      ========================= */}

      <div className="scanner-input-section">

        <div className="section-heading">

          <div>
            <h2>
              Last Scanned Barcode
            </h2>

            <p>
              Scan a product using your
              connected barcode scanner.
            </p>
          </div>

        </div>

        <input
          type="text"
          value={barcodeInput}
          readOnly
          placeholder="Waiting for barcode scan..."
        />

      </div>

      {/* =========================
          MANUAL BARCODE
      ========================= */}

      <div className="manual-scanner-section">

        <div className="section-heading">

          <div>
            <h2>
              Add Product Manually
            </h2>

            <p>
              Enter the Product ID or
              barcode to add a product
              to the cart.
            </p>
          </div>

        </div>

        <form
  className="manual-scanner-form"
  onSubmit={handleManualBarcodeSubmit}
>
  <input
    type="text"
    value={manualBarcode}
    onChange={(event) =>
      setManualBarcode(event.target.value)
    }
    placeholder="Enter Product ID / Barcode"
  />

  <button type="submit">
    Add to Cart
  </button>
</form>

<div className="quick-products-button-wrapper">
  <button
    type="button"
    className="quick-products-button"
    onClick={() => {
      setQuickProductsModal(true);
      setQuickProductSearch("");
    }}
  >
    Quick Products
  </button>
</div>
        
        

      </div>

      {quickProductsModal && (
        <div
          className="quick-products-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setQuickProductsModal(false);
            }
          }}
        >
          <section
            className="quick-products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-products-title"
          >
            <div className="quick-products-header">
              <div>
                <h2 id="quick-products-title">Add a Product</h2>
                <p>Search by product name or Product ID.</p>
              </div>

              <button
                type="button"
                className="quick-products-close"
                aria-label="Close product search"
                onClick={() => setQuickProductsModal(false)}
              >
                ×
              </button>
            </div>

            <form
              className="quick-products-search"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="search"
                autoFocus
                value={quickProductSearch}
                onChange={(event) =>
                  setQuickProductSearch(event.target.value)
                }
                placeholder="Search products..."
                aria-label="Search products"
              />
            </form>

            <div className="quick-products-list">
              {filteredQuickProducts.length === 0 ? (
                <p className="quick-products-empty">
                  No matching products found.
                </p>
              ) : (
                filteredQuickProducts.map((product) => {
                  const stock = Number(product.stock) || 0;

                  return (
                    <button
                      type="button"
                      className="quick-product-item"
                      key={product.id || product.productId}
                      disabled={stock <= 0}
                      onClick={() => {
                        addToCart(product);
                        setQuickProductsModal(false);
                        setQuickProductSearch("");
                        setMessage(`${product.productName} added to cart.`);
                        setMessageType("success");
                      }}
                    >
                      <span className="quick-product-info">
                        <strong>{product.productName}</strong>
                        <span>Product ID: {product.productId}</span>
                      </span>

                      <span className="quick-product-right">
                        <strong>
                          ₱{Number(product.sellingPrice || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                        <span>{stock > 0 ? `${stock} in stock` : "Out of stock"}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {/* =========================
          MESSAGE
      ========================= */}

      {message && (
        <div
          className={`scanner-message ${
            messageType === "error"
              ? "message-error"
              : "message-success"
          }`}
        >

          <span>
            {messageType === "error"
              ? "!"
              : "✓"}
          </span>

          <p>{message}</p>

        </div>
      )}

      {/* =========================
          CART
      ========================= */}

      <div className="scanner-cart">

        <div className="cart-header">

          <div>
            <h2>
              Scanned Products
            </h2>

            <p>
              Products scanned from the
              barcode scanner.
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              className="clear-cart-button"
              onClick={
                handleClearCart
              }
            >
              Clear Cart
            </button>
          )}

        </div>

        {loadingProducts ? (
          <div className="cart-empty">

            <div className="loading-spinner"></div>

            <p>
              Loading products...
            </p>

          </div>

        ) : cart.length === 0 ? (

          <div className="cart-empty">

            <div className="empty-cart-icon">
              ▣
            </div>

            <h3>
              No products scanned
            </h3>

            <p>
              Scan a barcode to add a
              product to the cart.
            </p>

          </div>

        ) : (

          <div className="cart-list">

            {cart.map((item) => (

              <div
                className="cart-item"
                key={item.productId}
              >

                <div className="cart-product-info">

                  <div className="cart-product-icon">
                    ▣
                  </div>

                  <div>

                    <strong>
                      {item.productName}
                    </strong>

                    <p>
                      Product ID:{" "}
                      {item.productId}
                    </p>

                    <span>
                      ₱
                      {Number(
                        item.sellingPrice
                      ).toLocaleString(
                        "en-PH",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>

                  </div>

                </div>

                <div className="cart-item-actions">
                  <div className="quantity-section">
                    <div className="quantity-display">
                      <span>Quantity</span>
                      <strong>{item.quantity}</strong>
                    </div>

                    <button
                      type="button"
                      className="set-quantity-btn"
                      onClick={() => openQuantityModal(item)}
                    >
                      Set Quantity
                    </button>

                    <button
                      type="button"
                      className="remove-cart-btn"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </div>

                  <strong className="cart-item-total">
                    ₱
                    {(Number(item.sellingPrice) * Number(item.quantity)).toLocaleString(
                      "en-PH",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </strong>
                </div>

              </div>

            ))}

          </div>

        )}

        {/* =========================
            CART TOTAL
        ========================= */}

        {cart.length > 0 && (
          <div className="cart-total">

            <span>
              Total
            </span>

            <strong>
              ₱
              {cartTotal.toLocaleString(
                "en-PH",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

          </div>
        )}

      </div>

      {/* =========================
          COMPLETE SALE
      ========================= */}

      {cart.length > 0 && (
        <div className="complete-sale-section">

<button
  type="button"
  className="payment-method-btn"
  onClick={() => setPaymentModal(true)}
  disabled={cart.length === 0}
>
  Payment Method
</button>

        </div>
      )}

      {/* =========================
          BLUETOOTH MODAL
      ========================= */}

      {showBluetoothForm && (
        <div
          className="bluetooth-overlay"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowBluetoothForm(false);
            }
          }}
        >

          <div className="bluetooth-modal">

            <div className="bluetooth-modal-header">

              <div>

                <h2>
                  Connect Bluetooth Scanner
                </h2>

                <p>
                  Turn on your Bluetooth
                  barcode scanner and
                  select it from the
                  browser device chooser.
                </p>

              </div>

              <button
                type="button"
                className="bluetooth-close-button"
                onClick={() =>
                  setShowBluetoothForm(false)
                }
              >
                ×
              </button>

            </div>

            <div className="bluetooth-device-box">

              <div className="bluetooth-icon">
                ⌁
              </div>

              <div>

                <strong>
                  Bluetooth Barcode Scanner
                </strong>

                <p>
                  Make sure the scanner is
                  powered on and discoverable.
                </p>

              </div>

            </div>

            <div className="bluetooth-info">

              <strong>
                Supported scanner type
              </strong>

              <p>
                For the widest compatibility,
                configure your scanner as
                Bluetooth HID / Keyboard mode.
              </p>

            </div>

            <button
              type="button"
              className="bluetooth-pair-button"
              onClick={
                connectBluetoothScanner
              }
              disabled={
                bluetoothConnecting
              }
            >
              {bluetoothConnecting
                ? "Opening Device Selector..."
                : "Pair / Select Device"}
            </button>

            <button
              type="button"
              className="bluetooth-cancel-button"
              onClick={() =>
                setShowBluetoothForm(false)
              }
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    
{paymentModal && (
  <div className="payment-modal-overlay">
    <div className="payment-modal">

      <div className="payment-modal-header">
        <h2>Payment Method</h2>

        <button
          type="button"
          className="payment-close-btn"
          onClick={() => {
            setPaymentModal(false);
            setPaymentMethod("");
            setGcashAmount("");
            setCashAmount("");
          }}
        >
          ×
        </button>
      </div>

      <div className="payment-total">
        <span>Total Payable</span>
        <strong>
          ₱
          {Number(cartTotal).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </strong>
      </div>

    



      {!paymentMethod && (
        <div className="payment-method-options">

          <button
            type="button"
            className="payment-option-btn"
            onClick={() => setPaymentMethod("gcash")}
          >
            <strong>GCash Only</strong>
            <span>Customer pays the full amount through GCash</span>
          </button>

          <button
            type="button"
            className="payment-option-btn"
            onClick={() => setPaymentMethod("gcash_cash")}
          >
            <strong>GCash + Cash</strong>
            <span>Customer pays using both GCash and cash</span>
          </button>

          <button
  type="button"
  className={`payment-option-btn ${
    paymentMethod === "Cash Only" ? "active" : ""
  }`}
  onClick={() => {
    setPaymentMethod("Cash Only");
    setCashAmount("");
    setGcashAmount("");
  }}
>
    <strong>Cash Only</strong>
    <span>Customer pays the full amount in cash</span>
</button>


        </div>
      )}

      {paymentMethod === "gcash" && (
        <div className="gcash-confirmation">

          <div className="payment-confirmation-icon">
            ✓
          </div>

          <h3>GCash Payment</h3>

          <p>
            Confirm that the customer has paid the full amount through GCash.
          </p>

          <div className="confirmation-total">
            ₱
            {Number(cartTotal).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="payment-actions">
            <button
              type="button"
              className="payment-back-btn"
              onClick={() => setPaymentMethod("")}
            >
              Back
            </button>

            <button
              type="button"
              className="payment-confirm-btn"
              onClick={() => handlePaymentConfirmation()}
            >
              OK
            </button>
          </div>

        </div>
      )}

      {paymentMethod === "Cash Only" && (
  <div className="payment-form">

    <div className="form-group">
      <label>Cash Received</label>

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Enter cash amount"
        value={cashAmount}
        onChange={(e) => setCashAmount(e.target.value)}
      />
    </div>

    {Number(cashAmount) > 0 && (
      <div className="cash-change-box">
        <div>
          <span>Cash Received</span>
          <strong>₱{Number(cashAmount).toFixed(2)}</strong>
        </div>

        <div>
          <span>Change</span>
          <strong>
            ₱
            {Math.max(
              0,
              Number(cashAmount) - Number(cartTotal)
            ).toFixed(2)}
          </strong>
        </div>
      </div>
    )}

    {Number(cashAmount) > 0 &&
      Number(cashAmount) < Number(cartTotal) && (
        <p className="payment-error">
          Cash received is not enough.
        </p>
      )}

    <button
      type="button"
      className="payment-confirm-btn"
      disabled={
        savingSale ||
        !cashAmount ||
        Number(cashAmount) < Number(cartTotal)
      }
      onClick={() =>
        completeSaleWithPayment({
          cashAmount,
          paymentMethod: "Cash Only",
        })
      }
    >
      {savingSale ? "Processing..." : "Complete Sale"}
    </button>
  </div>
)}

      {paymentMethod === "gcash_cash" && (
        <div className="gcash-cash-form">

          <div className="form-group">
            <label>GCash Amount</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={gcashAmount}
              onChange={(e) => setGcashAmount(e.target.value)}
              placeholder="Enter GCash amount"
            />
          </div>

          <div className="form-group">
            <label>Cash Amount</label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="Enter cash amount"
            />
          </div>

          <div className="payment-balance">
            <div>
              <span>Total Payable</span>
              <strong>
                ₱
                {Number(cartTotal).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div>
              <span>GCash + Cash</span>
              <strong>
                ₱
                {(
                  Number(gcashAmount || 0) +
                  Number(cashAmount || 0)
                ).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>

            <div className="remaining-balance">
              <span>Balance</span>
              <strong>
                ₱
                {Math.max(
                  0,
                  Number(cartTotal) -
                    (Number(gcashAmount || 0) +
                      Number(cashAmount || 0))
                ).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          <div className="payment-actions">

            <button
              type="button"
              className="payment-back-btn"
              onClick={() => {
                setPaymentMethod("");
                setGcashAmount("");
                setCashAmount("");
              }}
            >
              Back
            </button>

            <button
              type="button"
              className="payment-confirm-btn"
              onClick={() => handlePaymentConfirmation()}
            >
              Confirm Payment
            </button>

          </div>

        </div>
      )}

    </div>
  </div>
)}



      {quantityModal && ( <div className="quantity-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) { closeQuantityModal(); } }} > <div className="quantity-modal"> <div className="quantity-modal-header"> <div> <h3>Set Quantity</h3> <p>Set how many items you want to sell.</p> </div> <button type="button" className="quantity-modal-close" onClick={closeQuantityModal} > × </button> </div> <div className="quantity-modal-body"> <div className="quantity-product-name"> {quantityModal.productName} </div> <div className="stock-info"> <div> <span>Current Stock</span> <strong> {quantityModal.currentStock} </strong> </div> <div> <span>Current Cart Qty.</span> <strong> {cart.find( (item) => item.productId === quantityModal.productId )?.quantity || 0} </strong> </div> </div> <label htmlFor="quantityInput"> Enter Quantity </label> <input id="quantityInput" type="number" min="1" max={quantityModal.currentStock} value={quantityValue} onChange={(event) => { setQuantityValue(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSetQuantity(); } if (event.key === "Escape") { closeQuantityModal(); } }} autoFocus /> <p className="quantity-help-text"> You can set a maximum of{" "} <strong> {quantityModal.currentStock} </strong>{" "} item(s). </p> </div> <div className="quantity-modal-actions"> <button type="button" className="quantity-cancel-btn" onClick={closeQuantityModal} > Cancel </button> <button type="button" className="quantity-confirm-btn" onClick={handleSetQuantity} > Set Quantity </button> </div> </div> </div> )}

      </div>

    
  );
}

export default BarcodeScanner;

