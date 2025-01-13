import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

const PrivacyPolicyPopup = ({ open, onClose }) => {
  const [policyText, setPolicyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      // Fetch the privacy policy text when the popup opens
      fetch('/privacy-policy.txt')
        .then((response) => response.text())
        .then((text) => {
          setPolicyText(text);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching privacy policy:', error);
          setPolicyText('Failed to load privacy policy.');
          setLoading(false);
        });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Privacy Policy</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        ) : (
          <DialogContentText style={{ whiteSpace: 'pre-line' }}>
            {policyText}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyPopup;