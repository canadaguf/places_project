import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import privacyPolicyText from '/privacy-policy.txt';

const PrivacyPolicyPopup = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Privacy Policy</DialogTitle>
      <DialogContent>
        <DialogContentText style={{ whiteSpace: 'pre-line' }}>
          {privacyPolicyText}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Privacy Policy</DialogTitle>
      <DialogContent>
        <DialogContentText style={{ whiteSpace: 'pre-line' }}>
          {privacyPolicyText}
        </DialogContentText>
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