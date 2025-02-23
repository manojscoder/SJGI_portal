import React, { useState, useEffect, useContext } from "react";
import axios from "../api/api";
import { AuthContext } from "../AuthContext";
import Layout from "./Layout";
import { Card, Button, Container, Row, Col, Modal, Table, Form } from "react-bootstrap";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

function PreviousAttendance() {
    const { emp_id, name } = useContext(AuthContext);
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditRequestModal, setShowEditRequestModal] = useState(false);
    const [editMessage, setEditMessage] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editableAttendance, setEditableAttendance] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (emp_id) {
            fetchAttendance();
        }
    }, [emp_id]);

    // Fetch attendance data
    const fetchAttendance = async () => {
        try {
            const response = await axios.post("/get_previous_attendance", { emp_id });
            setAttendanceData(response.data || []);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    // Handle viewing attendance for a specific domain
    const handleViewAttendance = (domain) => {
        setSelectedDomain(domain);
        setShowModal(true);
    };

    // Handle opening edit modal
    const handleEditAttendance = (domain) => {
        setSelectedDomain(domain);
        setEditableAttendance(domain.attendance || []); // Copy existing attendance for editing
        setShowEditModal(true);
    };

    // Handle updating attendance status dynamically
    const handleStatusChange = (index, newStatus) => {
        const updatedAttendance = [...editableAttendance];
        updatedAttendance[index].status = newStatus;
        setEditableAttendance(updatedAttendance);
    };

    // Handle saving updated attendance to backend
    const handleSaveChanges = async () => {
        try {
            await axios.post("/update_attendance", {
                emp_id,
                name,
                domain: selectedDomain?.domain,
                domain_id: selectedDomain?.domain_id,
                date: selectedDomain?.date,
                updated_attendance: editableAttendance
            });

            // alert("Attendance updated successfully!");
            setShowEditModal(false);
            setShowSuccessModal(true);
            fetchAttendance(); // Refresh attendance data
        } catch (error) {
            console.error("Error updating attendance:", error);
            alert("Failed to update attendance");
        }
    };

    // Handle sending an edit request to the backend
    const handleEditRequest = async () => {
        try {
            await axios.post("/send_edit_request", { emp_id, emp_name: name, domain_id: selectedDomain?.domain_id, message: editMessage, domain_name: selectedDomain?.domain });
            // alert("Edit request sent successfully!");
            setShowEditRequestModal(false);  // Close modal after sending request
            setEditMessage("");
        } catch (error) {
            console.error("Error sending edit request:", error);
            alert("Error sending edit request");
        }
    };

    // Function to download attendance as PDF
    const downloadPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text(`Attendance for ${selectedDomain?.domain} - ${selectedDomain?.domain_id}`, 14, 20);

        // Add information about who filled the record and date
        doc.setFontSize(12);
        doc.text(`Filled by: ${selectedDomain?.name}, ID: ${selectedDomain?.emp_id}`, 14, 30);  // Displaying name and emp_id
        doc.text(`Date: ${selectedDomain?.date || "N/A"}`, 14, 40);  // Adding the date of the record

        // Prepare data for the table
        const tableData = selectedDomain?.attendance?.map(student => [
            String(student.reg_no?.$numberLong || student.reg_no),  // Ensure reg_no is a string
            student.name,
            student.department,
            student.college_name,
            student.status === "Present" ? "P" : student.status === "Absent" ? "Absent" : "NA"
        ]) || [];

        // Add table headers and data using autoTable
        doc.autoTable({
            head: [['Register No', 'Name', 'Department', 'College Name', 'Status']],  // Header
            body: tableData,  // Body rows
            startY: 50,  // Start the table just below the title and information
            theme: 'striped',  // Optional: makes the table look nicer
        });

        // Save the PDF
        doc.save(`${selectedDomain?.domain}_attendance.pdf`);
    };

    return (
        <Layout>
            <Container className="mt-4">
                <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
                <h2>Previous Attendance</h2>
                {attendanceData.length === 0 ? (
                    <p>No attendance data available</p>
                ) : (
                    <Row className="gy-3">
                        {attendanceData.map((record) => (
                            <Col key={record.domain_id} md={12}>
                                <Card className="shadow-sm p-3 d-flex flex-row align-items-center">
                                    <Card.Body className="d-flex justify-content-between w-100">
                                        <div>
                                            <h5 className="mb-0">{record.domain} - {record.domain_id}</h5>
                                            <p className="text-muted mb-0">Date: {record.date || "N/A"}</p>
                                        </div>
                                        <div>
                                        {record.enable_edit && <Button 
                                                variant="primary" 
                                                onClick={() => handleEditAttendance(record)}
                                            >
                                                Edit
                                            </Button>}
                                            <Button 
                                                variant="primary" 
                                                onClick={() => handleViewAttendance(record)}
                                            >
                                                View
                                            </Button>
                                            {!record.enable_edit && <Button 
                                                variant="warning" 
                                                className="ml-2"
                                                onClick={() => {
                                                    setSelectedDomain(record);
                                                    setShowEditRequestModal(true); // Open the edit request modal
                                                }}
                                            >
                                                Edit Request
                                            </Button>}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Success Modal */}
                            <Modal show={showSuccessModal} onHide={() => { setShowSuccessModal(false)}}>
                                <Modal.Body className="text-center">
                                    <FaCheckCircle size={50} color="green" />
                                    <h4 className="mt-3">Edited successfully!</h4>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="success" onClick={() => navigate("/fill")}>OK</Button>
                                </Modal.Footer>
                            </Modal>

                {/* Attendance Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Attendance for {selectedDomain?.domain}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table striped bordered hover responsive>
                            <thead className="table-dark">
                                <tr>
                                    <th>Register No</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedDomain?.attendance?.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">No student attendance data available</td>
                                    </tr>
                                ) : (
                                    selectedDomain?.attendance?.map((student, index) => (
                                        <tr key={index}>
                                            <td>{student.reg_no?.$numberLong || student.reg_no}</td>
                                            <td>{student.name}</td>
                                            <td>{student.department}</td>
                                            <td style={{ color: student.status === "Present" ? "green" : "red" }}>
                                                {student.status}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                        <Button variant="success" onClick={downloadPDF}>
                            Download PDF
                        </Button>
                    </Modal.Footer>
                </Modal>
                {/* Edit Attendance Modal */}
<Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Edit Attendance</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedDomain && (
      <>
        <p><strong>Domain:</strong> {selectedDomain.domain}</p>

        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Register No.</th>
                <th>Name</th>
                <th>Department</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {editableAttendance.map((student, idx) => (
                <tr key={idx}>
                  <td>{student.reg_no?.$numberLong || student.reg_no}</td>
                  <td>{student.name}</td>
                  <td>{student.department}</td>
                  <td>
                    <Button
                      variant={student.status === "Present" ? "success" : "outline-success"}
                      size="sm"
                      onClick={() => handleStatusChange(idx, "Present")}
                    >
                      Present
                    </Button>
                    <Button
                      variant={student.status === "Absent" ? "danger" : "outline-danger"}
                      size="sm"
                      className="ms-2"
                      onClick={() => handleStatusChange(idx, "Absent")}
                    >
                      Absent
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
    <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
  </Modal.Footer>
</Modal>


                {/* Edit Request Modal */}
                <Modal show={showEditRequestModal} onHide={() => setShowEditRequestModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Request Edit for {selectedDomain?.domain}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group controlId="editMessage">
                                <Form.Label>Message</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editMessage}
                                    onChange={(e) => setEditMessage(e.target.value)}
                                    placeholder="Enter your message to request an edit..."
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditRequestModal(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleEditRequest}>
                            Send Request
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </Layout>
    );
}

export default PreviousAttendance;
