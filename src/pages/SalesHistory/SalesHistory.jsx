import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../../firebase/config";
import "./salesHistory.css";

function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected sale for View modal
  const [selectedSale, setSelectedSale] = useState(null);

  const loadSalesHistory = async () => {
    try {
      setLoading(true);

      const salesQuery = query(
        collection(db, "saleActivity"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(salesQuery);

      const salesList = snapshot.docs.map((saleDoc) => ({
        id: saleDoc.id,
        ...saleDoc.data(),
      }));

      setSales(salesList);
    } catch (error) {
      console.error("Error loading sales history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesHistory();
  }, []);

  // ---------------------------------------
  // TOTAL SALES
  // ---------------------------------------
  const totalSales = sales.reduce(
    (total, sale) => total + (Number(sale.total) || 0),
    0
  );

  // ---------------------------------------
  // TOTAL GCASH
  // ---------------------------------------
  const totalGcash = sales.reduce(
    (total, sale) => total + (Number(sale.gcashAmount) || 0),
    0
  );

  // ---------------------------------------
// TOTAL PROFIT
// ---------------------------------------
const totalProfit = sales.reduce(
  (total, sale) => total + (Number(sale.profit) || 0),
  0
);
  

  // ---------------------------------------
  // TOTAL TRANSACTIONS
  // ---------------------------------------
  const totalTransactions = sales.length;

  // ---------------------------------------
  // FORMAT DATE
  // ---------------------------------------
  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "Date unavailable";
    }

    const date =
      typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };



  // ---------------------------------------
  // GET ITEM COUNT
  // ---------------------------------------
  const getItemCount = (items) => {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    );
  };

  // ---------------------------------------
  // FORMAT CURRENCY
  // ---------------------------------------
  const formatCurrency = (amount) => {
    return `₱${(Number(amount) || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ---------------------------------------
  // VIEW SALE
  // ---------------------------------------
  const handleViewSale = (sale) => {
    setSelectedSale(sale);
  };

  // ---------------------------------------
  // CLOSE MODAL
  // ---------------------------------------
  const handleCloseSaleModal = () => {
    setSelectedSale(null);
  };

  return (
    <div className="sales-history-page">

      {/* =====================================
          HEADER
      ====================================== */}
      <div className="sales-history-header">
        <div>
          <h1>Sales History</h1>

          <p>
            View completed sales and transaction records.
          </p>
        </div>
      </div>

      {/* =====================================
          SUMMARY
      ====================================== */}
      <div className="sales-summary">

        {/* TOTAL SALES */}
        <div className="sales-summary-card">
          <div className="sales-summary-icon">₱</div>

          <div className="sales-summary-content">
            <span>Total Sales</span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(totalSales)}
            </strong>
          </div>
        </div>

        {/* TOTAL GCASH */}
        <div className="sales-summary-card">
          <div className="sales-summary-icon">G</div>

          <div className="sales-summary-content">
            <span>Total GCash</span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(totalGcash)}
            </strong>
          </div>
        </div>

        {/* TOTAL PROFIT */}
<div className="sales-summary-card">
  <div className="sales-summary-icon">₱</div>

  <div className="sales-summary-content">
    <span>Total Profit</span>

    <strong className="profit-amount">
      {loading
        ? "Loading..."
        : formatCurrency(totalProfit)}
    </strong>
  </div>
</div>

        {/* TOTAL TRANSACTIONS */}
        <div className="sales-summary-card">
          <div className="sales-summary-icon">#</div>

          <div className="sales-summary-content">
            <span>Total Transactions</span>

            <strong>
              {loading
                ? "Loading..."
                : totalTransactions.toLocaleString("en-PH")}
            </strong>
          </div>
        </div>

      </div>

      {/* =====================================
          SALES HISTORY
      ====================================== */}
      <div className="sales-history-card">

        <div className="sales-history-card-header">
          <div>
            <h2>Sales History</h2>

            <p>
              Completed transactions recorded in the
              system.
            </p>
          </div>

          <span className="transaction-count">
            {totalTransactions} transaction
            {totalTransactions !== 1 ? "s" : ""}
          </span>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="sales-history-empty">
            <div className="loading-spinner"></div>

            <p>Loading sales history...</p>
          </div>

        ) : sales.length === 0 ? (

          /* EMPTY */
          <div className="sales-history-empty">
            <div className="empty-sales-icon">₱</div>

            <h3>No sales yet</h3>

            <p>
              Completed sales will appear here.
            </p>
          </div>

        ) : (

          /* SALES LIST */
          <div className="sales-history-list">

            {sales.map((sale) => (
              <div
                className="sale-history-item"
                key={sale.id}
              >

                {/* SALE BASIC INFO */}
                <div className="sale-history-main">

                  <div className="sale-history-icon">
                    ₱
                  </div>

                  <div className="sale-history-info">

                    <strong>
                      Sale #{sale.saleId || sale.id}
                    </strong>

                    <p>
                      {formatDate(sale.createdAt)}
                    </p>

                  </div>
                </div>

                {/* SALE DETAILS */}
                <div className="sale-history-details">

                  {/* ITEMS */}
                  <div className="sale-history-detail">
                    <span>Items</span>

                    <strong>
                      {getItemCount(sale.items)}
                    </strong>
                  </div>

                  {/* COMPLETED BY */}
                  <div className="sale-history-detail">
                    <span>Completed By</span>

                    <strong>
                      {sale.email || "Unknown user"}
                    </strong>
                  </div>

                  {/* ROLE */}
                  <div className="sale-history-detail">
                    <span>Role</span>

                    <strong>
                      {sale.role || "Unknown"}
                    </strong>
                  </div>

                  {/* PAYMENT METHOD */}
                  <div className="sale-history-detail">
                    <span>Payment Method</span>

                    <strong>
                      {sale.paymentMethod || "Cash Only"}
                    </strong>
                  </div>

                  {/* GCASH */}
                  <div className="sale-history-detail">
                    <span>GCash Amount</span>

                    <strong>
                      {formatCurrency(sale.gcashAmount)}
                    </strong>
                  </div>

                  {/* TOTAL */}
                  <div className="sale-history-detail sale-history-total">
                    <span>Total</span>

                    <strong>
                      {formatCurrency(sale.total)}
                    </strong>
                  </div>

                  {/* PROFIT */}
<div className="sale-history-detail sale-history-profit">
  <span>Profit</span>

  <strong>
    {formatCurrency(sale.profit)}
  </strong>
</div>

                  {/* VIEW */}
                  <button
                    type="button"
                    className="view-sale-button"
                    onClick={() => handleViewSale(sale)}
                  >
                    View
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* =====================================
          SALE DETAILS MODAL
      ====================================== */}
      {selectedSale && (
        <div
          className="sale-modal-overlay"
          onClick={handleCloseSaleModal}
        >

          <div
            className="sale-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="sale-modal-header">

              <div>
                <h2>
                  Sale #
                  {selectedSale.saleId ||
                    selectedSale.id}
                </h2>

                <p>
                  Complete transaction information
                </p>
              </div>

              <button
                type="button"
                className="sale-modal-close"
                onClick={handleCloseSaleModal}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* =================================
                SALE INFORMATION
            ================================== */}
            <div className="sale-modal-info">

              <div className="sale-info-box">
                <span>Sale ID</span>

                <strong>
                  {selectedSale.saleId ||
                    selectedSale.id}
                </strong>
              </div>

              <div className="sale-info-box">
                <span>Date & Time</span>

                <strong>
                  {formatDate(
                    selectedSale.createdAt
                  )}
                </strong>
              </div>

              <div className="sale-info-box">
                <span>Completed By</span>

                <strong>
                  {selectedSale.email ||
                    "Unknown user"}
                </strong>
              </div>

              <div className="sale-info-box">
                <span>Role</span>

                <strong>
                  {selectedSale.role ||
                    "Unknown"}
                </strong>
              </div>

              <div className="sale-info-box">
                <span>Payment Method</span>

                <strong>
                  {selectedSale.paymentMethod ||
                    "Cash Only"}
                </strong>
              </div>

              <div className="sale-info-box">
                <span>GCash Amount</span>

                <strong>
                  {formatCurrency(
                    selectedSale.gcashAmount
                  )}
                </strong>
              </div>

            </div>

            {/* =================================
                PRODUCTS
            ================================== */}
            <div className="sale-products-section">

              <div className="sale-products-header">

                <div>
                  <h3>Products</h3>

                  <p>
                    Products included in this sale
                  </p>
                </div>

                <span>
                  {getItemCount(
                    selectedSale.items
                  )}{" "}
                  item
                  {getItemCount(
                    selectedSale.items
                  ) !== 1
                    ? "s"
                    : ""}
                </span>

              </div>

              {!Array.isArray(
                selectedSale.items
              ) ||
              selectedSale.items.length === 0 ? (

                <div className="no-sale-products">
                  No product information available.
                </div>

              ) : (

                <div className="sale-products-table-wrapper">

                  <table className="sale-products-table">

                    <thead>
                      <tr>
                        <tr>
  <th>Product ID</th>
  <th>Product Name</th>
  <th>Price</th>
  <th>Quantity</th>
  <th>Subtotal</th>
  <th>Profit</th>
</tr>
                      </tr>
                    </thead>

                    <tbody>

                      {selectedSale.items.map(
                        (item, index) => (
                          <tr key={index}>

                            <td>
                              {item.productId || "-"}
                            </td>

                            <td>
                              <strong>
                                {item.productName ||
                                  "Unknown product"}
                              </strong>
                            </td>

                            <td>
                              {formatCurrency(
                                item.sellingPrice
                              )}
                            </td>

                            <td>
                              {Number(
                                item.quantity
                              ) || 0}
                            </td>

                            <td className="product-subtotal">
                              {formatCurrency(
                                item.subtotal
                              )}
                            </td>

                            <td className="product-profit">
  {formatCurrency(item.profit)}
</td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* =================================
                PAYMENT INFORMATION
            ================================== */}
            <div className="sale-payment-summary">

              <div className="sale-payment-row">
                <span>Payment Method</span>

                <strong>
                  {selectedSale.paymentMethod ||
                    "Cash Only"}
                </strong>
              </div>

              <div className="sale-payment-row">
                <span>GCash Amount</span>

                <strong>
                  {formatCurrency(
                    selectedSale.gcashAmount
                  )}
                </strong>
              </div>

              {/* ONLY SHOW CASH FOR GCASH + CASH */}
              {selectedSale.paymentMethod ===
                "GCash + Cash" && (
                <div className="sale-payment-row">

                  <span>Cash Amount</span>

                  <strong>
                    {formatCurrency(
                      Number(
                        selectedSale.total || 0
                      ) -
                        Number(
                          selectedSale.gcashAmount || 0
                        )
                    )}
                  </strong>

                </div>
              )}

            </div>

            {/* =================================
                TOTAL
            ================================== */}
            {/* =================================
    SALE FINANCIAL SUMMARY
================================== */}

<div className="sale-modal-financial-summary">

  <div className="sale-modal-total">
    <span>Total Sale</span>

    <strong>
      {formatCurrency(selectedSale.total)}
    </strong>
  </div>

  <div className="sale-modal-cost">
    <span>Cost of Goods Sold</span>

    <strong>
      {formatCurrency(
        selectedSale.costOfGoodsSold
      )}
    </strong>
  </div>

  <div className="sale-modal-profit">
    <span>Total Profit</span>

    <strong>
      {formatCurrency(
        selectedSale.profit
      )}
    </strong>
  </div>

</div>

            {/* FOOTER */}
            <div className="sale-modal-footer">

              <button
                type="button"
                className="close-sale-button"
                onClick={handleCloseSaleModal}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default SalesHistory;