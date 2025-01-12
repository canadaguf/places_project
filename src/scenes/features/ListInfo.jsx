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
} from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const backendUrl = "https://places-project-6i0r.onrender.com";
const ListInfo = () => {
  const { id } = useParams(); // Get the list ID from the URL
  const [list, setList] = useState(null);
  const [places, setPlaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaceId, setNewPlaceId] = useState('');
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
      const token = localStorage.getItem('token');
      await axios.post(
        `${backendUrl}/api/lists/${id}/places`,
        { place_id: newPlaceId },
        { headers: { Authorization: token } }
      );
      setNewPlaceId('');

      // Refetch places after adding a new place
      const placesResponse = await axios.get(`${backendUrl}/api/lists/${id}/places`);
      setPlaces(placesResponse.data.places);
    } catch (error) {
      console.error('Error adding place to list:', error);
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
            { balloonContent: place.name },
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
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                <TextField
                  fullWidth
                  label="New Place ID"
                  value={newPlaceId}
                  onChange={(e) => setNewPlaceId(e.target.value)}
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
              <List>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <ListItem>
                      <ListItemText primary={user.username} />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
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
    </Container>
  );
};

export default ListInfo;