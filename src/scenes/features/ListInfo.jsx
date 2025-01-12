import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Box,
  TextField,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import the delete icon
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const backendUrl = "https://places-project-6i0r.onrender.com";

const ListInfo = () => {
  const { id } = useParams(); // Get the list ID from the URL
  const [list, setList] = useState(null);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaceName, setNewPlaceName] = useState(''); // State for place name input
  const [newUsername, setNewUsername] = useState(''); // State for username input
  const [snackbarOpen, setSnackbarOpen] = useState(false); // State for Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState(''); // Snackbar message
  const mapRef = useRef(null);

  // Fetch list details, places, and users
  useEffect(() => {
    const fetchListData = async () => {
      try {
        // Fetch list details
        const listResponse = await axios.get(`${backendUrl}/api/lists/${id}`);
        setList(listResponse.data.list);

        // Fetch places in the list
        const placesResponse = await axios.get(`${backendUrl}/api/lists/${id}/places`);
        setPlaces(placesResponse.data.places);

        // Fetch users connected to the list
        const usersResponse = await axios.get(`${backendUrl}/api/lists/${id}/users`);
        setUsers(usersResponse.data.users);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching list data:', error);
        setLoading(false);
      }
    };

    fetchListData();
  }, [id]);

  // Handle adding a new place to the list
  const handleAddPlace = async () => {
    try {
      // Search for the place by name
      const searchResponse = await axios.get(`${backendUrl}/api/places`, {
        params: { name: newPlaceName },
      });

      const foundPlaces = searchResponse.data.places;

      if (foundPlaces.length === 0) {
        // No place found
        setSnackbarMessage('Place not found');
        setSnackbarOpen(true);
        return;
      }

      // Use the first matching place (you can add logic to handle multiple matches)
      const placeId = foundPlaces[0].id;

      // Add the place to the list
      const token = localStorage.getItem('token');
      await axios.post(
        `${backendUrl}/api/lists/${id}/places`,
        { place_id: placeId },
        { headers: { Authorization: token } }
      );

      // Clear the input field
      setNewPlaceName('');

      // Refetch places after adding a new place
      const placesResponse = await axios.get(`${backendUrl}/api/lists/${id}/places`);
      setPlaces(placesResponse.data.places);

      // Notify the user
      setSnackbarMessage('Place added successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding place to list:', error);
      setSnackbarMessage('Failed to add place. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle adding a new user to the list
  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('token');

      // Add the user to the list
      await axios.post(
        `${backendUrl}/api/lists/${id}/users`,
        { username: newUsername },
        { headers: { Authorization: token } }
      );

      // Clear the input field
      setNewUsername('');

      // Refetch users after adding a new user
      const usersResponse = await axios.get(`${backendUrl}/api/lists/${id}/users`);
      setUsers(usersResponse.data.users);

      // Notify the user
      setSnackbarMessage('User added successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding user to list:', error);
      setSnackbarMessage('Failed to add user. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle deleting a place from the list
  const handleDeletePlace = async (placeId) => {
    try {
      const token = localStorage.getItem('token');

      // Delete the place from the list
      await axios.delete(`${backendUrl}/api/lists/${id}/places/${placeId}`, {
        headers: { Authorization: token },
      });

      // Refetch places after deletion
      const placesResponse = await axios.get(`${backendUrl}/api/lists/${id}/places`);
      setPlaces(placesResponse.data.places);

      // Notify the user
      setSnackbarMessage('Place deleted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting place:', error);
      setSnackbarMessage('Failed to delete place. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Handle deleting a user from the list
  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');

      // Delete the user from the list
      await axios.delete(`${backendUrl}/api/lists/${id}/users/${userId}`, {
        headers: { Authorization: token },
      });

      // Refetch users after deletion
      const usersResponse = await axios.get(`${backendUrl}/api/lists/${id}/users`);
      setUsers(usersResponse.data.users);

      // Notify the user
      setSnackbarMessage('User deleted successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbarMessage('Failed to delete user. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Initialize Yandex Map with all places
  useEffect(() => {
    let myMap = null;

    if (places.length > 0 && mapRef.current) {
      ymaps.ready(() => {
        // Clean up the previous map instance if it exists
        if (myMap) {
          myMap.destroy();
        }

        // Initialize a new map instance
        myMap = new ymaps.Map(mapRef.current, {
          center: [places[0].longitude, places[0].latitude],
          zoom: 12,
        });

        // Add markers for all places
        const placemarks = places.map((place) => (
          new ymaps.Placemark(
            [place.longitude, place.latitude],
            {
              balloonContent: `
                <strong>${place.name}</strong><br>
                Rating: ${place.average_rating || 'N/A'} (${place.total_reviews || 0} reviews)`
            },
            { preset: 'islands#redDotIcon' }
          )
        ));

        // Add placemarks to the map
        placemarks.forEach((placemark) => {
          myMap.geoObjects.add(placemark);
        });
      });
    }

    // Cleanup function to destroy the map instance
    return () => {
      if (myMap) {
        myMap.destroy();
      }
    };
  }, [places]);

  // Handle Snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column: Places in the List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              {list ? list.list_name : 'Loading...'}
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <List>
                  {places.map((place) => (
                    <React.Fragment key={place.id}>
                      <ListItem
                        component={Link}
                        to={`/place/${place.id}`}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <ListItemText primary={place.name} secondary={place.address} />
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent navigation
                            handleDeletePlace(place.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                <TextField
                  fullWidth
                  label="New Place Name"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  sx={{ marginBottom: 2 }}
                />
                <Button variant="contained" onClick={handleAddPlace}>
                  Add Place
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Users Connected to the List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Users Connected to the List
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <List>
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                      <ListItem>
                        <ListItemText primary={user.username} />
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                <TextField
                  fullWidth
                  label="New User Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  sx={{ marginBottom: 2 }}
                />
                <Button variant="contained" onClick={handleAddUser}>
                  Add User
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Bottom Section: Map */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Map of Places
            </Typography>
            <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ListInfo;