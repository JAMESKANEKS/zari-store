import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { db } from "../../firebase/config";
import "./dashboard.css";

function Dashboard() {
  // =========================================
  // DASHBOARD TOTALS
  // =========================================

  const [totalInventoryCost, setTotalInventoryCost] =
    useState(0);

  const [totalExpenses, setTotalExpenses] =
    useState(0);

  const [totalSales, setTotalSales] =
    useState(0);

  const [totalProfit, setTotalProfit] =
    useState(0);

  const [totalGcash, setTotalGcash] =
    useState(0);

  // =========================================
  // STOCK ALERTS
  // =========================================

  const [lowStockProducts, setLowStockProducts] =
    useState([]);

  const [outOfStockProducts, setOutOfStockProducts] =
    useState([]);

  const [overStockProducts, setOverStockProducts] =
    useState([]);

  // =========================================
  // SALES DATA
  // =========================================

  const [salesData, setSalesData] =
    useState([]);

  const [salesFilter, setSalesFilter] =
    useState("7days");

  const [loading, setLoading] =
    useState(true);

  // =========================================
  // LOAD DASHBOARD DATA
  // =========================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // =========================================
      // LOAD PRODUCTS
      // =========================================

      const productsSnapshot = await getDocs(
        collection(db, "products")
      );

      let inventoryCost = 0;

      const lowStock = [];
      const outOfStock = [];
      const overStock = [];

      productsSnapshot.forEach((productDoc) => {
        const product = productDoc.data();

        // -----------------------------------------
        // TOTAL INVENTORY COST
        // -----------------------------------------

        inventoryCost +=
          Number(product.productCost) || 0;

        // -----------------------------------------
        // STOCK INFORMATION
        // -----------------------------------------

        const stock =
          Number(product.stock) || 0;

        const minimumStock =
          Number(product.minimumStock) || 0;

        const maximumStock =
          Number(product.maximumStock) || 0;

        const productInfo = {
          id: productDoc.id,

          productId:
            product.productId || "N/A",

          productName:
            product.productName ||
            "Unnamed Product",

          stock,

          minimumStock,

          maximumStock,
        };

        // -----------------------------------------
        // OUT OF STOCK
        // -----------------------------------------

        if (stock === 0) {
          outOfStock.push(productInfo);
        }

        // -----------------------------------------
        // LOW STOCK
        // -----------------------------------------

        else if (
          stock <= minimumStock
        ) {
          lowStock.push(productInfo);
        }

        // -----------------------------------------
        // OVER STOCK
        // -----------------------------------------

        else if (
          maximumStock > 0 &&
          stock >= maximumStock
        ) {
          overStock.push(productInfo);
        }
      });

      setTotalInventoryCost(
        inventoryCost
      );

      setLowStockProducts(
        lowStock
      );

      setOutOfStockProducts(
        outOfStock
      );

      setOverStockProducts(
        overStock
      );

      // =========================================
      // LOAD EXPENSES
      // =========================================

      const expensesSnapshot = await getDocs(
        collection(db, "expenses")
      );

      let expenseAmount = 0;

      expensesSnapshot.forEach((expenseDoc) => {
        const expense =
          expenseDoc.data();

        expenseAmount +=
          Number(expense.amount) || 0;
      });

      setTotalExpenses(
        expenseAmount
      );

      // =========================================
      // LOAD SALES
      // =========================================

      const salesSnapshot = await getDocs(
        collection(db, "saleActivity")
      );

      let salesAmount = 0;
      let profitAmount = 0;
      let gcashAmount = 0;

      const loadedSales = [];

      salesSnapshot.forEach((saleDoc) => {
        const sale =
          saleDoc.data();

        // -----------------------------------------
        // TOTAL SALES
        // -----------------------------------------

        salesAmount +=
          Number(sale.total) || 0;

        // -----------------------------------------
        // TOTAL PROFIT
        // -----------------------------------------

        profitAmount +=
          Number(sale.profit) || 0;

        // -----------------------------------------
        // TOTAL GCASH
        // -----------------------------------------

        gcashAmount +=
          Number(sale.gcashAmount) || 0;

        // -----------------------------------------
        // SAVE SALE FOR GRAPH
        // -----------------------------------------

        let saleDate = null;

        if (sale.createdAt) {
          if (
            typeof sale.createdAt.toDate ===
            "function"
          ) {
            saleDate =
              sale.createdAt.toDate();
          } else {
            saleDate =
              new Date(
                sale.createdAt
              );
          }
        }

        if (
          saleDate &&
          !isNaN(
            saleDate.getTime()
          )
        ) {
          loadedSales.push({
            id: saleDoc.id,

            date: saleDate,

            total:
              Number(sale.total) || 0,
          });
        }
      });

      setTotalSales(
        salesAmount
      );

      setTotalProfit(
        profitAmount
      );

      setTotalGcash(
        gcashAmount
      );

      setSalesData(
        loadedSales
      );
    } catch (error) {
      console.error(
        "Error loading dashboard data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD DASHBOARD DATA
  // =========================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  // =========================================
  // GET FILTERED SALES
  // =========================================

  const getFilteredSales = () => {
    const now = new Date();

    // =========================================
    // LAST 7 DAYS
    // =========================================

    if (salesFilter === "7days") {
      const days = [];

      for (
        let i = 6;
        i >= 0;
        i--
      ) {
        const date =
          new Date(now);

        date.setHours(
          0,
          0,
          0,
          0
        );

        date.setDate(
          date.getDate() - i
        );

        days.push(date);
      }

      return days.map((date) => {
        const nextDate =
          new Date(date);

        nextDate.setDate(
          nextDate.getDate() + 1
        );

        const dailySales =
          salesData
            .filter((sale) => {
              return (
                sale.date >= date &&
                sale.date < nextDate
              );
            })
            .reduce(
              (total, sale) =>
                total + sale.total,
              0
            );

        return {
          label:
            date.toLocaleDateString(
              "en-PH",
              {
                month: "short",
                day: "numeric",
              }
            ),

          sales: Number(
            dailySales.toFixed(2)
          ),
        };
      });
    }

    // =========================================
    // LAST 30 DAYS
    // =========================================

    if (salesFilter === "30days") {
      const days = [];

      for (
        let i = 29;
        i >= 0;
        i--
      ) {
        const date =
          new Date(now);

        date.setHours(
          0,
          0,
          0,
          0
        );

        date.setDate(
          date.getDate() - i
        );

        days.push(date);
      }

      return days.map((date) => {
        const nextDate =
          new Date(date);

        nextDate.setDate(
          nextDate.getDate() + 1
        );

        const dailySales =
          salesData
            .filter((sale) => {
              return (
                sale.date >= date &&
                sale.date < nextDate
              );
            })
            .reduce(
              (total, sale) =>
                total + sale.total,
              0
            );

        return {
          label:
            date.toLocaleDateString(
              "en-PH",
              {
                month: "short",
                day: "numeric",
              }
            ),

          sales: Number(
            dailySales.toFixed(2)
          ),
        };
      });
    }

    // =========================================
    // THIS YEAR
    // =========================================

    if (salesFilter === "year") {
      const currentYear =
        now.getFullYear();

      const months = [];

      for (
        let month = 0;
        month < 12;
        month++
      ) {
        const startDate =
          new Date(
            currentYear,
            month,
            1
          );

        const endDate =
          new Date(
            currentYear,
            month + 1,
            1
          );

        const monthlySales =
          salesData
            .filter((sale) => {
              return (
                sale.date >=
                  startDate &&
                sale.date <
                  endDate
              );
            })
            .reduce(
              (total, sale) =>
                total + sale.total,
              0
            );

        months.push({
          label:
            startDate.toLocaleDateString(
              "en-PH",
              {
                month: "short",
              }
            ),

          sales: Number(
            monthlySales.toFixed(2)
          ),
        });
      }

      return months;
    }

    return [];
  };

  const filteredSales =
    getFilteredSales();

  // =========================================
  // FORMAT CURRENCY
  // =========================================

  const formatCurrency = (amount) => {
    return `₱${Number(
      amount || 0
    ).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================
  // CUSTOM TOOLTIP
  // =========================================

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="sales-chart-tooltip">

        <p className="sales-chart-tooltip-date">
          {label}
        </p>

        <p className="sales-chart-tooltip-value">
          Sales:{" "}

          <strong>
            {formatCurrency(
              payload[0].value
            )}
          </strong>
        </p>

      </div>
    );
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="dashboard-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="dashboard-header">

        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            Overview of your inventory system.
          </p>
        </div>

      </div>

      {/* =====================================
          DASHBOARD CARDS
      ====================================== */}

      <div className="dashboard-cards">

        {/* =====================================
            TOTAL INVENTORY COST
        ====================================== */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            ₱
          </div>

          <div className="dashboard-card-content">

            <span>
              Total Inventory Cost
            </span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(
                    totalInventoryCost
                  )}
            </strong>

          </div>

        </div>

        {/* =====================================
            TOTAL SALES
        ====================================== */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            ₱
          </div>

          <div className="dashboard-card-content">

            <span>
              Total Sales
            </span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(
                    totalSales
                  )}
            </strong>

          </div>

        </div>

        {/* =====================================
            TOTAL GCASH
        ====================================== */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            G
          </div>

          <div className="dashboard-card-content">

            <span>
              Total GCash
            </span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(
                    totalGcash
                  )}
            </strong>

          </div>

        </div>

        {/* =====================================
            TOTAL PROFIT
        ====================================== */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            ₱
          </div>

          <div className="dashboard-card-content">

            <span>
              Total Profit
            </span>

            <strong className="dashboard-profit">
              {loading
                ? "Loading..."
                : formatCurrency(
                    totalProfit
                  )}
            </strong>

          </div>

        </div>

        {/* =====================================
            TOTAL EXPENSES
        ====================================== */}

        <div className="dashboard-card">

          <div className="dashboard-card-icon">
            ₱
          </div>

          <div className="dashboard-card-content">

            <span>
              Total Expenses
            </span>

            <strong>
              {loading
                ? "Loading..."
                : formatCurrency(
                    totalExpenses
                  )}
            </strong>

          </div>

        </div>

      </div>

      {/* =====================================
          SALES GRAPH
      ====================================== */}

      <div className="dashboard-chart-card">

        {/* CHART HEADER */}

        <div className="dashboard-chart-header">

          <div>

            <h2>
              Sales Overview
            </h2>

            <p>
              Track your sales performance
              over time.
            </p>

          </div>

          {/* FILTER BUTTONS */}

          <div className="sales-chart-filters">

            <button
              type="button"
              className={
                salesFilter === "7days"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSalesFilter(
                  "7days"
                )
              }
            >
              7 Days
            </button>

            <button
              type="button"
              className={
                salesFilter === "30days"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSalesFilter(
                  "30days"
                )
              }
            >
              30 Days
            </button>

            <button
              type="button"
              className={
                salesFilter === "year"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSalesFilter(
                  "year"
                )
              }
            >
              This Year
            </button>

          </div>

        </div>

        {/* CHART */}

        <div className="sales-chart-container">

          {loading ? (

            <div className="sales-chart-loading">

              <div className="loading-spinner">
              </div>

              <p>
                Loading sales data...
              </p>

            </div>

          ) : (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={filteredSales}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                  axisLine={{
                    stroke: "#e5e7eb",
                  }}
                  tickLine={false}
                  interval={
                    salesFilter ===
                    "30days"
                      ? 4
                      : 0
                  }
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `₱${Number(
                      value
                    ).toLocaleString(
                      "en-PH"
                    )}`
                  }
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#2563eb",
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          )}

        </div>

      </div>

      {/* =====================================
          STOCK ALERTS
      ====================================== */}

      <div className="dashboard-stock-alerts">

        <div className="dashboard-stock-alerts-header">

          <div>
            <h2>
              Stock Alerts
            </h2>

            <p>
              Monitor products that need
              inventory attention.
            </p>
          </div>

        </div>

        <div className="dashboard-stock-alerts-grid">

          {/* =================================
              OUT OF STOCK
          ================================== */}

          <div className="dashboard-stock-alert-card dashboard-out-stock">

            <div className="dashboard-stock-alert-card-header">

              <div>
                <h3>
                  Out of Stock
                </h3>

                <span>
                  Products with no available stock
                </span>
              </div>

              <strong>
                {outOfStockProducts.length}
              </strong>

            </div>

            <div className="dashboard-stock-product-list">

              {outOfStockProducts.length ===
              0 ? (

                <div className="dashboard-no-stock">
                  No products are out of stock.
                </div>

              ) : (

                outOfStockProducts
                  .slice(0, 5)
                  .map((product) => (

                    <div
                      className="dashboard-stock-product"
                      key={product.id}
                    >

                      <div>
                        <strong>
                          {product.productName}
                        </strong>

                        <small>
                          ID:{" "}
                          {product.productId}
                        </small>
                      </div>

                      <span className="dashboard-stock-number out">
                        {product.stock}
                      </span>

                    </div>

                  ))

              )}

              {outOfStockProducts.length >
                5 && (

                <div className="dashboard-more-stock">
                  +
                  {outOfStockProducts.length -
                    5}{" "}
                  more products
                </div>

              )}

            </div>

          </div>

          {/* =================================
              LOW STOCK
          ================================== */}

          <div className="dashboard-stock-alert-card dashboard-low-stock">

            <div className="dashboard-stock-alert-card-header">

              <div>
                <h3>
                  Low Stock
                </h3>

                <span>
                  Products at or below minimum
                </span>
              </div>

              <strong>
                {lowStockProducts.length}
              </strong>

            </div>

            <div className="dashboard-stock-product-list">

              {lowStockProducts.length ===
              0 ? (

                <div className="dashboard-no-stock">
                  No products are low in stock.
                </div>

              ) : (

                lowStockProducts
                  .slice(0, 5)
                  .map((product) => (

                    <div
                      className="dashboard-stock-product"
                      key={product.id}
                    >

                      <div>
                        <strong>
                          {product.productName}
                        </strong>

                        <small>
                          Minimum:{" "}
                          {product.minimumStock}
                        </small>
                      </div>

                      <span className="dashboard-stock-number low">
                        {product.stock}
                      </span>

                    </div>

                  ))

              )}

              {lowStockProducts.length >
                5 && (

                <div className="dashboard-more-stock">
                  +
                  {lowStockProducts.length -
                    5}{" "}
                  more products
                </div>

              )}

            </div>

          </div>

          {/* =================================
              OVER STOCK
          ================================== */}

          <div className="dashboard-stock-alert-card dashboard-over-stock">

            <div className="dashboard-stock-alert-card-header">

              <div>
                <h3>
                  Over Stock
                </h3>

                <span>
                  Products at or above maximum
                </span>
              </div>

              <strong>
                {overStockProducts.length}
              </strong>

            </div>

            <div className="dashboard-stock-product-list">

              {overStockProducts.length ===
              0 ? (

                <div className="dashboard-no-stock">
                  No products are over stock.
                </div>

              ) : (

                overStockProducts
                  .slice(0, 5)
                  .map((product) => (

                    <div
                      className="dashboard-stock-product"
                      key={product.id}
                    >

                      <div>
                        <strong>
                          {product.productName}
                        </strong>

                        <small>
                          Maximum:{" "}
                          {product.maximumStock}
                        </small>
                      </div>

                      <span className="dashboard-stock-number over">
                        {product.stock}
                      </span>

                    </div>

                  ))

              )}

              {overStockProducts.length >
                5 && (

                <div className="dashboard-more-stock">
                  +
                  {overStockProducts.length -
                    5}{" "}
                  more products
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;