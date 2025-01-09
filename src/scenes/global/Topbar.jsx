import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { ColorModeContext } from '../../theme/useMode'; // Import ColorModeContext
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

const Topbar = ({ handleDrawerToggle, isLoggedIn, handleLogout }) => {
  const { toggleColorMode } = useContext(ColorModeContext); // Use toggleColorMode from context

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Карта приключений
        </Typography>
        <Button color="inherit" onClick={toggleColorMode}>
          Тема
        </Button>

        {/* Show Registration link only if the user is not logged in */}
        {!isLoggedIn && (
          <Button color="inherit" component={Link} to="/register">
            Регистрация
          </Button>
        )}

        {/* Show Login/Logout button based on the login state */}
        {isLoggedIn ? (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;