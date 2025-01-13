import React, { useState, useEffect } from 'react';
import { Typography, Container, Grid, Paper, List, ListItem, ListItemText, Divider, CircularProgress, Button, TextField } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const backendUrl = "https://places-project-6i0r.onrender.com";
const Homepage = () => {
  const [places, setPlaces] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [newListName, setNewListName] = useState('');
  const itemsPerPage = 5;

  // Fetch places from the backend
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/places`);
        setPlaces(response.data.places);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching places:', error);
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // Fetch lists for the current user
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendUrl}/api/lists`, {
          headers: { Authorization: token },
        });
        setLists(response.data.lists);
        setListLoading(false);
      } catch (error) {
        console.error('Error fetching lists:', error);
        setListLoading(false);
      }
    };

    fetchLists();
  }, []);

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleListNextPage = () => {
    setListPage((prevPage) => prevPage + 1);
  };

  const handleListPrevPage = () => {
    setListPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleCreateList = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${backendUrl}/api/lists`,
        { list_name: newListName },
        { headers: { Authorization: token } }
      );
      setNewListName('');
      // Refetch lists
      const response = await axios.get(`${backendUrl}/api/lists`, {
        headers: { Authorization: token },
      });
      setLists(response.data.lists);
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const paginatedPlaces = places.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const paginatedLists = lists.slice((listPage - 1) * itemsPerPage, listPage * itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Grid container spacing={4}>
        {/* Section 1: Places */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper elevation={3} sx={{ padding: 3, textAlign: 'center', borderRadius: 2, height: 400, overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Все места
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
                  Следующая
                </Button>
                <Button onClick={handleNextPage} disabled={page * itemsPerPage >= places.length}>
                  Предыдущая
                </Button>
              </>
            )}
          </Paper>
        </Grid>

        {/* Section 2: Personal Lists */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper elevation={3} sx={{ padding: 3, textAlign: 'center', borderRadius: 2, height: 400, overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Мои списки
            </Typography>
            <TextField
              fullWidth
              label="New List Name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              sx={{ marginBottom: 2 }}
            />
            <Button variant="contained" onClick={handleCreateList}>
              Создать список
            </Button>
            {listLoading ? (
              <CircularProgress />
            ) : (
              <>
                <List>
                  {paginatedLists.map((list) => (
                    <React.Fragment key={list.id}>
                      <ListItem
                        component={Link}
                        to={`/lists/${list.id}`}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <ListItemText primary={list.list_name} secondary={`Created on ${list.created_at}`} />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                <Button onClick={handleListPrevPage} disabled={listPage === 1}>
                  Предыдущая
                </Button>
                <Button onClick={handleListNextPage} disabled={listPage * itemsPerPage >= lists.length}>
                  Следующая
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Homepage;