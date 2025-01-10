import React, { useState, useEffect } from 'react';
import { Typography, Container, Grid, Paper, List, ListItem, ListItemText, Divider, CircularProgress, Button } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';

const backendUrl = "https://places-project-6i0r.onrender.com";
const Homepage = () => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch places from the backend
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await axios.get('${backendUrl}/api/places');
        setPlaces(response.data.places);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching places:', error);
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const paginatedPlaces = places.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Grid container spacing={4}>
        {/* Section 1: Places */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper elevation={3} sx={{ padding: 3, textAlign: 'center', borderRadius: 2, height: 400, overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Places
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <List>
                  {paginatedPlaces.map((place) => (
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
                <Button onClick={handlePrevPage} disabled={page === 1}>
                  Previous
                </Button>
                <Button onClick={handleNextPage} disabled={page * itemsPerPage >= places.length}>
                  Next
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Other sections (Lists, Reviews, Events) */}
        {/* ... */}
      </Grid>
    </Container>
  );
};

export default Homepage;