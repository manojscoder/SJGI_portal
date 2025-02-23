import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Table, Alert, Modal } from "react-bootstrap";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";

function RemoveUsers() {
    const navigate = useNavigate();
    const { email, emp_id } = useContext(AuthContext);
    
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const response = await fetch("http://localhost:5000/get_users");
            const result = await response.json();
            if (response.ok) {
                setFaculties(result.users || []);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Error fetching faculty data.");
        }
    };

    const handleRemove = async () => {
        try {
            const response = await fetch("http://localhost:5000/remove_user", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emp_id: selectedFaculty.emp_id }),
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(result.message);
                setFaculties(faculties.filter(faculty => faculty.emp_id !== selectedFaculty.emp_id));
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Error removing faculty.");
        }
        setShowRemoveModal(false);
    };

    return (
        <Layout>
            <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
            <Container className="mt-4">
                <h2>Manage Faculties</h2>
                {error && <Alert variant="danger"><FaTimesCircle /> {error}</Alert>}
                {message && <Alert variant="success"><FaCheckCircle /> {message}</Alert>}
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Emp ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faculties.map((faculty, index) => (
                            <tr key={index}>
                                <td>{faculty.emp_id}</td>
                                <td>{faculty.name}</td>
                                <td>{faculty.email}</td>
                                <td>{faculty.role}</td>
                                <td>
                                    <Button variant="danger" size="sm" onClick={() => { setSelectedFaculty(faculty); setShowRemoveModal(true); }}>
                                        <FaTrash /> Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            {/* Remove Confirmation Modal */}
            <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Removal</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to remove {selectedFaculty?.name}?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleRemove}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </Layout>
    );
}

export default RemoveUsers;