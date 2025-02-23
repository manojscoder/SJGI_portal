import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Container } from "react-bootstrap";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";

function ManageUsers() {
    const navigate = useNavigate();
      const { email, emp_id } = useContext(AuthContext);
    
      const handleClick = (path) => {
        navigate(path);
      };

      return (
        <Layout>
             <Button variant="secondary" className="w-40 py-2" onClick={() => navigate(-1)}>← Back</Button>
            <section className="vh-100 d-flex align-items-center">
                    <Container>
                      <Row className="justify-content-center align-items-center">
                        {/* Image Section */}
                        <Col xs={12} md={6} className="text-center mb-4">
                          <img
                            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
                            className="img-fluid"
                            alt="Sample illustration"
                            style={{ maxWidth: "100%", height: "auto" }}
                          />
                        </Col>
            
                        {/* Buttons Section */}
                        <Col xs={12} md={5} className="text-center d-flex flex-column gap-3">

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/add_users")}
                          >
                            <b>Add Users Data</b>
                          </Button>

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/remove_users")}
                          >
                            <b>Remove Users Data</b>
                          </Button>
    
                        </Col>        
                      </Row>
                    </Container>
                  </section>
        </Layout>
      );
};

export default ManageUsers;