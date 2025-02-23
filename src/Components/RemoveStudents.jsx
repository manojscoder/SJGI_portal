import React, { useState, useEffect, useContext } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { Container, Form, Button, Row, Col, Spinner, Modal, Alert } from "react-bootstrap";
import { FaCheckCircle, FaTrashAlt } from "react-icons/fa";

const RemoveStudents = () => {
  const { emp_id, name } = useContext(AuthContext);
  const navigate = useNavigate();

  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/students_data");
      setDomains(response.data);
    } catch (error) {
      console.error("Error fetching domains:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSelect = async (domain) => {
    setSelectedDomain(domain);
    try {
      setLoading(true);
      const response = await axios.get(`/students_data/${domain.domain_id}`);
      setStudents(response.data.students);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = (student) => {
    setStudentToRemove(student);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove || !selectedDomain) return;

    try {
      await axios.delete(`/students_data/${selectedDomain.domain_id}/student/${studentToRemove["REGISTER NUMBER"]}`);
      setStudents(students.filter(s => s["REGISTER NUMBER"] !== studentToRemove["REGISTER NUMBER"]));
      setSuccessMessage(`Student ${studentToRemove["NAME OF THE STUDENT"]} removed successfully.`);
      setStudentToRemove(null);
    } catch (error) {
      console.error("Error removing student:", error);
    }
  };

  return (
    <Layout>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">
                  ← Back
                </Button>
      <Container className="mt-4">
        <h3 className="text-center">Student Management</h3>

        {loading && <Spinner animation="border" variant="primary" className="d-block mx-auto" />}

        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <Form.Group controlId="domainSelect">
          <Form.Label>Select Domain</Form.Label>
          <Form.Control as="select" onChange={(e) => handleDomainSelect(JSON.parse(e.target.value))}>
            <option value="">Select a domain</option>
            {domains.map((domain) => (
              <option key={domain.domain_id} value={JSON.stringify(domain)}>
                {domain.domain} - {domain.domain_id}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        {selectedDomain && (
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Students in {selectedDomain.domain}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {students.length > 0 ? (
                students.map((student) => (
                  <Row key={student["REGISTER NUMBER"]} className="border-bottom py-2 align-items-center">
                    <Col md={8}>
                      <strong>{student["NAME OF THE STUDENT"]}</strong> - {student["REGISTER NUMBER"]}
                    </Col>
                    <Col md={4} className="text-right">
                      <Button variant="danger" size="sm" onClick={() => handleRemoveStudent(student)}>
                        <FaTrashAlt /> Remove
                      </Button>
                    </Col>
                  </Row>
                ))
              ) : (
                <p className="text-center">No students found.</p>
              )}
            </Modal.Body>
          </Modal>
        )}

        {studentToRemove && (
          <Modal show={!!studentToRemove} onHide={() => setStudentToRemove(null)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Removal</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                Are you sure you want to remove <strong>{studentToRemove["NAME OF THE STUDENT"]}</strong> from{" "}
                <strong>{selectedDomain.domain}</strong>?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setStudentToRemove(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmRemoveStudent}>
                Remove
              </Button>
            </Modal.Footer>
          </Modal>
        )}

        {successMessage && (
          <div className="text-center mt-3">
            <FaCheckCircle color="green" size={30} />
          </div>
        )}
      </Container>
    </Layout>
  );
};

export default RemoveStudents;
