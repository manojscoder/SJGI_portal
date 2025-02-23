import React, { useState } from "react";
import axios from "../api/api";
import { Container, Form, Button, Card, InputGroup } from "react-bootstrap";
import { Eye, EyeSlash } from "react-bootstrap-icons"; 
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false
    });

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("New passwords do not match.");
            setMessageType("danger");
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:5000/change-password", {
                email,
                new_password: newPassword
            });

            setMessage(response.data.message);
            setMessageType("success");
            setEmail("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setMessage(error.response?.data?.error || "Something went wrong");
            setMessageType("danger");
        }
    };

    return (
        <Layout>
            <Button variant="secondary" className="w-40 py-2" onClick={() => navigate(-1)}>← Back</Button>
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <Card style={{ width: "100%", maxWidth: "450px" }} className="shadow p-4">
                    <Card.Body>
                        <h2 className="text-center mb-4">Change Password</h2>
                        <Form onSubmit={handleChangePassword}>

                            {/* Email Field */}
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            {/* New Password */}
                            <Form.Group className="mb-3">
                                <Form.Label>New Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword.new ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <InputGroup.Text onClick={() => togglePasswordVisibility("new")} style={{ cursor: "pointer" }}>
                                        {showPassword.new ? <EyeSlash /> : <Eye />}
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>

                            {/* Confirm New Password */}
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm New Password</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPassword.confirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <InputGroup.Text onClick={() => togglePasswordVisibility("confirm")} style={{ cursor: "pointer" }}>
                                        {showPassword.confirm ? <EyeSlash /> : <Eye />}
                                    </InputGroup.Text>
                                </InputGroup>
                            </Form.Group>

                            {/* Change Password Button */}
                            <Button type="submit" variant="primary" className="w-100">
                                Change Password
                            </Button>
                        </Form>

                        {/* Alert Message */}
                        {message && (
                            <div className={`alert alert-${messageType} mt-3 text-center`} role="alert">
                                {message}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </Layout>
    );
};

export default ChangePassword;
