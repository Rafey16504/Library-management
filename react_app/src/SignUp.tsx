// SignUp.js
import "./SignUp.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AnyARecord } from "dns";

function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const location = useLocation();
  const { loggedInAccount } = location.state || {};
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [accounts, setAccounts] = useState<{ [username: string]: string }>(
    () => {
      const storedAccounts = localStorage.getItem("accounts");
      return storedAccounts ? JSON.parse(storedAccounts) : {};
    }
  );
  const [signUpMessage, setSignUpMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);

  const signUp = async () => {
    if (username && password && email) {
      try {
        const response = await axios.post("http://localhost:8000/sign-up", {
          user: username,
          pass: password,
          email: email,
        });
        setSignUpMessage("Please wait for Verification");
        const { data } = await axios.post(
          `http://localhost:8000/send-email/${loggedInAccount}`,
          {
            email: email,
          }
        );

        setIsVerificationVisible(true);
        console.log("Email sent successfully!");
        setSignUpMessage("Please check your email for the verification code!");

        if (data.message) {
          setVerificationCode(data.message);
        }
      } catch (error: any) {
        if (error.response.status === 409) {
          setSignUpMessage("Username already exists");
        } else {
          setSignUpMessage("Error signing up: " + error.message);
        }
        console.error("Error signing up:", error, accounts);
      }
    } else {
      setSignUpMessage("Please fill all credentials!");
    }

    setTimeout(() => {
      setSignUpMessage("");
    }, 2000);
  };

  const add_account = (username: any, password: any) => {
    try {
      if (inputCode === verificationCode) {
        setAccounts((prevUsers) => ({
          ...prevUsers,
          [username]: password,
        }));
        setUsername("");
        setPassword("");
        setSignUpMessage("Your Account has been verified.");
        setIsVerificationVisible(false);
      } else {
        setSignUpMessage("Wrong Verification Code!");
      }
      setTimeout(() => {
        setSignUpMessage("");
      }, 2000);
    } catch (error) {
      console.log("Account does not exist!", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="Header-text">
          <h1>Library Management</h1>
        </div>
      </header>
      <div className="signup-container">
        <div className="signup-form">
          <h2>Sign Up</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div>
            <label htmlFor="email" className="username@example.com"></label>
            <input
              type="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@example.com"
              required
            />
          </div>

          <button
            onClick={async () => {
              await signUp();
            }}
          >
            Sign Up
          </button>

          {isVerificationVisible && (
            <div>
              <input
                type="text"
                placeholder="Verification Code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button
                onClick={() => {
                  add_account(username, password);
                }}
              >
                Verify
              </button>
            </div>
          )}
          {signUpMessage && <div className="message">{signUpMessage}</div>}
          <p>
            Already have an account? <Link to="/">Sign-In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
