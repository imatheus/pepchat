import React, { useState, useCallback } from 'react';
import { TextField } from '@material-ui/core';
import { sanitizeInput, validateFormData } from '../../utils/inputValidation';

const SecureInput = ({
  value,
  onChange,
  validation = {},
  sanitize = true,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleChange = useCallback((event) => {
    let newValue = event.target.value;
    
    // Sanitize input if enabled
    if (sanitize) {
      newValue = sanitizeInput(newValue);
    }
    
    setLocalValue(newValue);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for debounced validation and onChange
    const timer = setTimeout(() => {
      // Validate if rules are provided
      if (validation && Object.keys(validation).length > 0) {
        const { isValid, errors } = validateFormData(
          { [props.name || 'field']: newValue },
          { [props.name || 'field']: validation }
        );
        
        setError(errors[props.name || 'field'] || '');
      }
      
      // Call parent onChange
      if (onChange) {
        onChange({
          ...event,
          target: {
            ...event.target,
            value: newValue
          }
        });
      }
    }, debounceMs);
    
    setDebounceTimer(timer);
  }, [onChange, sanitize, validation, debounceMs, debounceTimer, props.name]);

  // Update local value when prop value changes
  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={handleChange}
      error={!!error}
      helperText={error || props.helperText}
      inputProps={{
        ...props.inputProps,
        // Add security attributes
        autoComplete: props.autoComplete || 'off',
        spellCheck: false,
        // Prevent autocomplete for sensitive fields
        ...(props.type === 'password' && {
          autoComplete: 'new-password'
        })
      }}
    />
  );
};

export default SecureInput;