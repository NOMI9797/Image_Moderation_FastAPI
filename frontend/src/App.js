import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import {
  Box, 
  Typography, 
  Button, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Container, 
  Grid, 
  Paper, 
  IconButton, 
  Tabs, 
  Tab, 
  Alert, 
  Snackbar, 
  Tooltip,
  Chip,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  CloudUpload, 
  Security, 
  VpnKey, 
  CheckCircle, 
  ErrorOutline, 
  ContentCopy, 
  Upload, 
  Delete,
  AdminPanelSettings,
  History
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import AdminPanel from './components/AdminPanel';
import UsageStats from './components/UsageStats';
import Layout from './components/Layout';
import TokenInput from './components/TokenInput';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001';

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4fc3f7',
    },
    secondary: {
      main: '#f06292',
    },
    background: {
      default: '#242b45',
      paper: '#1e2439',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#4fc3f7',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    subtitle1: {
      opacity: 0.8,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          boxShadow: '0 4px 14px 0 rgba(79, 195, 247, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      },
    },
  },
});

// Helper to determine progress bar color
const getProgressColor = (value) => {
  if (value < 0.4) return "low";
  if (value < 0.7) return "medium";
  return "high";
};

// Format categories for visualization
const formatDataForChart = (data, category) => {
  if (!data || !data[category]) return [];
  
  const categories = data[category];
  
  if (typeof categories === 'object') {
    return Object.entries(categories)
      .filter(([key, value]) => typeof value === 'number')  
      .map(([key, value]) => ({ name: key, value: parseFloat(value.toFixed(3)) }))
      .sort((a, b) => b.value - a.value) // Sort by value descending
      .slice(0, 10); // Take top 10 for readability
  }
  
  return [];
};

// Extract top probability features from all categories
const extractTopProbabilities = (contentAnalysis) => {
  if (!contentAnalysis) return [];

  const allProbs = [];

  // Extract probability values from nudity category
  if (contentAnalysis.nudity) {
    Object.entries(contentAnalysis.nudity)
      .filter(([key, value]) => typeof value === 'number' && key !== 'none' && !key.includes('context'))
      .forEach(([key, value]) => {
        allProbs.push({
          category: 'Nudity',
          feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value
        });
      });
  }

  // Extract weapon probabilities
  if (contentAnalysis.weapon && contentAnalysis.weapon.classes) {
    Object.entries(contentAnalysis.weapon.classes)
      .filter(([key, value]) => typeof value === 'number')
      .forEach(([key, value]) => {
        allProbs.push({
          category: 'Weapon',
          feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value
        });
      });
  }

  // Extract violence probability
  if (contentAnalysis.violence && typeof contentAnalysis.violence.prob === 'number') {
    allProbs.push({
      category: 'Violence',
      feature: 'Violence',
      value: contentAnalysis.violence.prob
    });
  }

  // Extract alcohol probability
  if (contentAnalysis.alcohol && typeof contentAnalysis.alcohol.prob === 'number') {
    allProbs.push({
      category: 'Alcohol',
      feature: 'Alcohol',
      value: contentAnalysis.alcohol.prob
    });
  }

  // Extract drug probability
  if (contentAnalysis.recreational_drug && typeof contentAnalysis.recreational_drug.prob === 'number') {
    allProbs.push({
      category: 'Drugs',
      feature: 'Recreational Drug',
      value: contentAnalysis.recreational_drug.prob
    });
  }

  // Extract offensive content probabilities
  if (contentAnalysis.offensive) {
    Object.entries(contentAnalysis.offensive)
      .filter(([key, value]) => typeof value === 'number')
      .forEach(([key, value]) => {
        allProbs.push({
          category: 'Offensive',
          feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value
        });
      });
  }

  // Extract gore probability
  if (contentAnalysis.gore && typeof contentAnalysis.gore.prob === 'number') {
    allProbs.push({
      category: 'Gore',
      feature: 'Gore Content',
      value: contentAnalysis.gore.prob
    });
    
    // Also extract gore classes if available
    if (contentAnalysis.gore.classes) {
      Object.entries(contentAnalysis.gore.classes)
        .filter(([key, value]) => typeof value === 'number')
        .forEach(([key, value]) => {
          allProbs.push({
            category: 'Gore',
            feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: value
          });
        });
    }
  }

  // Extract tobacco probability
  if (contentAnalysis.tobacco && typeof contentAnalysis.tobacco.prob === 'number') {
    allProbs.push({
      category: 'Tobacco',
      feature: 'Tobacco',
      value: contentAnalysis.tobacco.prob
    });
  }

  // Extract self-harm probability
  if (contentAnalysis['self-harm'] && typeof contentAnalysis['self-harm'].prob === 'number') {
    allProbs.push({
      category: 'Self-Harm',
      feature: 'Self-Harm',
      value: contentAnalysis['self-harm'].prob
    });
  }

  // Sort by value in descending order and take the top ones
  return allProbs.sort((a, b) => b.value - a.value);
};

function App() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [newToken, setNewToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [mainTab, setMainTab] = useState(0); // Main tabs (Moderation/Admin)
  const [adminTab, setAdminTab] = useState(0); // Admin panel tabs (Tokens/Usage)
  const fileInputRef = useRef(null);

  const handleTokenChange = (e) => setToken(e.target.value);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleFileDelete = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleIsAdminChange = (e) => setIsAdmin(e.target.checked);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleMainTabChange = (event, newValue) => {
    setMainTab(newValue);
    
    // Reset sub-tabs when switching main tabs
    if (newValue === 0) {
      setActiveTab(0);
    } else if (newValue === 1) {
      setAdminTab(0);
    }
  };
  
  const handleAdminTabChange = (event, newValue) => {
    setAdminTab(newValue);
  };
  
  const copyToken = () => {
    navigator.clipboard.writeText(newToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };
  
  const useCurrentToken = () => {
    setToken(newToken);
    setNewToken('');
  };

  const createToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/tokens`, {
        isAdmin: isAdmin
      });
      setNewToken(response.data.token);
      setError(null);
    } catch (err) {
      console.error('Error creating token:', err);
      setError(err.response?.data?.detail || 'Error creating token');
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
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Error uploading image');
      setResult(null);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    if (mainTab === 0) {
      // Image Moderation Tab
      return (
        <Box className="moderation-content">
          <Typography variant="h1" component="h1" align="center" sx={{ mb: 1 }}>
            Image Moderation
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
            Upload images to analyze content safety using advanced AI detection
          </Typography>
          
          <Grid container spacing={3}>
            {/* Token Generation Section */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper className="card" elevation={0}>
                  <Box className="card-header">
                    <Typography variant="h2">
                      <VpnKey sx={{ mr: 1, fontSize: 28, verticalAlign: 'middle' }} /> 
                      API Token
                    </Typography>
                  </Box>
                  
                  <Box className="card-content" sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAdmin}
                            onChange={handleIsAdminChange}
                            color="primary"
                          />
                        }
                        label="Admin Privileges"
                      />
                      
                      <Button 
                        onClick={createToken}
                        className="btn btn-primary"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Generate New Token
                      </Button>
                    </Box>
                    
                    {newToken && (
                      <motion.div 
                        className="fade-in"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500 }}>
                          Your API Token:
                        </Typography>
                        
                        <Box className="token-display" sx={{ 
                          p: 2, 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                          borderRadius: 1,
                          overflowX: 'auto',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                          mt: 1,
                          mb: 2,
                          position: 'relative',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}>
                          {showToken ? newToken : '•'.repeat(Math.min(newToken.length, 40))}
                          <Button 
                            size="small" 
                            onClick={() => setShowToken(!showToken)}
                            sx={{ 
                              position: 'absolute',
                              right: 8,
                              top: 8,
                              minWidth: 'auto', 
                              p: 0.5 
                            }}
                          >
                            {showToken ? 'Hide' : 'Show'}
                          </Button>
                        </Box>
                        
                        <Box className="token-actions" sx={{ display: 'flex', gap: 2 }}>
                          <Button 
                            variant="outlined" 
                            startIcon={<ContentCopy />} 
                            onClick={copyToken}
                          >
                            Copy
                          </Button>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={useCurrentToken}
                          >
                            Use This Token
                          </Button>
                        </Box>
                        
                        {tokenCopied && (
                          <Typography className="copied-indicator" sx={{ mt: 1, color: 'primary.main' }}>
                            Copied to clipboard!
                          </Typography>
                        )}
                      </motion.div>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
            
            {/* Image Upload Section */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Paper className="card" elevation={0}>
                  <Box className="card-header">
                    <Typography variant="h2">
                      <Security sx={{ mr: 1, fontSize: 28, verticalAlign: 'middle' }} />
                      Content Analysis
                    </Typography>
                  </Box>
                  
                  <Box className="card-content" sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                      <Box className="form-group" sx={{ mb: 3 }}>
                        <TokenInput
                          label="API Token"
                          value={token}
                          onChange={handleTokenChange}
                          helperText="Enter your API token to access the moderation service"
                          startAdornment={<VpnKey sx={{ color: 'action.active', mr: 1 }} />}
                        />
                      </Box>
                      
                      <Box className="file-input-wrapper" sx={{ 
                        border: '2px dashed rgba(79, 195, 247, 0.3)',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        mb: 3,
                        cursor: 'pointer',
                        minHeight: 180,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <input 
                          type="file" 
                          onChange={handleFileChange}
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" style={{ width: '100%', cursor: 'pointer' }}>
                          {!imagePreview ? (
                            <>
                              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                              <Typography variant="body1" sx={{ mb: 1 }}>Drag & drop or click to upload an image</Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Supports JPG, PNG, GIF up to 10MB
                              </Typography>
                            </>
                          ) : (
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '200px',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                              />
                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <IconButton onClick={handleFileDelete} color="error" size="small">
                                  <Delete />
                                </IconButton>
                                <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                                  {file?.name}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </label>
                      </Box>
                      
                      <Button
                        type="submit"
                        variant="contained"
                        className="btn btn-primary"
                        fullWidth
                        sx={{ py: 1.2 }}
                        disabled={!file || !token}
                        startIcon={<Upload />}
                      >
                        Analyze Image
                      </Button>
                    </form>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
            
            {/* Error Display */}
            {error && (
              <Grid item xs={12}>
                <Alert 
                  severity="error" 
                  variant="filled"
                  sx={{ mb: 3 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              </Grid>
            )}
            
            {/* Results Display */}
            {result && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper className="card result-card" elevation={0}>
                    <Box className="status-indicator" sx={{ 
                      p: 2, 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: result.is_safe ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                    }}>
                      <Box 
                        className={`status-badge ${result.is_safe ? 'safe' : 'unsafe'}`}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: result.is_safe ? '#4caf50' : '#f44336',
                          fontWeight: 600
                        }}
                      >
                        {result.is_safe ? (
                          <CheckCircle />
                        ) : (
                          <ErrorOutline />
                        )}
                        <span>{result.message}</span>
                      </Box>
                    </Box>
                    
                    <Box className="result-details" sx={{ p: 3 }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        centered
                        sx={{ mb: 3 }}
                      >
                        <Tab label="Summary" />
                        <Tab label="Detailed Analysis" />
                        {result.details.content_analysis && <Tab label="Charts" />}
                      </Tabs>
                      
                      {/* Summary Tab */}
                      {activeTab === 0 && (
                        <Box className="tab-content">
                          {result.details.violations && result.details.violations.length > 0 ? (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Content Violations
                              </Typography>
                              
                              <Grid container spacing={1}>
                                {result.details.violations.map((violation, index) => (
                                  <Grid item key={index}>
                                    <Chip 
                                      label={violation} 
                                      color="error" 
                                      variant="outlined" 
                                    />
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          ) : (
                            <Alert severity="success" sx={{ mb: 3 }}>
                              No content violations detected
                            </Alert>
                          )}
                          
                          {/* Display top risk factors */}
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                              Top Risk Factors
                            </Typography>
                            
                            {result.details.content_analysis && (
                              <Box>
                                {extractTopProbabilities(result.details.content_analysis)
                                  .slice(0, 5) // Take only top 5 highest probabilities
                                  .map((item, index) => (
                                    <Box className="progress-container" sx={{ mb: 2 }} key={index}>
                                      <Box className="progress-label" sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        mb: 0.5
                                      }}>
                                        <Typography variant="body2">
                                          {item.category}: {item.feature}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {item.value.toFixed(3)}
                                        </Typography>
                                      </Box>
                                      <Box className="progress-bar" sx={{ 
                                        width: '100%', 
                                        height: 8, 
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 4,
                                        overflow: 'hidden'
                                      }}>
                                        <Box 
                                          className={`progress-fill ${getProgressColor(item.value)}`}
                                          sx={{ 
                                            height: '100%',
                                            backgroundColor: item.value < 0.4 ? '#4caf50' : 
                                                            item.value < 0.7 ? '#ff9800' : '#f44336',
                                            width: `${Math.min(item.value * 100, 100)}%`,
                                            borderRadius: 4
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Detailed Analysis Tab */}
                      {activeTab === 1 && (
                        <Box className="tab-content">
                          <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                            Request ID: {result.details.content_analysis.request?.id || 'N/A'}
                          </Typography>
                          
                          {/* Add a nice formatting for the JSON data */}
                          <Box 
                            component="pre" 
                            sx={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                              p: 2, 
                              borderRadius: 1, 
                              overflow: 'auto', 
                              fontSize: '0.875rem',
                              maxHeight: '400px'
                            }}
                          >
                            {JSON.stringify(result.details.content_analysis, null, 2)}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Charts Tab */}
                      {activeTab === 2 && result.details.content_analysis && (
                        <Box className="tab-content">
                          <Grid container spacing={4}>
                            {/* Nudity Chart */}
                            {result.details.content_analysis.nudity && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, mb: 2, height: 300 }} elevation={1}>
                                  <Typography variant="h6" gutterBottom>
                                    Nudity Analysis
                                  </Typography>
                                  <ResponsiveContainer width="100%" height="80%">
                                    <BarChart
                                      data={formatDataForChart(result.details.content_analysis, 'nudity')}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                    >
                                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                      <YAxis tickFormatter={(value) => value.toFixed(2)} domain={[0, 'dataMax + 0.1']} />
                                      <RechartsTooltip formatter={(value) => value.toFixed(3)} />
                                      <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Paper>
                              </Grid>
                            )}
                            
                            {/* Weapon Chart */}
                            {result.details.content_analysis.weapon && result.details.content_analysis.weapon.classes && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, mb: 2, height: 300 }} elevation={1}>
                                  <Typography variant="h6" gutterBottom>
                                    Weapon Detection
                                  </Typography>
                                  <ResponsiveContainer width="100%" height="80%">
                                    <BarChart
                                      data={formatDataForChart(result.details.content_analysis.weapon, 'classes')}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                    >
                                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                      <YAxis tickFormatter={(value) => value.toFixed(2)} domain={[0, 'dataMax + 0.1']} />
                                      <RechartsTooltip formatter={(value) => value.toFixed(3)} />
                                      <Bar dataKey="value" fill="#82ca9d" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Paper>
                              </Grid>
                            )}
                            
                            {/* Offensive Content Chart */}
                            {result.details.content_analysis.offensive && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, mb: 2, height: 300 }} elevation={1}>
                                  <Typography variant="h6" gutterBottom>
                                    Offensive Content
                                  </Typography>
                                  <ResponsiveContainer width="100%" height="80%">
                                    <BarChart
                                      data={formatDataForChart(result.details.content_analysis, 'offensive')}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                    >
                                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                      <YAxis tickFormatter={(value) => value.toFixed(2)} domain={[0, 'dataMax + 0.1']} />
                                      <RechartsTooltip formatter={(value) => value.toFixed(3)} />
                                      <Bar dataKey="value" fill="#ff8042" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Paper>
                              </Grid>
                            )}
                            
                            {/* Gore Content Chart */}
                            {result.details.content_analysis.gore && result.details.content_analysis.gore.classes && (
                              <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2, mb: 2, height: 300 }} elevation={1}>
                                  <Typography variant="h6" gutterBottom>
                                    Gore Content
                                  </Typography>
                                  <ResponsiveContainer width="100%" height="80%">
                                    <BarChart
                                      data={formatDataForChart(result.details.content_analysis.gore, 'classes')}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                    >
                                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                      <YAxis tickFormatter={(value) => value.toFixed(2)} domain={[0, 'dataMax + 0.1']} />
                                      <RechartsTooltip formatter={(value) => value.toFixed(3)} />
                                      <Bar dataKey="value" fill="#e57373" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Box>
      );
    } else {
      // Admin Panel Tab
      return (
        <Box className="admin-content">
          <Typography variant="h1" component="h1" align="center" sx={{ mb: 1 }}>
            Admin Control Panel
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
            Manage API tokens and monitor system usage
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper className="card" elevation={0}>
                <Box className="card-header">
                  <Typography variant="h2">
                    <VpnKey sx={{ mr: 1, fontSize: 28, verticalAlign: 'middle' }} /> 
                    Admin Authentication
                  </Typography>
                </Box>
                
                <Box className="card-content" sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Enter your admin token to manage all API tokens
                    </Typography>
                    <TokenInput
                      label="Admin Token"
                      value={token}
                      onChange={handleTokenChange}
                      helperText="Only tokens with admin privileges can access management features"
                      startAdornment={<AdminPanelSettings sx={{ color: 'action.active', mr: 1 }} />}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              {/* Admin Panel Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={adminTab} 
                  onChange={handleAdminTabChange}
                  aria-label="admin panel tabs"
                >
                  <Tab 
                    icon={<AdminPanelSettings />} 
                    label="TOKEN MANAGEMENT" 
                    id="tab-token-management"
                  />
                  <Tab 
                    icon={<History />} 
                    label="USAGE STATISTICS" 
                    id="tab-usage-stats"
                  />
                </Tabs>
              </Box>
              
              {/* Show token management or usage stats based on the active admin tab */}
              {adminTab === 0 ? (
                <AdminPanel token={token} />
              ) : (
                <UsageStats token={token} />
              )}
            </Grid>
          </Grid>
        </Box>
      );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Layout 
          activeTab={mainTab} 
          handleTabChange={handleMainTabChange}
          adminTab={adminTab}
          handleAdminTabChange={handleAdminTabChange}
        >
          {renderContent()}
        </Layout>
        
        <Snackbar
          open={tokenCopied}
          autoHideDuration={2000}
          onClose={() => setTokenCopied(false)}
          message="Token copied to clipboard"
        />
      </div>
    </ThemeProvider>
  );
}

export default App;