import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';

/**
 * TokenInput - A consistent, reusable component for token input fields
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the input field
 * @param {string} props.value - Current token value
 * @param {function} props.onChange - Function to handle value changes
 * @param {string} props.helperText - Helper text to display below the input
 * @param {React.ReactNode} props.startAdornment - Icon or element to display at the start of the input
 * @param {boolean} props.fullWidth - Whether the input should take full width
 * @param {string} props.className - Additional CSS class names
 */
const TokenInput = ({ 
  label, 
  value, 
  onChange, 
  helperText, 
  startAdornment, 
  fullWidth = true, 
  className = "" 
}) => {
  const [showToken, setShowToken] = useState(false);
  
  return (
    <TextField
      label={label}
      type={showToken ? "text" : "password"}
      variant="outlined"
      fullWidth={fullWidth}
      value={value}
      onChange={onChange}
      className={`token-input ${className}`}
      helperText={helperText}
      InputProps={{
        startAdornment: startAdornment,
        endAdornment: (
          <Button 
            size="small" 
            onClick={() => setShowToken(!showToken)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            {showToken ? 'Hide' : 'Show'}
          </Button>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4fc3f7',
              borderWidth: '2px',
            }
          }
        }
      }}
    />
  );
};

export default TokenInput; 