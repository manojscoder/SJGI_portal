import React, { useState, useEffect } from "react";
import axios from "../api/api";
import { Card, Button, Modal, Form, Container, Row, Col, Alert } from "react-bootstrap";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";

const ApproveRequest = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalTime, setApprovalTime] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get("/get_edit_requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleShowMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!approvalTime) {
      alert("Please enter a valid time until when attendance will be allowed.");
      return;
    }
    if (!selectedRequest) {
      alert("No request selected for approval.");
      return;
    }

    try {
      await axios.put("/approve_request", {
        emp_id: selectedRequest.emp_id,
        domain_id: selectedRequest.domain_id,
        allow_until: approvalTime,
      });

      // alert("Request Approved Successfully!");
      setShowApprovalModal(false);
      setApprovalTime("");
      fetchRequests(); // Refresh the list after approval
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  return (
    <Layout>
      <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
      <Container className="mt-4">
        {requests.length === 0 ? (
          <Alert variant="info" className="text-center">No requests to display</Alert>
        ) : (
          <Row className="g-4">
            {requests.map((req) => (
              <Col md={6} lg={4} key={req.id}>
                <Card className="shadow-sm p-3">
                  <Card.Body>
                    <Card.Title>{req.domain}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {req.emp_name} (ID: {req.emp_id})
                    </Card.Subtitle>
                    <Card.Text><strong>Domain ID:</strong> {req.domain_id}</Card.Text>
                    <div className="d-flex justify-content-between">
                      <Button variant="info" onClick={() => handleShowMessage(req.message)}>
                        See Message
                      </Button>
                      <Button variant="success" onClick={() => handleApprove(req)}>
                        Approve
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Message Modal */}
        <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Message</Modal.Title>
          </Modal.Header>
          <Modal.Body>{selectedMessage}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Approval Modal */}
        <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Approve Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Enter the time until when attendance modification is allowed:</p>
            <Form.Group>
              <Form.Control
                type="time"
                value={approvalTime}
                onChange={(e) => setApprovalTime(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={submitApproval}>
              Approve
            </Button>
            <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};

export default ApproveRequest;
