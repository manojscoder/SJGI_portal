import React, { useState, useContext } from "react";
import { Dropdown, Button, Form, Alert } from "react-bootstrap";
import Layout from "./Layout";
import axios from "../api/api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

const AttendanceDownload = () => {
  const [date, setDate] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [noData, setNoData] = useState(false);
  const navigate = useNavigate();
  const { emp_id } = useContext(AuthContext);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get("/download_attendance", { params: { date, emp_id } });

      if (!response.data.attendance || Object.keys(response.data.attendance).length === 0) {
        setNoData(true);
        setAttendanceData({});
        setDepartments([]);
        setColleges([]);
        return;
      }

      setNoData(false);
      setAttendanceData(response.data.attendance);

      // Extract departments
      const departmentNames = Object.keys(response.data.attendance);
      setDepartments(departmentNames);

      // Extract unique colleges from attendance data
      const allColleges = new Set();
      departmentNames.forEach((dept) => {
        response.data.attendance[dept].forEach((student) => {
          if (student.college_name) {
            allColleges.add(student.college_name);
          }
        });
      });

      setColleges([...allColleges]); // Convert Set to Array
    } catch (error) {
      console.error("Error fetching attendance data", error);
      setNoData(true);
    }
  };

  const generatePDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 10, 10);
    doc.text(`Date: ${date}`, 10, 20);
    let yPosition = 30;

    if (selectedOption === "Download All") {
      Object.entries(data).forEach(([department, students]) => {
        doc.text(department, 10, yPosition);
        yPosition += 10;
        const tableData = students.map((s, index) => [
          index + 1,
          s.reg_no,
          s.name,
          s.department,
          s.college_name,
          s.status === "Present" ? "P" : s.status === "Absent" ? "Absent" : "NA"
        ]);
        doc.autoTable({
          startY: yPosition,
          head: [["S.No", "Reg No", "Name", "Department", "College", "Status"]],
          body: tableData,
        });
        yPosition = doc.lastAutoTable.finalY + 10;
      });
    } else if (selectedOption === "Download Based on College") {
      const filteredData = [];
      Object.values(data).forEach((students) => {
        students.forEach((s) => {
          if (s.college_name === selectedCollege) {
            filteredData.push([s.reg_no, s.name, s.department, s.college_name, s.status === "Present" ? "P" : s.status === "Absent" ? "Absent" : "NA"]);
          }
        });
      });
      doc.autoTable({
        startY: yPosition,
        head: [["Reg No", "Name", "Departmert", "College",  "Status"]],
        body: filteredData,
      });
    } else {
      const tableData = data.map((s, index) => [
        index + 1,
        s.reg_no,
        s.name,
        s.department,
        s.college_name,
        s.status === "Present" ? "P" : s.status === "Absent" ? "Absent" : "NA"
      ]);
      doc.autoTable({
        startY: yPosition,
        head: [["S.No", "Reg No", "Name", "Department", "College",  "Status"]],
        body: tableData,
      });
    }

    doc.save(`${title}_${date}.pdf`);
  };

  const handleDownload = () => {
    if (selectedOption === "Download All") {
      generatePDF(attendanceData, "All_Departments_Attendance");
    } else if (selectedOption === "Download By Department" && selectedDepartment) {
      generatePDF(attendanceData[selectedDepartment] || [], `${selectedDepartment}_Attendance`);
    } else if (selectedOption === "Download Based on College" && selectedCollege) {
      generatePDF(attendanceData, `${selectedCollege}_Attendance`);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        {/* Back Button */}
        <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">
          ← Back
        </Button>

        <h3>Download Attendance</h3>
        <Form.Group className="mb-3">
          <Form.Label>Select Date</Form.Label>
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Form.Group>
        <Button onClick={fetchAttendance} disabled={!date} className="mb-3">
          Fetch Attendance
        </Button>

        {noData && <Alert variant="warning">No data found for the selected date.</Alert>}

        {departments.length > 0 && !noData && (
          <>
            <Dropdown onSelect={(eventKey) => setSelectedOption(eventKey)}>
              <Dropdown.Toggle variant="primary">
                {selectedOption || "Select Option"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="Download All">Download All Departments</Dropdown.Item>
                <Dropdown.Item eventKey="Download By Department">Download Based on Department</Dropdown.Item>
                {colleges.length > 1 && (
                  <Dropdown.Item eventKey="Download Based on College">Download Based on College</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {selectedOption === "Download By Department" && (
              <Dropdown className="mt-3" onSelect={(eventKey) => setSelectedDepartment(eventKey)}>
                <Dropdown.Toggle variant="secondary">
                  {selectedDepartment || "Select Department"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {departments.map((dept, index) => (
                    <Dropdown.Item key={index} eventKey={dept}>
                      {dept}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            {selectedOption === "Download Based on College" && colleges.length > 1 && (
              <Dropdown className="mt-3" onSelect={(eventKey) => setSelectedCollege(eventKey)}>
                <Dropdown.Toggle variant="secondary">
                  {selectedCollege || "Select College"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {colleges.map((college, index) => (
                    <Dropdown.Item key={index} eventKey={college}>
                      {college}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}

            {selectedOption && (
              <Button
                className="mt-3"
                onClick={handleDownload}
                disabled={
                  (selectedOption === "Download By Department" && !selectedDepartment) ||
                  (selectedOption === "Download Based on College" && !selectedCollege)
                }
              >
                Download PDF
              </Button>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceDownload;
