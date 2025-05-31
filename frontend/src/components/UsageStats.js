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
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  TextField
} from '@mui/material';
import { 
  History, 
  BarChart as BarChartIcon, 
  Timeline,
  VpnKey
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const UsageStats = ({ token }) => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Load usage data
  const loadUsageData = async () => {
    if (!token) {
      setError("Admin token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get usage for current token if not admin
      const response = await axios.get(`${API_URL}/api/auth/usage/my-usage`, {
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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format endpoint for display
  const formatEndpoint = (endpoint) => {
    // For token-specific endpoints, extract just the endpoint type and show a shorter token version
    if (endpoint.includes('/auth/usage/token/')) {
      const tokenId = endpoint.split('/').pop();
      return {
        main: '/auth/usage/token/',
        token: tokenId.length > 10 ? `${tokenId.substring(0, 8)}...` : tokenId,
        color: 'info' // blue color
      };
    } 
    else if (endpoint.includes('/auth/tokens/')) {
      const tokenId = endpoint.split('/').pop();
      return {
        main: '/auth/tokens/',
        token: tokenId.length > 10 ? `${tokenId.substring(0, 8)}...` : tokenId,
        color: 'warning' // orange color
      };
    }
    // For standard endpoints
    else if (endpoint === '/moderate') {
      return { 
        main: endpoint,
        token: null,
        color: 'success' // green color
      };
    }
    else if (endpoint === '/auth/tokens') {
      return { 
        main: endpoint,
        token: null,
        color: 'primary' // blue color
      };
    }
    else if (endpoint.includes('/auth/usage/my-usage')) {
      return { 
        main: endpoint,
        token: null,
        color: 'secondary' // purple color
      };
    }
    
    // Default case
    return { 
      main: endpoint,
      token: null,
      color: 'default' // gray color
    };
  };

  // Prepare data for endpoint distribution chart
  const prepareEndpointData = () => {
    const endpointCounts = {};
    
    usageData.forEach(usage => {
      // Format the endpoint for better readability
      let formattedEndpoint = usage.endpoint;
      
      // If it's a token-specific endpoint, extract just the endpoint type
      if (formattedEndpoint.includes('/auth/usage/token/')) {
        formattedEndpoint = '/auth/usage/token/*';
      } else if (formattedEndpoint.includes('/auth/tokens/')) {
        formattedEndpoint = '/auth/tokens/*';
      }
      
      if (endpointCounts[formattedEndpoint]) {
        endpointCounts[formattedEndpoint]++;
      } else {
        endpointCounts[formattedEndpoint] = 1;
      }
    });
    
    return Object.entries(endpointCounts).map(([name, value]) => ({ name, value }));
  };

  // Prepare data for usage over time chart
  const prepareTimeData = () => {
    // Group by day
    const dayUsage = {};
    
    usageData.forEach(usage => {
      const date = new Date(usage.timestamp);
      const day = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
      
      if (dayUsage[day]) {
        dayUsage[day]++;
      } else {
        dayUsage[day] = 1;
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(dayUsage)
      .map(([date, count]) => ({ 
        date, 
        count,
        // Add formatted date for display
        formattedDate: new Date(date).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Load usage data on component mount or when token changes
  useEffect(() => {
    if (token) {
      loadUsageData();
    }
  }, [token]);

  return (
    <Paper className="card usage-stats" elevation={0}>
      <Box className="card-header">
        <Typography variant="h2" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          height: '64px', // Match the height of the tabs
          m: 0
        }}>
          <History sx={{ mr: 1, fontSize: 28, verticalAlign: 'middle' }} />
          API Usage Statistics
        </Typography>
      </Box>

      <Box className="card-content">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={loadUsageData}
            disabled={loading}
          >
            Refresh Usage Data
          </Button>
        </Box>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          centered
          sx={{ mb: 3, minHeight: '48px' }}
        >
          <Tab icon={<History />} label="HISTORY" sx={{ height: '48px' }} />
          <Tab icon={<BarChartIcon />} label="ENDPOINTS" sx={{ height: '48px' }} />
          <Tab icon={<Timeline />} label="TRENDS" sx={{ height: '48px' }} />
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* History Tab */}
            {activeTab === 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageData.length > 0 ? (
                      // Sort by timestamp (newest first)
                      [...usageData]
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((usage, index) => {
                          const endpointInfo = formatEndpoint(usage.endpoint);
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    label={endpointInfo.main} 
                                    color={endpointInfo.color} 
                                    variant="outlined"
                                    size="small" 
                                  />
                                  {endpointInfo.token && (
                                    <Tooltip title={usage.endpoint.split('/').pop()}>
                                      <Chip
                                        label={endpointInfo.token}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{formatDate(usage.timestamp)}</TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No usage data found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {/* Endpoints Tab */}
            {activeTab === 1 && (
              <Box sx={{ height: 400 }}>
                {usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareEndpointData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => {
                          // Short version of the name for the label
                          const shortName = name.length > 20 ? 
                            `${name.substring(0, 17)}...` : name;
                          return `${shortName} (${(percent * 100).toFixed(0)}%)`;
                        }}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareEndpointData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => {
                          return [`${value} calls`, name];
                        }}
                      />
                      <Legend 
                        formatter={(value, entry, index) => {
                          return value.length > 25 ? `${value.substring(0, 22)}...` : value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1">No usage data available</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Trends Tab */}
            {activeTab === 2 && (
              <Box sx={{ height: 400 }}>
                {usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareTimeData()}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <XAxis 
                        dataKey="formattedDate" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        allowDecimals={false}
                        label={{ 
                          value: 'API Calls', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <RechartsTooltip 
                        formatter={(value, name) => [`${value} calls`, 'API Usage']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            // Find the original date from the data point
                            const dataPoint = prepareTimeData().find(item => item.formattedDate === label);
                            if (dataPoint) {
                              return new Date(dataPoint.date).toLocaleDateString(undefined, { 
                                weekday: 'long',
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            }
                          }
                          return label;
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        name="API Requests" 
                        fill="#4fc3f7" 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1">No usage data available</Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default UsageStats; 