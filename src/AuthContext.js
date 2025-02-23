import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [emp_id, setEmpId] = useState(localStorage.getItem("emp_id") || "");
  const [name, setName] = useState(localStorage.getItem("name") || "");

  useEffect(() => {
    if (emp_id) {
      localStorage.setItem("emp_id", emp_id);
      localStorage.setItem("email", email);
      localStorage.setItem("name", name);
    }
  }, [emp_id, email, name]);

  const logout = () => {
    setEmail("");
    setEmpId("");
    setName("");
    localStorage.removeItem("email");
    localStorage.removeItem("emp_id");
    localStorage.removeItem("name");
  };

  return (
    <AuthContext.Provider value={{ email, emp_id, name, setEmail, setEmpId, setName, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
