// SignIn.js
import "./SignIn.css";
import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [accounts] = useState<{ [username: string]: string }>(() => {
    const storedAccounts = localStorage.getItem("accounts");
    return storedAccounts ? JSON.parse(storedAccounts) : {};
  });
  const [signInMessage, setSignInMessage] = useState("");

  const signIn = async () => {
    try {
      if (signInUsername && signInPassword) {
        const response = await axios.post("http://localhost:8000/sign-in", {
          user: signInUsername,
          pass: signInPassword,
        });
        setSignInUsername("");
        setSignInPassword("");
        setSignInMessage("Sign-in successful");
        console.log("User signed in:", response.data);
        navigate("/library", { state: { loggedInAccount: signInUsername } });
      } else {
        setSignInMessage("Both Username and Password are required");
      }
    } catch (err) {
      setSignInMessage("Invalid Credentials");
      console.error("Error signing in:", err);
    }
    setTimeout(() => {
      setSignInMessage("");
    }, 2000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="Header-text">
          <h1>Library Management</h1>
        </div>
      </header>
      <div className="signin-container">
        <div className="signin-form">
          <h2>Sign In</h2>
          <input
            type="text"
            placeholder="Username"
            value={signInUsername}
            onChange={(e) => setSignInUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={signInPassword}
            onChange={(e) => setSignInPassword(e.target.value)}
          />
          <button onClick={signIn}>Sign In</button>
          {signInMessage && <div className="message">{signInMessage}</div>}
          <p>
            Don't have an account? <Link to="/signup">Sign-Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
