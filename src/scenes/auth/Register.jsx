import React, { useState } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Link,
  useTheme,
} from '@mui/material';
import PrivacyPolicyPopup from './PrivacyPolicyPopup';
import { tokens } from '../../theme/tokens'; // Import your tokens

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [policyPopupOpen, setPolicyPopupOpen] = useState(false);
  const backendUrl = "https://places-project-6i0r.onrender.com";

  const theme = useTheme(); // Get the current theme
  const colors = tokens(theme.palette.mode); // Get colors based on the theme mode

  // Use grey[100] for dark mode and grey[900] for light mode
  const linkColor = colors.grey[theme.palette.mode === 'dark' ? 100 : 900];

  const handleRegister = async () => {
    if (!agreeToPolicy) {
      setMessage('You must agree to the privacy policy to register.');
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/register`, {
        username,
        password,
      });
      setMessage(response.data.message); // Display success message
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || 'Registration failed');
      } else {
        setMessage('Network error or server not responding');
      }
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
        Register
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
      <FormControlLabel
        control={
          <Checkbox
            checked={agreeToPolicy}
            onChange={(e) => setAgreeToPolicy(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body2">
            Соглашаюсь с {' '}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPolicyPopupOpen(true);
              }}
              style={{
                color: linkColor,
              }}
            >
              политика обработки персональных данных
            </Link>
          </Typography>
        }
      />
      <Button variant="contained" color="primary" onClick={handleRegister}>
        Зарегистрироваться
      </Button>
      <Typography variant="body1" color="error" marginTop={2}>
        {message}
      </Typography>

      {/* Privacy Policy Popup */}
      <PrivacyPolicyPopup
        open={policyPopupOpen}
        onClose={() => setPolicyPopupOpen(false)}
      />
    </Box>
  );
}

export default Register;