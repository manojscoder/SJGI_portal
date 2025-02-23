import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Table, Alert, Spinner } from "react-bootstrap";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function AddUsers() {
    const navigate = useNavigate();
    const { email, emp_id } = useContext(AuthContext);
    
    const [file, setFile] = useState(null);
    const [addedFaculties, setAddedFaculties] = useState([]); // Stores successfully added faculty data
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setError("Please select an Excel file to upload.");
            setMessage(null);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch("http://localhost:5000/upload_faculties", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(result.message);
                setAddedFaculties(result.added_users || []); // Store successfully added faculties
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("An error occurred while uploading the file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Button variant="secondary" className="w-40 py-2" onClick={() => navigate(-1)}>← Back</Button>

            <Container className="mt-4">
                <h2>Add users</h2>

                {error && (
                    <Alert variant="danger">
                        <FaTimesCircle className="me-2" /> {error}
                    </Alert>
                )}

                {message && (
                    <Alert variant="success">
                        <FaCheckCircle className="me-2 text-success" /> {message}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="fileUpload">
                        <Form.Label>Upload Excel File</Form.Label>
                        <Form.Control type="file" accept=".xlsx, .xls" onChange={handleFileChange} required /><br></br>
                        <Form.Text className="text-muted">
                            <strong>Note:</strong> The uploaded Excel file must include all mandatory columns: <br />
                                    <b>emp_id, email, name, password, role</b>
                        </Form.Text>
                        </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : "Submit"}
                    </Button>
                </Form>

                {/* Show added faculties in a table if any */}
                {addedFaculties.length > 0 && (
                    <div className="mt-4">
                        <h3>Added New Users</h3>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Emp ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {addedFaculties.map((faculty, index) => (
                                    <tr key={index}>
                                        <td>{faculty.emp_id}</td>
                                        <td>{faculty.name}</td>
                                        <td>{faculty.email}</td>
                                        <td>{faculty.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Container>
        </Layout>
    );
}

export default AddUsers;
