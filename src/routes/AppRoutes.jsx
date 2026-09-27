import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "../pages/auth/Login";

import Dashboard from "../pages/Dashboard/Dashboard";
import Inventory from "../pages/Inventory/Inventory";
import BarcodeScanner from "../pages/BarcodeScanner/BarcodeScanner";
import SalesHistory from "../pages/SalesHistory/SalesHistory";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

import ActivityLog from "../pages/ActivityLog/ActivityLog";
import Expenses from "../pages/Expenses/Expenses";

function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={<Login />}
        />


        {/* ================================= */}
        {/* ADMIN ONLY - DASHBOARD */}
        {/* ================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              {(role) => (
                <MainLayout role={role}>
                  <Dashboard />
                </MainLayout>
              )}
            </ProtectedRoute>
          }
        />


        {/* ================================= */}
        {/* ADMIN + STAFF - INVENTORY */}
        {/* ================================= */}

        <Route
          path="/inventory"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            >
              {(role) => (
                <MainLayout role={role}>
                  <Inventory />
                </MainLayout>
              )}
            </ProtectedRoute>
          }
        />


        {/* ================================= */}
        {/* ADMIN + STAFF - BARCODE SCANNER */}
        {/* ================================= */}

        <Route
          path="/barcode-scanner"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            >
              {(role) => (
                <MainLayout role={role}>
                  <BarcodeScanner />
                </MainLayout>
              )}
            </ProtectedRoute>
          }
        />


        {/* ================================= */}
        {/* ADMIN + STAFF - SALES HISTORY */}
        {/* ================================= */}

        <Route
          path="/sales-history"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "staff"]}
            >
              {(role) => (
                <MainLayout role={role}>
                  <SalesHistory />
                </MainLayout>
              )}
            </ProtectedRoute>
          }
        />

        {/* ADMIN and STAFF - ACTIVITY LOG */}
<Route
  path="/activity-log"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      {(role) => (
        <MainLayout role={role}>
          <ActivityLog />
        </MainLayout>
      )}
    </ProtectedRoute>
  }
/>

{/* STAFF adn ADMIN - EXPENSES */}
<Route
  path="/expenses"
  element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      {(role) => (
        <MainLayout role={role}>
          <Expenses />
        </MainLayout>
      )}
    </ProtectedRoute>
  }
/>


        {/* UNKNOWN PAGE */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes;