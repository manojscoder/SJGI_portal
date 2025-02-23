import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Table, Alert, Spinner } from "react-bootstrap";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function AddStudents() {
    const navigate = useNavigate();
    const { email, emp_id } = useContext(AuthContext);
    
    const [file, setFile] = useState(null);
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
            const response = await fetch("http://localhost:5000/upload_students", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(result.message);
                
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
                <h2>Add Students</h2>

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
                        <Form.Control type="file" accept=".xlsx, .xls" onChange={handleFileChange} required />
                        <br></br>
                        <Form.Text className="text-muted">
                            <strong>Note:</strong> The uploaded Excel file must include all mandatory columns: <br />
                            <b>REGISTER NUMBER, NAME OF THE STUDENT, NAME OF THE COLLEGE, DEPT, DOMAIN, CLASS DAYS(example: Monday, Tuesday), DOMAIN_ID, EMP_ID</b>

                        </Form.Text>
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : "Submit"}
                    </Button>
                </Form>
            </Container>
        </Layout>
    );
}

export default AddStudents;
