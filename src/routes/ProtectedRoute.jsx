import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";

function ProtectedRoute({
  children,
  allowedRoles
}) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        try {

          const userDoc = await getDoc(
            doc(db, "users", user.uid)
          );

          if (!userDoc.exists()) {
            setRole(null);
            setLoading(false);
            return;
          }

          const userRole = userDoc.data().role;

          setRole(userRole);

        } catch (error) {

          console.error(error);

          setRole(null);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!role) {
    return <Navigate to="/" replace />;
  }

  // Check page permission
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/inventory" replace />;
  }

  return children(role);
}

export default ProtectedRoute;