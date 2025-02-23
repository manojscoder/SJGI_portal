import React, { useContext } from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

function Layout({ children }) {
  const { email, emp_id, name, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <Navbar bg="secondary" expand="lg" className="sticky-top">
        <Container>
          <Navbar.Brand>
            <img 
              src="dash_logo.png" 
              alt="Logo" 
              className="img-fluid" 
              style={{ maxWidth: "60px", height: "auto" }} 
            />
          </Navbar.Brand>

          <Dropdown align="end">
            <Dropdown.Toggle variant="secondary" id="dropdown-basic" className="d-flex align-items-center">
              <span className="text-white">{name || "User"}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="custom-dropdown-menu" style={{ minWidth: "280px" }}>
              <div className="px-3 py-2">
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">{name || "User"}</h6>
                  </div>
                </div>
                <hr />
                <p className="mb-0">
                  <strong>Employee ID:</strong> {emp_id || "N/A"} <br />
                  <strong>Email ID:</strong> {email || "N/A"}
                </p>
              </div>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>Log Out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Container>
      </Navbar>

      <Container className="mt-4">{children}</Container>
    </>
  );
}

export default Layout;
