import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import "../../styles/login.css";
import logo from "../../assets/images/logo.jpg";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Login using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Get user's role from Firestore
      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!userDoc.exists()) {
        setError("User account information was not found.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      // ADMIN
      if (role === "admin") {
        navigate("/dashboard");
        return;
      }

      // STAFF
      if (role === "staff") {
        navigate("/inventory");
        return;
      }

      // Invalid role
      setError("Invalid user role.");

    } catch (error) {
      console.error(error);

      setError("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div className="login-container">

      <div className="login-box">

      <img src={logo}></img>

        <h1>Login</h1>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;