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
  Tab
} from '@mui/material';
import { 
  History, 
  BarChart as BarChartIcon, 
  Timeline 
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

  // Prepare data for endpoint distribution chart
  const prepareEndpointData = () => {
    const endpointCounts = {};
    
    usageData.forEach(usage => {
      if (endpointCounts[usage.endpoint]) {
        endpointCounts[usage.endpoint]++;
      } else {
        endpointCounts[usage.endpoint] = 1;
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
      .map(([date, count]) => ({ date, count }))
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
        <Typography variant="h2">
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
          sx={{ mb: 3 }}
        >
          <Tab icon={<History />} label="HISTORY" />
          <Tab icon={<BarChartIcon />} label="ENDPOINTS" />
          <Tab icon={<Timeline />} label="TRENDS" />
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
                        .map((usage, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                label={usage.endpoint} 
                                color="primary" 
                                variant="outlined" 
                              />
                            </TableCell>
                            <TableCell>{formatDate(usage.timestamp)}</TableCell>
                          </TableRow>
                        ))
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
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prepareEndpointData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
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
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="count" name="API Requests" fill="#8884d8" />
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