import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Library from "./Library"; 
import SignIn from "./SignIn"; 
import SignUp from "./SignUp";
import BookStorage from "./BookStorage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/AllBooks" element = {<BookStorage />} />
      </Routes>
    </Router>
  );
}

export default App;
