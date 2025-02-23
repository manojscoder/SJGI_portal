import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from '../api/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { setEmail: setUserEmail, setEmpId, setName } = useContext(AuthContext); // Fetch context setters
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login', { email, password });
      setMessage(response.data.message || 'Login successful!');

      if (response.data.role === 'faculty' || response.data.role === 'sjce_admin' || response.data.role === 'sjit_admin' || response.data.role === 'main_admin') {
        setUserEmail(email);
        setEmpId(response.data.emp_id);
        setName(response.data.name);

        // Store user data in localStorage to persist across sessions
        localStorage.setItem('user', JSON.stringify({
          email,
          emp_id: response.data.emp_id,
          name: response.data.name,
        }));


        // Redirect based on role
        if (response.data.role === 'faculty') {
          navigate('/faculty');
        } else if (response.data.role === 'sjce_admin' || response.data.role === 'sjit_admin') {
          navigate('/college_admin');
        } else if (response.data.role === 'main_admin') {
          navigate('/main_admin');
        }


      } else {
        setMessage(`Role not recognized.${response.data.role}`);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <section className="vh-100">
      <div className="container-fluid h-custom">
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-md-9 col-lg-6 col-xl-5">
            <img
              src="at_logo.jpg"
              className="img-fluid w-100"  // Makes the image fully responsive
              alt="Sample illustration"
            />
          </div>
          <div className="col-md-8 col-lg-6 col-xl-4 offset-xl-1">
            <form onSubmit={handleLogin}>
              <div className="divider d-flex align-items-center my-4">
                <p className="text-center fw-bold mx-3 mb-0">Attendance System</p>
              </div>

              <div className="form-outline mb-4">
                <label className="form-label" htmlFor="form3Example3">
                  Email address
                </label>
                <input
                  type="email"
                  id="form3Example3"
                  className="form-control form-control-lg"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-outline mb-3">
                <label className="form-label" htmlFor="form3Example4">
                  Password
                </label>
                <input
                  type="password"
                  id="form3Example4"
                  className="form-control form-control-lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              

              <div className="text-center text-lg-start mt-4 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                >
                  Login
                </button>
              </div>
            </form>
            {message && <p className="text-center mt-3 text-danger">{message}</p>}
          </div>
        </div>
      </div>
      <div className="d-flex flex-column flex-md-row text-center text-md-start justify-content-between py-4 px-4 px-xl-5 bg-primary">
        <div className="text-white mb-3 mb-md-0">Copyright © SJGI, Chennai, India.</div>
      </div>
    </section>
  );
};

export default LoginPage;
