import React from 'react';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = ({ open, handleDrawerToggle }) => {
  const location = useLocation();

  const menuItems = [
    { text: 'Home', link: '/' },
    { text: 'Поиск', link: '/map' },
  ];

  return (
    <Drawer open={open} onClose={handleDrawerToggle}>
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            key={index}
            button // Correct usage of the button prop
            component={Link}
            to={item.link}
            selected={location.pathname === item.link}
            onClick={handleDrawerToggle}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;