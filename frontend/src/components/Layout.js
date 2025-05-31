import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Security,
  AdminPanelSettings,
  VpnKey,
  History,
  BrokenImage,
  Dashboard
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for the sidebar
const SidebarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
}));

const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
    backgroundColor: '#1a2138',
    color: '#fff',
    borderRight: 'none',
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3),
  height: '64px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const SidebarLogo = styled('div')(({ theme }) => ({
  fontSize: 24,
  fontWeight: 700,
  color: '#4fc3f7',
  marginLeft: theme.spacing(2),
}));

const SidebarContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  flex: 1,
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  backgroundColor: '#242b45',
  minHeight: '100vh',
  overflow: 'auto',
}));

const SidebarFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

const Layout = ({ children, activeTab, handleTabChange, adminTab, handleAdminTabChange }) => {
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      value: 'dashboard',
      disabled: true,
    },
    {
      text: 'Image Moderation',
      icon: <Security />,
      value: 0,
    },
    {
      text: 'Admin Panel',
      icon: <AdminPanelSettings />,
      value: 1,
    },
    {
      text: 'Token Management',
      icon: <VpnKey />,
      value: 0, // This is the adminTab value for Token Management
      subMenu: true,
      parent: 1,
    },
    {
      text: 'Usage Statistics',
      icon: <History />,
      value: 1, // This is the adminTab value for Usage Statistics
      subMenu: true,
      parent: 1,
    },
  ];

  // Handle submenu clicks
  const handleSubMenuClick = (item) => {
    // If already on the parent tab, just switch the sub-tab
    if (activeTab === item.parent) {
      handleAdminTabChange(null, item.value);
    } else {
      // First navigate to the parent tab, then set the sub-tab
      handleTabChange(null, item.parent);
      // Need to wait for the parent tab to be set before setting the child tab
      setTimeout(() => {
        handleAdminTabChange(null, item.value);
      }, 50);
    }
  };

  return (
    <SidebarContainer>
      <SidebarDrawer variant="permanent">
        <SidebarHeader>
          <BrokenImage sx={{ fontSize: 32, color: '#4fc3f7' }} />
          <SidebarLogo>ImgSafe</SidebarLogo>
        </SidebarHeader>
        
        <SidebarContent>
          <List>
            {menuItems.map((item) => (
              <React.Fragment key={item.text}>
                {!item.subMenu && (
                  <ListItem disablePadding>
                    <Tooltip title={item.disabled ? 'Coming soon' : ''} placement="right">
                      <ListItemButton
                        selected={activeTab === item.value}
                        onClick={() => !item.disabled && handleTabChange(null, item.value)}
                        sx={{
                          pl: 3,
                          py: 1.5,
                          height: '56px',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(79, 195, 247, 0.08)',
                            borderLeft: '4px solid #4fc3f7',
                            '&:hover': {
                              backgroundColor: 'rgba(79, 195, 247, 0.12)',
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          },
                          opacity: item.disabled ? 0.5 : 1,
                        }}
                      >
                        <ListItemIcon sx={{ color: activeTab === item.value ? '#4fc3f7' : '#fff', minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ 
                            fontSize: 14,
                            fontWeight: activeTab === item.value ? 600 : 400
                          }} 
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                )}
                
                {item.subMenu && activeTab === item.parent && (
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={adminTab === item.value}
                      onClick={() => handleSubMenuClick(item)}
                      sx={{
                        pl: 5,
                        py: 1.2,
                        height: '48px',
                        backgroundColor: adminTab === item.value ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                        borderLeft: adminTab === item.value ? '4px solid #4fc3f7' : 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(79, 195, 247, 0.08)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: adminTab === item.value ? '#4fc3f7' : '#fff', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontSize: 13,
                          fontWeight: adminTab === item.value ? 600 : 400
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </React.Fragment>
            ))}
          </List>
          
          <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <List>
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  pl: 3,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
                  <VpnKey />
                </ListItemIcon>
                <ListItemText 
                  primary="API Documentation" 
                  primaryTypographyProps={{ 
                    fontSize: 14
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </List>
        </SidebarContent>
        
        <SidebarFooter>
          <Box display="flex" alignItems="center">
            <Avatar
              sx={{ 
                width: 42, 
                height: 42,
                backgroundColor: '#4fc3f7',
                color: '#fff'
              }}
            >
              AI
            </Avatar>
            <Box ml={2}>
              <Typography variant="body2" fontWeight={600}>
                Image Moderation API
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                v1.0.0
              </Typography>
            </Box>
          </Box>
        </SidebarFooter>
      </SidebarDrawer>
      
      <MainContent>
        {children}
      </MainContent>
    </SidebarContainer>
  );
};

export default Layout; 