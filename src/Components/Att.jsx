import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Modal,
  Table,
} from "react-bootstrap";
import Layout from "./Layout";
import axios from "../api/api";
import { AuthContext } from "../AuthContext"; // Import AuthContext
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


function Attendance() {
  const { emp_id, name } = useContext(AuthContext); // Get emp_id from AuthContext
  const navigate = useNavigate();

  const [classDetails, setClassDetails] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [absentees, setAbsentees] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showSwapConfirmModal, setShowSwapConfirmModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  console.log(classDetails)

  useEffect(() => {
    if (!emp_id) return; // Avoid API call if emp_id is not available

    const fetchClassDetails = async () => {
      try {
        const response = await axios.get(`/class_details?emp_id=${emp_id}`);
        setClassDetails(response.data);
      } catch (error) {
        console.error("Axios error:", error);
        setError("Failed to fetch class details");
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
    // const interval = setInterval(fetchClassDetails, 30000);
    // return () => clearInterval(interval);
  }, [emp_id]); // Re-run effect when emp_id changes

  const handleFillAttendance = async (classInfo) => {
    try {
      const response = await axios.get(`/students_details?domain_id=${classInfo.domain_id}`);
      setStudents(response.data.students);
      setSelectedClass(classInfo);
      setShowAttendanceModal(true);
      setAttendance({});
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const markAttendance = (regNo, status) => {
    setAttendance((prev) => ({ ...prev, [regNo]: status }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student["REGISTER NUMBER"]] = status;
    });
    setAttendance(newAttendance);
  };

  const isAttendanceComplete = () => {
    return students.every((student) => attendance[student["REGISTER NUMBER"]]);
  };

  const handleShowConfirmModal = () => {
    const absenteesList = students.filter(
      (student) => attendance[student["REGISTER NUMBER"]] === "Absent"
    );
    setAbsentees(absenteesList);
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    const attendanceData = students.map((student) => ({
      reg_no: student["REGISTER NUMBER"],
      name: student["NAME OF THE STUDENT"],
      status: attendance[student["REGISTER NUMBER"]] || "Absent",
      department: student["DEPT"],
      college_name: student["NAME OF THE COLLEGE"]
    }));

    try {
      await axios.post("/submit_attendance", {
        domain: selectedClass.domain,
        domain_id: selectedClass.domain_id,
        emp_id: emp_id, // Use emp_id from context
        name: name,
        attendance: attendanceData,
      });
      // alert("Attendance submitted successfully!");
      setShowAttendanceModal(false);
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting attendance:", error);
    }
  };

  const handleSwapAttendance = async (classInfo) => {
    try {
      const response = await axios.get(`/faculty_details?exclude=${emp_id}`);
      setFacultyList(response.data.faculties);
      setSelectedClass(classInfo);
      setShowSwapModal(true);
    } catch (error) {
      console.error("Error fetching faculty details:", error);
    }
  };

  const confirmSwap = () => {
    setShowSwapModal(false);
    setShowSwapConfirmModal(true);
  };

  const handleSwapSubmit = async () => {
    try {
      await axios.post("/swap_attendance", {
        domain: selectedClass.domain,
        domain_id: selectedClass.domain_id,
        from_emp_id: emp_id,
        from_emp_name: name,
        to_emp_id: selectedFaculty.emp_id,
        to_faculty_name: selectedFaculty.name,
        date: selectedClass.date,
        day: selectedClass.day
      });
      // Set the success message from the response and show success modal
      setSuccessMessage("Attendance swap request submitted successfully!");
      setShowSuccessModal(true);
      setShowSwapConfirmModal(false);
    } catch (error) {
      console.error("Error submitting swap request:", error);
    }
  };

  return (
    <Layout>
      <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
      <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
          <Button variant="primary" onClick={() => navigate("/extra")}>Add Extra Class</Button>
        </div>  
        {loading && <Spinner animation="border" className="d-block mx-auto" />}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && classDetails.length === 0 && (
          <p className="text-center text-muted">No classes available.</p>
        )}

        <Row className="gy-3">
          {!loading &&
            !error &&
            classDetails.map((classInfo) => (
              <Col key={classInfo.id} md={6} lg={4}>
                <Card className="shadow-sm p-3 rounded">
                  <Card.Body>
                    <Card.Title className="fw-bold">{classInfo.domain}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      <b>Domain ID: </b>{classInfo.domain_id}
                    </Card.Subtitle><br></br>
                    <Card.Subtitle className="fw-bold">
                      <b>Type: </b>{classInfo.type }
                    </Card.Subtitle>
                    <br></br>
                    <Card.Subtitle className="mb-2 text-muted">
                      {classInfo.date} - {classInfo.day}
                    </Card.Subtitle>
                    {classInfo.enable && <Button
                      variant="primary"
                      size="md"
                      className="w-100 mt-2"
                      onClick={() => handleFillAttendance(classInfo)}
                    >
                      Fill Attendance
                    </Button>}
                    {!classInfo.swap && classInfo.enable && <Button
                      variant="danger"
                      size="md"
                      className="w-100 mt-2"
                      onClick={() => handleSwapAttendance(classInfo)}
                    >
                      Assign Different Faculty
                    </Button>}
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      </Container>

      {/* Attendance Modal */}
      <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mark Attendance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClass && (
            <>
              <p><strong>Domain:</strong> {selectedClass.domain}</p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button variant="success" onClick={() => markAll("Present")}>
                  Mark All Present
                </Button>
                <Button variant="danger" onClick={() => markAll("Absent")}>
                  Mark All Absent
                </Button>
                <Button variant="secondary" onClick={() => setAttendance({})}>
                  Refresh
                </Button>
              </div>

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
                    {students.map((student, idx) => (
                      <tr key={idx}>
                        <td>{student["REGISTER NUMBER"]}</td>
                        <td>{student["NAME OF THE STUDENT"]}</td>
                        <td>{student.DEPT}</td>
                        <td>
                          <Button
                            variant={attendance[student["REGISTER NUMBER"]] === "Present" ? "success" : "outline-success"}
                            size="sm"
                            onClick={() => markAttendance(student["REGISTER NUMBER"], "Present")}
                          >
                            Present
                          </Button>
                          <Button
                            variant={attendance[student["REGISTER NUMBER"]] === "Absent" ? "danger" : "outline-danger"}
                            size="sm"
                            className="ms-2"
                            onClick={() => markAttendance(student["REGISTER NUMBER"], "Absent")}
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
          <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleShowConfirmModal}
            disabled={!isAttendanceComplete()}
          >
            Submit Attendance
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal for Absentees */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Absentees</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {absentees.length === 0 ? (
            <p>All students are present.</p>
          ) : (
            <Table striped bordered>
              <thead>
                <tr>
                  <th>Register No.</th>
                  <th>Name</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {absentees.map((student, idx) => (
                  <tr key={idx}>
                    <td>{student["REGISTER NUMBER"]}</td>
                    <td>{student["NAME OF THE STUDENT"]}</td>
                    <td>{student.DEPT}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Edit Attendance
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Confirm & Submit
          </Button>
        </Modal.Footer>
      </Modal>

       {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Success</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {/* Green Check Icon */}
          <FaCheckCircle size={80} color="green" />
          <p className="mt-3">{successMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Swap Modal */}
      <Modal show={showSwapModal} onHide={() => setShowSwapModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Faculty to Assign</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Select</th>
                <th>Faculty ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((faculty) => (
                <tr key={faculty.emp_id}>
                  <td>
                    <input
                      type="radio"
                      name="faculty"
                      onChange={() => setSelectedFaculty(faculty)}
                    />
                  </td>
                  <td>{faculty.emp_id}</td>
                  <td>{faculty.name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={confirmSwap} disabled={!selectedFaculty}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Swap Confirmation Modal */}
      <Modal show={showSwapConfirmModal} onHide={() => setShowSwapConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Swap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to assign attendance to {selectedFaculty?.name} ({selectedFaculty?.emp_id})?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleSwapSubmit}>Confirm & Submit</Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}

export default Attendance;

// import React, { useState, useEffect, useContext } from "react";
// import {
//   Card,
//   Button,
//   Container,
//   Row,
//   Col,
//   Spinner,
//   Alert,
//   Modal,
//   Table,
// } from "react-bootstrap";
// import Layout from "./Layout";
// import axios from "../api/api";
// import { AuthContext } from "../AuthContext"; // Import AuthContext

// function Attendance() {
//   const { emp_id } = useContext(AuthContext); // Get emp_id from AuthContext

//   const [classDetails, setClassDetails] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showAttendanceModal, setShowAttendanceModal] = useState(false);
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [attendance, setAttendance] = useState({});
//   const [absentees, setAbsentees] = useState([]);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [showSwapModal, setShowSwapModal] = useState(false);
//   const [facultyList, setFacultyList] = useState([]);
//   const [selectedFaculty, setSelectedFaculty] = useState(null);
//   const [showSwapConfirmModal, setShowSwapConfirmModal] = useState(false);

//   useEffect(() => {
//     if (!emp_id) return; // Avoid API call if emp_id is not available

//     const fetchClassDetails = async () => {
//       try {
//         const response = await axios.get(`/student_details?emp_id=${emp_id}`);
//         setClassDetails(response.data);
//       } catch (error) {
//         console.error("Axios error:", error);
//         setError("Failed to fetch class details");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClassDetails();
//   }, [emp_id]); // Re-run effect when emp_id changes

//   const handleFillAttendance = async (classInfo) => {
//     try {
//       const response = await axios.get(`/students?domain=${classInfo.domain}`);
//       setStudents(response.data.students);
//       setSelectedClass(classInfo);
//       setShowAttendanceModal(true);
//       setAttendance({});
//     } catch (error) {
//       console.error("Error fetching students:", error);
//     }
//   };

//   const handleSwapAttendance = async (classInfo) => {
//     try {
//       const response = await axios.get(`/faculty_details?exclude=${emp_id}`);
//       setFacultyList(response.data.faculties);
//       setSelectedClass(classInfo);
//       setShowSwapModal(true);
//     } catch (error) {
//       console.error("Error fetching faculty details:", error);
//     }
//   };

//   const confirmSwap = () => {
//     setShowSwapModal(false);
//     setShowSwapConfirmModal(true);
//   };

//   const handleSwapSubmit = async () => {
//     try {
//       await axios.post("/swap_attendance", {
//         domain: selectedClass.domain,
//         domain_id: selectedClass.domain_id,
//         from_emp_id: emp_id,
//         to_emp_id: selectedFaculty.emp_id,
//         to_name: selectedFaculty.name,
//       });
//       alert("Attendance swap request submitted successfully!");
//       setShowSwapConfirmModal(false);
//     } catch (error) {
//       console.error("Error submitting swap request:", error);
//     }
//   };

//   return (
//     <Layout>
//       <Container fluid className="mt-4">
//         <h3 className="mb-4 text-center">Class Attendance</h3>
//         {loading && <Spinner animation="border" className="d-block mx-auto" />}
//         {error && <Alert variant="danger">{error}</Alert>}
//         {!loading && !error && classDetails.length === 0 && (
//           <p className="text-center text-muted">No classes available.</p>
//         )}

//         <Row className="gy-3">
//           {!loading &&
//             !error &&
//             classDetails.map((classInfo) => (
//               <Col key={classInfo.id} md={6} lg={4}>
//                 <Card className="shadow-sm p-3 rounded">
//                   <Card.Body>
//                     <Card.Title className="fw-bold">{classInfo.domain}</Card.Title>
//                     <Card.Subtitle className="mb-2 text-muted">
//                       <b>Domain ID: </b>{classInfo.domain_id}
//                     </Card.Subtitle><br></br>
//                     <Card.Subtitle className="fw-bold">
//                       <b>Type: </b>{classInfo.type}
//                     </Card.Subtitle>
//                     <br></br>
//                     <Card.Subtitle className="mb-2 text-muted">
//                       <b>Semester: </b>{classInfo.semester}
//                     </Card.Subtitle>
//                     <Card.Subtitle className="mb-2 text-muted">
//                       {classInfo.class_date}
//                     </Card.Subtitle>
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       className="w-100 mt-2"
//                       onClick={() => handleFillAttendance(classInfo)}
//                     >
//                       Fill Attendance
//                     </Button>
//                     <Button
//                       variant="danger"
//                       size="sm"
//                       className="w-100 mt-2"
//                       onClick={() => handleSwapAttendance(classInfo)}
//                     >
//                       Swap Attendance
//                     </Button>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//         </Row>
//       </Container>

//        {/* Attendance Modal */}
//        <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)} centered size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>Mark Attendance</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedClass && (
//             <>
//               <p><strong>Domain:</strong> {selectedClass.domain}</p>

//               <div className="d-flex flex-wrap gap-2 mb-3">
//                 <Button variant="success" onClick={() => markAll("Present")}>
//                   Mark All Present
//                 </Button>
//                 <Button variant="danger" onClick={() => markAll("Absent")}>
//                   Mark All Absent
//                 </Button>
//                 <Button variant="secondary" onClick={() => setAttendance({})}>
//                   Refresh
//                 </Button>
//               </div>

//               <div className="table-responsive">
//                 <Table striped bordered hover>
//                   <thead>
//                     <tr>
//                       <th>Register No.</th>
//                       <th>Name</th>
//                       <th>Department</th>
//                       <th>Attendance</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {students.map((student, idx) => (
//                       <tr key={idx}>
//                         <td>{student["REGISTER NUMBER"]}</td>
//                         <td>{student["NAME OF THE STUDENT"]}</td>
//                         <td>{student.DEPT}</td>
//                         <td>
//                           <Button
//                             variant={attendance[student["REGISTER NUMBER"]] === "Present" ? "success" : "outline-success"}
//                             size="sm"
//                             onClick={() => markAttendance(student["REGISTER NUMBER"], "Present")}
//                           >
//                             Present
//                           </Button>
//                           <Button
//                             variant={attendance[student["REGISTER NUMBER"]] === "Absent" ? "danger" : "outline-danger"}
//                             size="sm"
//                             className="ms-2"
//                             onClick={() => markAttendance(student["REGISTER NUMBER"], "Absent")}
//                           >
//                             Absent
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </Table>
//               </div>
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>
//             Close
//           </Button>
//           <Button
//             variant="primary"
//             onClick={handleShowConfirmModal}
//             disabled={!isAttendanceComplete()}
//           >
//             Submit Attendance
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Confirmation Modal for Absentees */}
//       <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Absentees</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {absentees.length === 0 ? (
//             <p>All students are present.</p>
//           ) : (
//             <Table striped bordered>
//               <thead>
//                 <tr>
//                   <th>Register No.</th>
//                   <th>Name</th>
//                   <th>Department</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {absentees.map((student, idx) => (
//                   <tr key={idx}>
//                     <td>{student["REGISTER NUMBER"]}</td>
//                     <td>{student["NAME OF THE STUDENT"]}</td>
//                     <td>{student.DEPT}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
//             Edit Attendance
//           </Button>
//           <Button variant="primary" onClick={handleSubmit}>
//             Confirm & Submit
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Swap Modal */}
//       <Modal show={showSwapModal} onHide={() => setShowSwapModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Select Faculty for Swap</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Table striped bordered>
//             <thead>
//               <tr>
//                 <th>Select</th>
//                 <th>Faculty ID</th>
//                 <th>Name</th>
//               </tr>
//             </thead>
//             <tbody>
//               {facultyList.map((faculty) => (
//                 <tr key={faculty.emp_id}>
//                   <td>
//                     <input
//                       type="radio"
//                       name="faculty"
//                       onChange={() => setSelectedFaculty(faculty)}
//                     />
//                   </td>
//                   <td>{faculty.emp_id}</td>
//                   <td>{faculty.name}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="primary" onClick={confirmSwap} disabled={!selectedFaculty}>
//             Confirm
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Swap Confirmation Modal */}
//       <Modal show={showSwapConfirmModal} onHide={() => setShowSwapConfirmModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Swap</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           Are you sure you want to swap attendance with {selectedFaculty?.name} ({selectedFaculty?.emp_id})?
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="danger" onClick={handleSwapSubmit}>Confirm & Submit</Button>
//         </Modal.Footer>
//       </Modal>
//     </Layout>
//   );
// }

// export default Attendance;
