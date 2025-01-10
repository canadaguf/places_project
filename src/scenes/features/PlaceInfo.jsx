import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  CircularProgress,
  Button,
  TextField,
  Grid,
  Slider,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const backendUrl = "https://places-project-6i0r.onrender.com";

const PlaceInfo = () => {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category: [],
    description: '',
    work_hours: '',
    website: '',
    phone: '',
  });
  const [reviewData, setReviewData] = useState({
    review_text: '',
    review_score: 5,
  });

  const mapRef = useRef(null);

  useEffect(() => {
    const fetchPlaceAndReviews = async () => {
      try {
        const placeResponse = await axios.get(`${backendUrl}/api/place/${id}`);
        setPlace(placeResponse.data.place);
        setFormData({
          name: placeResponse.data.place.name,
          address: placeResponse.data.place.address,
          category: placeResponse.data.place.category.join(', '),
          description: placeResponse.data.place.description,
          work_hours: placeResponse.data.place.work_hours,
          website: placeResponse.data.place.website,
          phone: placeResponse.data.place.phone,
        });

        const reviewsResponse = await axios.get(`${backendUrl}/api/reviews/${id}`);
        setReviews(reviewsResponse.data.reviews);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching place details or reviews:', error);
        setLoading(false);
      }
    };

    fetchPlaceAndReviews();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please log in again.');
        return;
      }

      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        return;
      }

      const response = await axios.put(
        `${backendUrl}/api/place/${id}`,
        {
          name: formData.name,
          address: formData.address,
          category: formData.category.split(',').map((item) => item.trim()),
          description: formData.description,
          work_hours: formData.work_hours,
          website: formData.website,
          phone: formData.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPlace(response.data.place);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating place details:', error);
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        alert('Failed to update place details. Please try again.');
      }
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: value,
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.user_id;

      await axios.post(
        `${backendUrl}/api/review`,
        {
          id_place: id,
          id_user: userId,
          review_text: reviewData.review_text,
          review_score: reviewData.review_score,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Review added successfully!');
      setReviewFormOpen(false);
      setReviewData({ review_text: '', review_score: 5 });

      const placeResponse = await axios.get(`${backendUrl}/api/place/${id}`);
      setPlace(placeResponse.data.place);

      const reviewsResponse = await axios.get(`${backendUrl}/api/reviews/${id}`);
      setReviews(reviewsResponse.data.reviews);
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to add review. Please try again.');
    }
  };

  useEffect(() => {
    let myMap = null;

    if (place && mapRef.current) {
      ymaps.ready(() => {
        if (myMap) {
          myMap.destroy();
        }

        myMap = new ymaps.Map(mapRef.current, {
          center: [place.longitude, place.latitude],
          zoom: 15,
        });

        const myPlacemark = new ymaps.Placemark(
          [place.longitude, place.latitude],
          {
            balloonContent: place.name,
          },
          {
            preset: 'islands#redDotIcon',
          }
        );

        myMap.geoObjects.add(myPlacemark);
      });
    }

    return () => {
      if (myMap) {
        myMap.destroy();
      }
    };
  }, [place]);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
            {loading ? (
              <CircularProgress />
            ) : place ? (
              <>
                <Typography variant="h4" gutterBottom>
                  {editMode ? 'Edit Place' : place.name}
                </Typography>
                {editMode ? (
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Category (comma-separated)"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          multiline
                          rows={4}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Work Hours"
                          name="work_hours"
                          value={formData.work_hours}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button type="submit" variant="contained" color="primary">
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => setEditMode(false)}
                          sx={{ marginLeft: 2 }}
                        >
                          Cancel
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                ) : (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Address: {place.address}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Category: {place.category.join(', ')}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Description: {place.description}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Work Hours: {place.work_hours}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Website: <a href={place.website} target="_blank" rel="noopener noreferrer">{place.website}</a>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Phone: {place.phone}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Rating: {place.average_rating} ({place.total_reviews})
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setEditMode(true)}
                      sx={{ marginTop: 2 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setReviewFormOpen(true)}
                      sx={{ marginLeft: 2, marginTop: 2 }}
                    >
                      Add Review
                    </Button>
                  </>
                )}

                {reviewFormOpen && (
                  <Box sx={{ marginTop: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Add Review
                    </Typography>
                    <form onSubmit={handleReviewSubmit}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Review Text"
                            name="review_text"
                            value={reviewData.review_text}
                            onChange={handleReviewChange}
                            multiline
                            rows={4}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography gutterBottom>Rating:</Typography>
                          <Slider
                            name="review_score"
                            value={reviewData.review_score}
                            onChange={(e, newValue) =>
                              setReviewData({ ...reviewData, review_score: newValue })
                            }
                            min={1}
                            max={10}
                            step={1}
                            valueLabelDisplay="auto"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button type="submit" variant="contained" color="primary">
                            Submit Review
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => setReviewFormOpen(false)}
                            sx={{ marginLeft: 2 }}
                          >
                            Cancel
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="h6" color="error">
                Place not found.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
            <div ref={mapRef} style={{ width: '100%', height: '300px' }}></div>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            {reviews.length > 0 ? (
              <List>
                {reviews.map((review) => (
                  <React.Fragment key={review.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${review.username} - ${review.review_score}/10`}
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary">
                              {review.review_text}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {review.created_at}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No reviews yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PlaceInfo;