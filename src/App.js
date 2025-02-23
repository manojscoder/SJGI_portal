import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Components/LoginPage';
import Faculty from './Components/Faculty';
import PrivateRoute from './Components/PrivateRoute';
import ExtraClass from './Components/ExtraClass';
import PreviousAttendance from './Components/Previous_attendance';
import AttendanceDownload from './Components/Download_att';
import CollegeAdmin from './Components/CollegeAdmin';
import MainAdmin from './Components/MainAdmin';
import ApproveRequest from './Components/ApproveRequest';
import ManageStudents from './Components/ManageStudents';
import AddUsers from './Components/AddUsers';
import RemoveUsers from './Components/RemoveUsers';
import ManageUsers from './Components/ManageUsers';
import AddStudents from './Components/AddStudents';
import RemoveStudents from './Components/RemoveStudents';
import ChangePassword from './Components/ChangePassword';
import Att from './Components/Att';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/faculty" element={<PrivateRoute><Faculty/></PrivateRoute>} />
        <Route path="/college_admin" element={<PrivateRoute><CollegeAdmin/></PrivateRoute>} />
        <Route path="/main_admin" element={<PrivateRoute><MainAdmin/></PrivateRoute>} />
        <Route path="/fill" element={<PrivateRoute><Att/></PrivateRoute>} />
        <Route path="/extra" element={<PrivateRoute><ExtraClass/></PrivateRoute>} />
        <Route path="/previous_attendance" element={<PrivateRoute><PreviousAttendance/></PrivateRoute>} />
        <Route path="/download_att" element={<PrivateRoute><AttendanceDownload/></PrivateRoute>} />
        <Route path="/approve_edit_request" element={<PrivateRoute><ApproveRequest/></PrivateRoute>} />
        <Route path="/manage_students" element={<PrivateRoute><ManageStudents/></PrivateRoute>} />
        <Route path="/add_users" element={<PrivateRoute><AddUsers/></PrivateRoute>} />
        <Route path="/remove_users" element={<PrivateRoute><RemoveUsers/></PrivateRoute>} />
        <Route path="/manage_users" element={<PrivateRoute><ManageUsers/></PrivateRoute>} />
        <Route path="/add_students" element={<PrivateRoute><AddStudents/></PrivateRoute>} />
        <Route path="/remove_students" element={<PrivateRoute><RemoveStudents/></PrivateRoute>} />
        <Route path="/change_password" element={<PrivateRoute><ChangePassword/></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;