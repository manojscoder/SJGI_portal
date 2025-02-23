import React, { useState, useContext, useEffect } from "react";
import axios from "../api/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { Container, Form, Button, Row, Col, Spinner, Alert, Modal } from "react-bootstrap";
import { FaCheckCircle } from "react-icons/fa";

function ExtraClass() {
    const navigate = useNavigate();
    const { emp_id, name } = useContext(AuthContext);

    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [todayDate, setTodayDate] = useState("");

    useEffect(() => {
        if (!emp_id) return;

        const fetchClassDetails = async () => {
            try {
                const response = await axios.get(`/extra_class_details?emp_id=${emp_id}`);
                const classData = response.data.classes || [];
                setTodayDate(response.data.date);
                const domainOptions = classData.map((cls) => ({ domain: cls.domain, domain_id: cls.domain_id }));
                setDomains(domainOptions);
            } catch (error) {
                setError("Failed to fetch class details");
            } finally {
                setLoading(false);
            }
        };

        fetchClassDetails();
    }, [emp_id]);

    const validateForm = () => {
        if (!startTime || !endTime || !selectedDomain) {
            alert("Please fill all fields");
            return false;
        }
        if (startTime >= endTime) {
            alert("End time should be later than start time");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        const extraClassData = {
            emp_id,
            name,
            date: todayDate,
            start_time: startTime,
            end_time: endTime,
            domain_id: selectedDomain.domain_id,
            domain: selectedDomain.domain
        };

        try {
            const response = await axios.post("/add_extra_class", extraClassData, {
                headers: { "Content-Type": "application/json" },
            });

            if (response.status === 200) {
                setShowConfirmModal(false);
                setShowSuccessModal(true);
            } else {
                alert("Error adding extra class");
            }
        } catch (error) {
            alert("Failed to connect to the server");
        }
    };

    return (
        <Layout>
            <Container className="mt-5">
                <Button variant="secondary" className="w-40 py-2" onClick={() => navigate(-1)}>← Back</Button>
                <h2 className="text-center mb-4">Schedule Extra Class</h2>

                {loading && <Spinner animation="border" className="d-block mx-auto" />}
                {error && <Alert variant="danger" className="text-center">{error}</Alert>}

                {!loading && !error && (
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (validateForm()) setShowConfirmModal(true);
                        }}
                        className="p-4 shadow rounded bg-light"
                    >
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control type="text" value={todayDate} readOnly />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Start Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>End Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Domain</Form.Label>
                                    <Form.Select
                                        value={selectedDomain?.domain || ""}
                                        onChange={(e) => {
                                            const domainObj = domains.find(d => d.domain === e.target.value);
                                            setSelectedDomain(domainObj);
                                        }}
                                        required
                                    >
                                        <option value="">Select a domain</option>
                                        {domains.map((d, index) => (
                                            <option key={index} value={d.domain}>
                                                {d.domain} (ID: {d.domain_id})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <center>
                            <Button variant="primary" className="w-50 py-2" type="submit">
                                Add Extra Class
                            </Button>
                        </center>
                    </Form>
                )}
            </Container>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Extra Class</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>Date:</strong> {todayDate}</p>
                    <p><strong>Time:</strong> {startTime} - {endTime}</p>
                    <p><strong>Domain:</strong> {selectedDomain?.domain} (ID: {selectedDomain?.domain_id})</p>
                    <p>Are you sure you want to schedule this extra class?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
                </Modal.Footer>
            </Modal>

            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={() => { setShowSuccessModal(false); navigate("/extra"); }}>
                <Modal.Body className="text-center">
                    <FaCheckCircle size={50} color="green" />
                    <h4 className="mt-3">Extra class added successfully!</h4>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => navigate("/fill")}>OK</Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}

export default ExtraClass;
