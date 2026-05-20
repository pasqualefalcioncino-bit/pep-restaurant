import { useState, useEffect } from "react";
import API from "./api";
import Menu from "./components/Menu";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  // ✅ AUTO LOGIN (quando la pagina parte)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // ✅ LOGIN
  const login = async () => {
    try {
      console.log("LOGIN CLICKED");

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      console.log("RESPONSE:", res.data);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);

      alert("Login OK");
    } catch (err) {
      console.log("ERROR:", err.response?.data);
      console.log(err);

      alert("Errore login");
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return (
    <div>
      <h1>🍝 Pep Restaurant</h1>

      {!token ? (
        <div>
          <input
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div>
          <Menu />
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;