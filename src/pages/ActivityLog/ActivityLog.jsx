import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebase/config";
import "./activityLog.css";

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");



  const loadActivities = async () => {
    try {
      setLoading(true);

      const expenseActivitySnapshot = await getDocs(
  collection(db, "expenseActivity")
);

      // Get activity collections
      const [
        productActivitySnapshot,
        stockMovementsSnapshot,
        productsSnapshot,
        usersSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "productActivity")),
        getDocs(collection(db, "stockMovements")),
        getDocs(collection(db, "products")),
        getDocs(collection(db, "users")),
      ]);

      // Users
      const users = {};

      usersSnapshot.forEach((doc) => {
        users[doc.id] = {
          id: doc.id,
          ...doc.data(),
        };
      });

      // Products
      const products = {};

      productsSnapshot.forEach((doc) => {
        const data = doc.data();

        products[doc.id] = {
          id: doc.id,
          ...data,
        };
      });

      // Expense Activities
const expenseActivities = [];

expenseActivitySnapshot.forEach((doc) => {
  const data = doc.data();

  expenseActivities.push({
    id: doc.id,
    type: "expense",
    action: data.action,
    expenseId: data.expenseId,
    expenseName: data.expenseName,
    description: data.description || "",
    amount: Number(data.amount) || 0,
    userId: data.userId || null,
    email: data.email || "Unknown user",
    role: data.role || "Unknown",
    createdAt: data.createdAt,
  });
});

      const activityList = [];

      // Product activity
      productActivitySnapshot.forEach((doc) => {
        const data = doc.data();

        const user = data.userId
          ? users[data.userId]
          : null;

        activityList.push({
          id: `product-${doc.id}`,
          type: "product",
          action: data.action || "unknown",

          productId: data.productId || "",
          productName: data.productName || "",

          reason: data.reason || "",

          userId: data.userId || "",
          email:
            data.email ||
            user?.email ||
            "Unknown user",

          role:
            data.role ||
            user?.role ||
            "Unknown",

          createdAt: data.createdAt || null,
        });
      });

      // Stock movements
      stockMovementsSnapshot.forEach((doc) => {
        const data = doc.data();

        const user = data.userId
          ? users[data.userId]
          : null;

        activityList.push({
          id: `stock-${doc.id}`,
          type: "stock",
          action: data.action || "unknown",

          productId: data.productId || "",
          productName: data.productName || "",

          quantity: Number(data.quantity) || 0,

          previousStock:
            Number(data.previousStock) || 0,

          newStock:
            Number(data.newStock) || 0,

          previousCost:
            Number(data.previousCost) || 0,

          costAmount:
            Number(data.costAmount) || 0,

          newCost:
            Number(data.newCost) || 0,

          reason: data.reason || "",

          userId: data.userId || "",
          email:
            data.email ||
            user?.email ||
            "Unknown user",

          role:
            data.role ||
            user?.role ||
            "Unknown",

          createdAt: data.createdAt || null,
        });
      });

      // Expense activity
expenseActivities.forEach((expense) => {
  activityList.push({
    id: `expense-${expense.id}`,
    type: "expense",
    action: expense.action || "unknown",

    expenseId: expense.expenseId || "",
    expenseName: expense.expenseName || "",
    description: expense.description || "",
    amount: Number(expense.amount) || 0,

    userId: expense.userId || "",
    email: expense.email || "Unknown user",
    role: expense.role || "Unknown",

    createdAt: expense.createdAt || null,
  });
});

      // Sort newest first
      activityList.sort((a, b) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(0);

        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(0);

        return dateB - dateA;
      });

      setActivities(activityList);

    } catch (error) {
      console.error(
        "Error loading activity log:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  loadActivities();
}, []);

// =========================
// FILTER ACTIVITIES
// =========================
const getFilteredActivities = () => {
  return activities.filter((activity) => {
    // =========================
    // ACTIVITY FILTER
    // =========================
    if (actionFilter !== "all") {
      if (actionFilter === "product_added") {
        if (
          activity.type !== "product" ||
          activity.action !== "add"
        ) {
          return false;
        }
      }

      if (actionFilter === "product_edited") {
        if (
          activity.type !== "product" ||
          activity.action !== "edit"
        ) {
          return false;
        }
      }

      if (actionFilter === "product_deleted") {
        if (
          activity.type !== "product" ||
          activity.action !== "delete"
        ) {
          return false;
        }
      }

      if (actionFilter === "expense_deleted") {
  if (
    activity.type !== "expense" ||
    activity.action !== "delete"
  ) {
    return false;
  }
}

      if (actionFilter === "stock_added") {
        if (
          activity.type !== "stock" ||
          activity.action !== "add"
        ) {
          return false;
        }
      }

      if (actionFilter === "stock_removed") {
        if (
          activity.type !== "stock" ||
          activity.action !== "remove"
        ) {
          return false;
        }
      }
    }

    // =========================
    // DATE FROM
    // =========================
    if (dateFrom && activity.createdAt?.toDate) {
      const activityDate = activity.createdAt.toDate();
      const fromDate = new Date(`${dateFrom}T00:00:00`);

      if (activityDate < fromDate) {
        return false;
      }
    }

    // =========================
    // DATE TO
    // =========================
    if (dateTo && activity.createdAt?.toDate) {
      const activityDate = activity.createdAt.toDate();
      const toDate = new Date(`${dateTo}T23:59:59`);

      if (activityDate > toDate) {
        return false;
      }
    }

    return true;
  });
};

const filteredActivities = getFilteredActivities();

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "No date";
    }

    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getActionTitle = (activity) => {
    if (activity.type === "stock") {
      if (activity.action === "add") {
        return "Stock Added";
      }

      if (activity.action === "remove") {
        return "Stock Removed";
      }
    }

    if (activity.type === "product") {
      if (activity.action === "edit") {
        return "Product Edited";
      }

      if (activity.action === "delete") {
        return "Product Deleted";
      }

      if (activity.action === "add") {
        return "Product Added";
      }
    }
    if (activity.type === "expense") {
  if (activity.action === "delete") {
    return "Expense Deleted";
  }
}

    return "Activity";
  };

  const getActionClass = (activity) => {
    if (
      activity.action === "add"
    ) {
      return "activity-add";
    }

    if (
      activity.action === "remove"
    ) {
      return "activity-remove";
    }

    if (
      activity.action === "delete"
    ) {
      return "activity-delete";
    }

    if (
      activity.action === "edit"
    ) {
      return "activity-edit";
    }

    return "";
  };

  return (
    <div className="activity-log-page">

      <div className="activity-log-header">
        <div>
          <h1>Activity Log</h1>

          <p>
            View the history of changes made
            to the inventory system.
          </p>
        </div>

        <button
          className="refresh-activity-button"
          onClick={loadActivities}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="activity-filters">

  {/* Activity Filter */}
  <select
    value={actionFilter}
    onChange={(e) => setActionFilter(e.target.value)}
  >
    <option value="all">All Activities</option>
    <option value="product_added">Product Added</option>
    <option value="product_edited">Product Edited</option>
    <option value="stock_added">Add Stock</option>
    <option value="stock_removed">Stock Remove</option>
    <option value="product_deleted">Product Deleted</option>
    <option value="expense_deleted">
  Expense Deleted
</option>
  </select>

  {/* Date From */}
  <input
    type="date"
    value={dateFrom}
    onChange={(e) => setDateFrom(e.target.value)}
  />

  {/* Date To */}
  <input
    type="date"
    value={dateTo}
    onChange={(e) => setDateTo(e.target.value)}
  />

  {/* Clear */}
  <button
    type="button"
    onClick={() => {
      setActionFilter("all");
      setDateFrom("");
      setDateTo("");
    }}
  >
    Clear Filters
  </button>

</div>

      {loading ? (
        <div className="activity-empty">
          Loading activity history...
        </div>
      ) : activities.length === 0 ? (
        <div className="activity-empty">
          <h3>No activity yet</h3>

          <p>
            Product and stock activity will
            appear here.
          </p>
        </div>
      ) : (
        <div className="activity-list">

          {filteredActivities.map((activity) => (
            <div
              className="activity-item"
              key={activity.id}
            >

              <div
                className={`activity-icon ${getActionClass(
                  activity
                )}`}
              >
                {activity.action === "add" && "＋"}

                {activity.action === "remove" && "−"}

                {activity.action === "edit" && "✎"}

                {activity.action === "delete" && "×"}
              </div>

              <div className="activity-content">

                <div className="activity-top">

                  <div>
                    <h3>
                      {getActionTitle(activity)}
                    </h3>

                    <p className="activity-product">
                      {activity.productName ||
                        "Unknown product"}
                    </p>
                  </div>

                  <span className="activity-date">
                    {formatDate(
                      activity.createdAt
                    )}
                  </span>

                </div>

                {/* STOCK INFORMATION */}
                {activity.type === "stock" && (
                  <div className="activity-details">

                    <div>
                      <span>Quantity</span>

                      <strong>
                        {activity.quantity}
                      </strong>
                    </div>

                    <div>
                      <span>Stock</span>

                      <strong>
                        {activity.previousStock}
                        {" → "}
                        {activity.newStock}
                      </strong>
                    </div>

                    <div>
                      <span>Cost</span>

                      <strong>
                        ₱
                        {activity.previousCost.toFixed(
                          2
                        )}
                        {" → "}
                        ₱
                        {activity.newCost.toFixed(
                          2
                        )}
                      </strong>
                    </div>

                  </div>
                )}

                {/* PRODUCT INFORMATION */}
                {activity.type === "product" && (
                  <div className="activity-product-info">

                    <span>
                      Product ID / Barcode:
                    </span>

                    <strong>
                      {activity.productId ||
                        "N/A"}
                    </strong>

                  </div>
                )}

                {/* EXPENSE INFORMATION */}
{activity.type === "expense" && (
  <div className="activity-product-info">
    <span>Expense:</span>

    <strong>
      {activity.expenseName || "Unknown expense"}
    </strong>

    <span>Amount:</span>

    <strong>
      ₱
      {activity.amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </strong>
  </div>
)}

                {/* REASON */}
                {activity.reason && (
                  <div className="activity-reason">
                    <span>Reason:</span>

                    <p>
                      {activity.reason}
                    </p>
                  </div>
                )}

                {/* USER */}
                <div className="activity-user">

                  <div>
                    <span>Performed by</span>

                    <strong>
                      {activity.email}
                    </strong>
                  </div>

                  <span
                    className={`role-badge ${
                      activity.role === "admin"
                        ? "role-admin"
                        : "role-staff"
                    }`}
                  >
                    {activity.role}
                  </span>

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default ActivityLog;