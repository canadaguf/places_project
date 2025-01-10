import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

const backendUrl = "https://places-project-6i0r.onrender.com";

function MapComponent() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [searchControl, setSearchControl] = useState(null);
  const [open, setOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    ymaps.ready(() => {
      console.log('Yandex Maps API is ready');
      const myMap = new ymaps.Map('map', {
        center: [55.751426, 37.618879],
        zoom: 13,
        controls: []
      });
      setMap(myMap);
      console.log('Map initialized');

      const searchControl = new ymaps.control.SearchControl({
        options: {
          provider: 'yandex#search',
          noSuggestPanel: true
        }
      });
      myMap.controls.add(searchControl);
      setSearchControl(searchControl);
      console.log('Search control added');

      // Add event listener for search result selection
      searchControl.events.add('resultselect', (e) => {
        console.log('Search result selected');
        const index = e.get('index');
        searchControl.getResult(index).then((result) => {
          console.log('Search result details:', result);

          // Debugging: Log the properties to see what keys are available
          console.log('Result properties:', result.properties.getAll());

          const place = {
            place_id: result.properties.get('id'),
            display_name: result.properties.get('name'),
            lat: result.geometry.getCoordinates()[1],
            lon: result.geometry.getCoordinates()[0],
            address: result.properties.get('description'),
            categories: result.properties.get('companyMetaData', {}).Categories.map(category => category.name),
            work_hours: result.properties.get('companyMetaData', {}).Hours.text || '',
            phone: result.properties.get('companyMetaData', {}).Phones[0]?.formatted || '',
            url: result.properties.get('url')
          };

          // Debugging: Log the extracted place data
          console.log('Extracted place data:', place);

          setSelectedPlace(place);
          console.log('Selected place:', place);
        });
      });
    });
  }, []);

  const handleSavePlace = (place) => {
    axios.post(`${backendUrl}/api/place-data`, place)
      .then(response => {
        console.log('Response from backend:', response.data);
        if (response.data.status === 'success') {
          setPopupMessage(response.data.message);
          setOpen(true);
        }
      })
      .catch(error => {
        console.error('Error saving place:', error.response.data);
        if (error.response.data.status === 'place_id exists') {
          setPopupMessage(error.response.data.message);
          setOpen(true);
        } else {
        setPopupMessage('Error saving place');
        setOpen(true);
        }
      });
  };

 const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '500px' }}></div>

      {selectedPlace && (
        <div>
        <b>{selectedPlace.display_name}</b>
        <p>Адрес: {selectedPlace.address}</p>
        <p>Категории: {selectedPlace.categories.join(', ')}</p>
        <p>Время работы: {selectedPlace.work_hours}</p>
        <p>Телефон: {selectedPlace.phone}</p>
        <Button variant="contained" onClick={() => handleSavePlace(selectedPlace)}>Сохранить в базу</Button>
      </div>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Внимание!"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {popupMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default MapComponent;