import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Chip,
  ButtonGroup,
  Badge,
  Tooltip
} from '@mui/material';
import { Delete, AdminPanelSettings, PersonOutline, History, BarChart } from '@mui/icons-material';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001';

const AdminPanel = ({ token }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tokenToDelete: null });
  const [successMessage, setSuccessMessage] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [usageDialog, setUsageDialog] = useState({ open: false, tokenId: null, tokenType: '' });
  const [tokenUsageCounts, setTokenUsageCounts] = useState({});
  const [loadingUsageCounts, setLoadingUsageCounts] = useState(false);

  // Load tokens from API
  const loadTokens = async () => {
    if (!token) {
      setError("Admin token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/auth/tokens`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTokens(response.data);
      setLoading(false);
      
      // After loading tokens, fetch usage counts for each
      fetchUsageCountsForTokens(response.data);
    } catch (err) {
      console.error("Error loading tokens:", err);
      setError(err.response?.data?.detail || "Failed to load tokens. Ensure you're using an admin token.");
      setLoading(false);
    }
  };

  // Fetch usage counts for all tokens
  const fetchUsageCountsForTokens = async (tokensList) => {
    if (!token || !tokensList.length) return;
    
    setLoadingUsageCounts(true);
    
    try {
      const countsObj = {};
      
      // Create an array of promises for all API calls
      const promises = tokensList.map(tokenItem => 
        axios.get(`${API_URL}/api/auth/usage/token/${tokenItem.token}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );
      
      // Execute all promises concurrently
      const results = await Promise.allSettled(promises);
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const tokenId = tokensList[index].token;
          countsObj[tokenId] = result.value.data.length;
        } else {
          console.error(`Failed to fetch usage for token: ${tokensList[index].token}`);
        }
      });
      
      setTokenUsageCounts(countsObj);
    } catch (err) {
      console.error("Error fetching usage counts:", err);
    } finally {
      setLoadingUsageCounts(false);
    }
  };

  // Delete a token
  const deleteToken = async (tokenToDelete) => {
    if (!token) {
      setError("Admin token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/api/auth/tokens/${tokenToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove the deleted token from the state
      setTokens(tokens.filter(t => t.token !== tokenToDelete));
      setSuccessMessage("Token deleted successfully");
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error deleting token:", err);
      setError(err.response?.data?.detail || "Failed to delete token");
      setLoading(false);
    }
  };

  // Load usage data for a specific token
  const loadUsageForToken = async (tokenId) => {
    if (!token) {
      setError("Admin token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/auth/usage/token/${tokenId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUsageData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading usage data:", err);
      setError(err.response?.data?.detail || "Failed to load usage data");
      setLoading(false);
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteClick = (tokenToDelete) => {
    setDeleteDialog({ open: true, tokenToDelete });
  };

  // Handle closing delete confirmation dialog
  const handleCloseDialog = () => {
    setDeleteDialog({ open: false, tokenToDelete: null });
  };

  // Handle opening usage dialog
  const handleViewUsageClick = (tokenId, isAdmin) => {
    setUsageDialog({ 
      open: true, 
      tokenId, 
      tokenType: isAdmin ? 'Admin' : 'User' 
    });
    loadUsageForToken(tokenId);
  };

  // Handle closing usage dialog
  const handleCloseUsageDialog = () => {
    setUsageDialog({ open: false, tokenId: null, tokenType: '' });
    setUsageData([]);
  };

  // Confirm token deletion
  const confirmDelete = () => {
    if (deleteDialog.tokenToDelete) {
      deleteToken(deleteDialog.tokenToDelete);
      handleCloseDialog();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Load tokens on component mount or when token changes
  useEffect(() => {
    if (token) {
      loadTokens();
    }
  }, [token]);

  return (
    <Paper className="card admin-panel" elevation={0}>
      <Box className="card-header">
        <Typography variant="h2">
          <AdminPanelSettings sx={{ mr: 1, fontSize: 28, verticalAlign: 'middle' }} />
          Token Management
        </Typography>
      </Box>

      <Box className="card-content">
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={loadTokens}
            disabled={loading}
          >
            Refresh Tokens
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Usage Count</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.length > 0 ? (
                  tokens.map((tokenItem) => (
                    <TableRow key={tokenItem.token}>
                      <TableCell>
                        <Box sx={{ 
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {tokenItem.token}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {tokenItem.isAdmin ? (
                          <Chip 
                            icon={<AdminPanelSettings />} 
                            label="Admin" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ) : (
                          <Chip 
                            icon={<PersonOutline />} 
                            label="User" 
                            color="default" 
                            variant="outlined" 
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(tokenItem.createdAt)}</TableCell>
                      <TableCell>
                        {loadingUsageCounts ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Tooltip title="Total API calls made with this token">
                            <Chip
                              icon={<BarChart />}
                              label={tokenUsageCounts[tokenItem.token] || 0}
                              color={tokenUsageCounts[tokenItem.token] > 0 ? "success" : "default"}
                              size="small"
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <ButtonGroup size="small" variant="outlined">
                          <Button
                            color="primary"
                            startIcon={<History />}
                            onClick={() => handleViewUsageClick(tokenItem.token, tokenItem.isAdmin)}
                          >
                            Usage
                          </Button>
                          <Button
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteClick(tokenItem.token)}
                          >
                            Delete
                          </Button>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No tokens found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Token</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this token? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog
        open={usageDialog.open}
        onClose={handleCloseUsageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Token Usage History
          {usageDialog.tokenType && (
            <Chip 
              label={usageDialog.tokenType}
              color={usageDialog.tokenType === 'Admin' ? 'primary' : 'default'}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                Token: {usageDialog.tokenId}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<BarChart />}
                  label={`Total Usage: ${usageData.length}`}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              {usageData.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usageData
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((usage, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={usage.endpoint} 
                                size="small"
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell>{formatDate(usage.timestamp)}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography>No usage data found for this token.</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsageDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminPanel; 