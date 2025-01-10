import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

const backendUrl = "https://places-project-6i0r.onrender.com";
  const handleLogin = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.post('${backendUrl}/api/login', {
        username,
        password,
      });

      const { token } = response.data;
      localStorage.setItem('token', token); // Store token in localStorage
      setIsLoggedIn(true); // Update login state
      navigate('/'); // Navigate to homepage
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Login failed');
      } else {
        setMessage('Network error or server not responding');
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <TextField
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
      />
      <TextField
        label="Password"
        variant="outlined"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleLogin}
        disabled={loading} // Disable button while loading
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>
      <Typography variant="body1" color="error" marginTop={2}>
        {message}
      </Typography>
    </Box>
  );
}

export default Login;