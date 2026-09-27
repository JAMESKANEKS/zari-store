import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import logo from "../../assets/images/logo.jpg"

function Sidebar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img className="img-sidebar" src={logo}></img>
      </div>

      <nav className="sidebar-nav">

        {/* ADMIN ONLY */}
        {role === "admin" && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/activity-log"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Activity Log
            </NavLink>
          </>
        )}

        {/* ADMIN + STAFF */}
        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Inventory
        </NavLink>

        <NavLink
          to="/barcode-scanner"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Barcode Scanner
        </NavLink>

        <NavLink
          to="/sales-history"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Sales History
        </NavLink>

        {/* STAFF and Admin */}
          <NavLink
            to="/expenses"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Expenses
          </NavLink>

      </nav>

      <div className="sidebar-bottom">
        <div className="user-role">
          <span>Role</span>
          <strong>{role}</strong>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;