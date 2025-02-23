import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Container } from "react-bootstrap";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";

function MainAdmin() {
    const navigate = useNavigate();
      const { email, emp_id } = useContext(AuthContext);
    
      const handleClick = (path) => {
        navigate(path);
      };

      return (
        <Layout>
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
                            onClick={() => handleClick("/approve_edit_request")}
                          >
                            <b>Approve Edit Request</b>
                          </Button>

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/download_att")}
                          >
                            <b>Download Attendance</b>
                          </Button>

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/manage_students")}
                          >
                            <b>Manage Students Data</b>
                          </Button>

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/manage_users")}
                          >
                            <b>Manage Users Data</b>
                          </Button>

                          <Button
                            variant="primary"
                            className="w-100 py-3"
                            onClick={() => handleClick("/change_password")}
                          >
                            <b>Change Password</b>
                          </Button>
    
                        </Col>        
                      </Row>
                    </Container>
                  </section>
        </Layout>
      );
};

export default MainAdmin;