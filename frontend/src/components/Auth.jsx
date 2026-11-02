
import { useState } from "react";

const API_URL = "https://janawaaz-api-jlnx.onrender.com";

function Auth({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (!isLogin) {
        const response = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

       if (!response.ok) {
  throw new Error(
    typeof data.detail === "string"
      ? data.detail
      : JSON.stringify(data.detail || "Registration failed")
  );
}

        setMessage("Registration successful! Please log in.");
        setIsLogin(true);
        setPassword("");
      } else {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
       throw new Error(
       typeof data.detail === "string"
      ? data.detail
      : JSON.stringify(data.detail || "Login failed")
  );
}
        const token = data.access_token;

        // Check whether this account has admin access.
        const adminResponse = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const role = adminResponse.ok ? "admin" : "citizen";

        onAuthenticated({
          token,
          role,
          email,
        });
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
      <p>
        {isLogin
          ? "Log in to your JanAwaaz account"
          : "Register to report and track civic issues"}
      </p>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Register"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        {isLogin ? "Don't have an account?" : "Already registered?"}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
        >
          {isLogin ? " Register" : " Login"}
        </button>
      </p>
    </div>
  );
}

export default Auth;

