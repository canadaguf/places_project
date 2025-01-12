import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeContext, useMode } from './theme/useMode';
import Topbar from './scenes/global/Topbar';
import Sidebar from './scenes/global/Sidebar';
import Homepage from './scenes/homepage/Homepage';
import MapComponent from './scenes/map/MapComponent';
import Register from './scenes/auth/Register';
import Login from './scenes/auth/Login';
import PlaceInfo from './scenes/features/PlaceInfo';
import ListInfo from './scenes/features/ListInfo';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [theme, colorMode] = useMode();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from localStorage
    setIsLoggedIn(false);
  };

  // Check for token on page load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          // Token is valid and not expired
          setIsLoggedIn(true);
        } else {
          // Token is expired
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    }
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Topbar
            handleDrawerToggle={handleDrawerToggle}
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
          />
          <Sidebar open={open} handleDrawerToggle={handleDrawerToggle} />
          <Routes>
            <Route
              path="/"
              element={isLoggedIn ? <Homepage /> : <Navigate to="/login" />}
            />
            <Route
              path="/map"
              element={isLoggedIn ? <MapComponent /> : <Navigate to="/login" />}
            />
            <Route path="/register" element={<Register />} />
            <Route
              path="/login"
              element={<Login setIsLoggedIn={setIsLoggedIn} />}
            />
            <Route path="/place/:id" element={<PlaceInfo />} /> {/* Add route for PlaceInfo */}
          </Routes>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;