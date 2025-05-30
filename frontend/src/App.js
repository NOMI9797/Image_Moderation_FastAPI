import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001';

function App() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [newToken, setNewToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleTokenChange = (e) => setToken(e.target.value);
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleIsAdminChange = (e) => setIsAdmin(e.target.checked);

  const createToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/tokens`, {
        isAdmin: isAdmin
      });
      setNewToken(response.data.token);
      setError(null);
    } catch (error) {
      console.error('Error creating token:', error);
      setError(error.response?.data?.detail || 'Error creating token');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first');
      return;
    }
    if (!token) {
      setError('Please enter a token');
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/moderate`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      setError(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.detail || 'Error uploading image');
      setResult(null);
    }
  };

  return (
    <div className="App">
      <div className="card">
        <h1>Image Moderation</h1>
        
        {/* Token Creation Section */}
        <div className="token-creation">
          <h2>Create New Token</h2>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="isAdmin"
              checked={isAdmin}
              onChange={handleIsAdminChange}
            />
            <label htmlFor="isAdmin">Admin Token</label>
          </div>
          <button onClick={createToken}>Create Token</button>
          {newToken && (
            <div className="new-token">
              <p>New Token: <code>{newToken}</code></p>
              <button onClick={() => {
                setToken(newToken);
                setNewToken('');
              }}>Use This Token</button>
            </div>
          )}
        </div>

        {/* Image Upload Section */}
        <div className="upload-section">
          <h2>Upload Image</h2>
          <input
            type="text"
            placeholder="Enter your token"
            value={token}
            onChange={handleTokenChange}
          />
          <input
            type="file"
            onChange={handleFileChange}
          />
          <button onClick={handleSubmit}>Upload and Moderate</button>
        </div>

        {error && <div className="error">{error}</div>}
        
        <div className="result">
          <h2>Result:</h2>
          {result && (
            <div>
              <p>Status: {result.is_safe ? 'Safe' : 'Unsafe'}</p>
              <p>Message: {result.message}</p>
              {result.details && (
                <div className="details">
                  <h3>Details:</h3>
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;