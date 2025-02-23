import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const PrivateRoute = ({ children }) => {
  const { email } = useContext(AuthContext);

  if (!email) {
    // If not logged in, redirect to login page
    return <Navigate to="/" />;
  }

  return children; // Otherwise, allow access to the protected route
};

export default PrivateRoute;