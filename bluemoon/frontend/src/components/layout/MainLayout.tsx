// src/components/layout/MainLayout.tsx
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton, // --- THÊM MỚI ---
  Avatar, // --- THÊM MỚI ---
  Menu, // --- THÊM MỚI ---
  MenuItem, // --- THÊM MỚI ---
  InputBase, // --- THÊM MỚI ---
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react'; // --- THÊM MỚI ---
import { alpha } from '@mui/material/styles'; // --- THÊM MỚI ---
import { useAuth } from '../../contexts/AuthContext'; // --- THÊM MỚI ---
import { LayoutContext } from '../../contexts/LayoutContext';
import SettingsIcon from '@mui/icons-material/Settings';

// --- THÊM MỚI CÁC ICON ---
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';

// Import icons cho sidebar
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // For Profile/Account
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // For Account Info
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'; // <-- Import icon mới
import ApartmentIcon from '@mui/icons-material/Apartment';
import SecurityIcon from '@mui/icons-material/Security';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChatButton from '../Chatbot/ChatButton';
import ChatWindow from '../Chatbot/ChatWindow';
//import HistoryIcon from '@mui/icons-material/History';
//import SettingsIcon from '@mui/icons-material/Settings';
//import PaymentIcon from '@mui/icons-material/Payment'; // For Fee Payment

import sidebarBackground from '../../assets/bluemoon-background.jpg';
//import { theme } from '../../theme/theme';

const drawerWidth = 240; // Chiều rộng của Sidebar
const collapsedWidth = 72; // Chiều rộng khi thu gọn

// Danh sách menu [cite: 8]
const bodMenuItems = [
  { text: 'Thông tin', icon: <ApartmentIcon />, path: '/building-info' },
  { text: 'QTV', icon: <AdminPanelSettingsIcon />, path: '/bod/admin/list' }, // 
  { text: 'Cư dân', icon: <PeopleIcon />, path: '/bod/resident/list' }, // [cite: 28]
  { text: 'Quản lý Đăng nhập', icon: <ManageAccountsIcon />, path: '/bod/login-management' }, 
  { text: 'Quản lý Ra vào', icon: <SecurityIcon />, path: '/bod/access-control' },
  { text: 'Công nợ', icon: <ReceiptLongIcon />, path: '/bod/fee/list' }, // [cite: 45]
  { text: 'Tài sản', icon: <InventoryIcon />, path: '/bod/asset/list' },
  { text: 'Dịch vụ', icon: <StorefrontIcon />, path: '/bod/service/list' },
  { text: 'Thông báo', icon: <NotificationsIcon />, path: '/bod/notification/list' }, // [cite: 47]
  { text: 'Sự cố', icon: <ReportProblemIcon />, path: '/bod/report/list' }, // [cite: 48]
];

const accountantMenuItems = [
  { text: 'Thông tin', icon: <ApartmentIcon />, path: '/building-info' },
  { text: 'Công nợ', icon: <ReceiptLongIcon />, path: '/accountance/fee/list' },
  { text: 'Thiết lập', icon: <SettingsIcon />, path: '/accountance/fee/setup' },
];

// --- THÊM MỚI: Resident Menu ---
const residentMenuItems = [
    // Redirect /resident/profile to /resident/profile/edit for simplicity
    { text: 'Thông tin', icon: <ApartmentIcon />, path: '/building-info' },
    { text: 'Thông tin Cá nhân', icon: <AccountCircleIcon />, path: '/resident/profile/edit' },
    { text: 'Tài khoản', icon: <VpnKeyIcon />, path: '/resident/account_info' },
    { text: 'Công nợ', icon: <ReceiptLongIcon />, path: '/resident/fee/list' },
    { text: 'Tài sản', icon: <InventoryIcon />, path: '/resident/asset/list' },
    { text: 'Dịch vụ', icon: <StorefrontIcon />, path: '/resident/service/list' },
    { text: 'Thông báo', icon: <NotificationsIcon />, path: '/resident/notification/list' },
    { text: 'Báo cáo Sự cố', icon: <ReportProblemIcon />, path: '/resident/report/list' }, // Link to list first
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để xác định trang active
  const { user, logout } = useAuth(); // --- THÊM MỚI --- (Cho Yêu cầu 3)
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- THÊM MỚI --- (State cho Yêu cầu 2: Toggle Sidebar)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dynamicWidth = isCollapsed ? collapsedWidth : drawerWidth;

  // --- THÊM MỚI --- (State cho Yêu cầu 3: Menu Avatar)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const [openChangePassModal, setOpenChangePassModal] = useState(false);

  // --- State quản lý hiển thị mật khẩu ---
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // --- CẬP NHẬT: Quyết định menu nào sẽ hiển thị ---
  const menuItems = useMemo(() => {
    switch (user?.role) {
      case 'bod':
        return bodMenuItems;
      case 'accountance':
        return accountantMenuItems;
      case 'resident': // <-- THÊM CASE NÀY
        return residentMenuItems;
      default:
        return []; // Hoặc menu mặc định cho resident
    }
  }, [user?.role]);
  
  // --- THÊM MỚI --- (Handlers)
  const handleSidebarToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateToAccountInfo = () => {
    handleMenuClose();
    navigate('/account/info'); // Chuyển sang trang Thông tin tài khoản mới
  };

  const handleOpenChangePass = () => {
    handleMenuClose();
    // Reset trạng thái khi mở modal
    setShowOldPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setOpenChangePassModal(true);
  };

  const handleChangePassSubmit = () => {
    // Logic đổi mật khẩu giả lập
    alert("Đã gửi yêu cầu đổi mật khẩu thành công!");
    setOpenChangePassModal(false);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/signin');
  };

  // --- Hàm xử lý ẩn/hiện mật khẩu ---
  const handleClickShowPassword = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((show) => !show);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Ngăn focus khỏi input khi nhấn icon
  };

  return (
  <LayoutContext.Provider value={{ isSidebarCollapsed: isCollapsed }}>
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* 1. Header (CẬP NHẬT) */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#004E7A', // Màu xanh đậm
          zIndex: (theme) => theme.zIndex.drawer + 1, // Luôn nằm trên Sidebar
        }}
      >
        <Toolbar>
          {/* --- THÊM MỚI --- (Yêu cầu 2: Nút Toggle) */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* --- CẬP NHẬT --- (Yêu cầu 6: Đổi Font) */}
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              fontFamily: '"ITCBenguiat"',
              letterSpacing: '1px',
            }}
          >
            BLUEMOON
          </Typography>

          {/* --- THÊM MỚI --- (Spacer để đẩy sang phải) */}
          <Box sx={{ flexGrow: 1 }} />

          {/* --- THÊM MỚI --- (Yêu cầu 5: Search Bar) */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: '999px', // Bo tròn
              backgroundColor: alpha('#FFFFFF', 0.15),
              '&:hover': {
                backgroundColor: alpha('#FFFFFF', 0.25),
              },
              marginLeft: 3,
              marginRight: 3,
              width: 'auto',
            }}
          >
            <Box
              sx={{
                padding: (theme) => theme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon />
            </Box>
            <InputBase
              placeholder="Tìm kiếm..."
              inputProps={{ 'aria-label': 'search' }}
              sx={{
                color: 'inherit',
                '& .MuiInputBase-input': {
                  padding: (theme) => theme.spacing(1, 1, 1, 0),
                  paddingLeft: (theme) => `calc(1em + ${theme.spacing(4)})`,
                  width: '300px', // Tăng chiều rộng
                },
              }}
            />
          </Box>

          

          {/* --- THÊM MỚI --- (Yêu cầu 3: Avatar Dropdown) */}
          <Box>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 2 }}>
              <Avatar alt={user?.username} src="/static/images/avatar/2.jpg" sx={{ border: '2px solid white' }} />
            </IconButton>
            
            {/* Dropdown Menu tùy chỉnh */}
            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  minWidth: 220,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* Header của Menu */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  Chào mừng, {user?.username || 'Admin'}!
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  Vai trò: {user?.role?.toUpperCase()}
                </Typography>
              </Box>
              <Divider />
              
              {/* Các Item */}
              <MenuItem onClick={handleNavigateToAccountInfo} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Thông tin tài khoản
              </MenuItem>
              
              <MenuItem onClick={handleOpenChangePass} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <VpnKeyIcon fontSize="small" />
                </ListItemIcon>
                Đổi mật khẩu
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>

        </Toolbar>
      </AppBar>

      {/* 2. Sidebar (CẬP NHẬT) */}
      <Drawer
        variant="permanent" // Luôn hiển thị
        sx={{
          width: dynamicWidth, // --- CẬP NHẬT --- (Yêu cầu 2)
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width', { // --- THÊM MỚI ---
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),

          [`& .MuiDrawer-paper`]: {
            width: dynamicWidth, // --- CẬP NHẬT --- (Yêu cầu 2)
            boxSizing: 'border-box',
            backgroundColor: 'transparent',
            borderRight: 'none',
            overflowX: 'hidden', // --- THÊM MỚI --- (Quan trọng khi thu gọn)

            transition: (theme) => theme.transitions.create('width', { // --- THÊM MỚI ---
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            
            // --- THÊM MỚI --- (Yêu cầu 1: Ảnh chìm)
            //position: 'relative', // Bật nếu dùng pseudo-element
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `linear-gradient(rgba(72, 72, 72, 0.8), rgba(72, 72, 72, 0.8)), url(${sidebarBackground})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom center',
              backgroundSize: 'cover',
              //opacity: 0.5,
              zIndex: -1,
            }
          },
        }}
      >
        <Toolbar /> {/* Thêm khoảng trống đúng bằng Header */}
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {menuItems.map((item) => {
              // Kiểm tra xem path hiện tại có active không
              const isActive = location.pathname.startsWith(item.path); 
              
              return (
                <ListItem key={item.text} disablePadding sx={{ px: 2, mb: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    selected={isActive} // Đánh dấu active
                    sx={{
                      borderRadius: '8px',
                      justifyContent: isCollapsed ? 'center' : 'initial',
                      color: '#ffffff',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',

                      '& .MuiSvgIcon-root': {
                        color: '#ffffff',
                      },

                      // Style cho nút active
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main', // Màu xanh
                        color: 'primary.contrastText', // Chữ trắng
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText', // Icon trắng
                        }
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      minWidth: 40,
                      justifyContent: 'center', // --- THÊM MỚI ---
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {/* --- CẬP NHẬT --- (Ẩn text khi thu gọn) */}
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ fontWeight: 'bold' }} 
                      sx={{ 
                        display: isCollapsed ? 'none' : 'block',
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : 'auto',
                        transition: (theme) => theme.transitions.create(['opacity', 'width'], {
                          easing: theme.transitions.easing.sharp,
                          duration: theme.transitions.duration.enteringScreen,
                        })
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* 3. Vùng nội dung chính (CẬP NHẬT) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: 'background.default',
          minHeight: '100vh',
          // --- CẬP NHẬT --- (Yêu cầu 2: Điều chỉnh width)
          width: `calc(100% - ${dynamicWidth}px)`,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          minWidth: 0,
        }}
      >
        <Toolbar /> {/* Thêm khoảng trống bằng Header */}

        {/* Đây là nơi AdminList.tsx sẽ được render */}
        <Outlet />
      </Box>

      {/* 4. Modal Đổi Mật Khẩu (CẬP NHẬT: Thêm icon ẩn/hiện) */}
      <Dialog open={openChangePassModal} onClose={() => setOpenChangePassModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Đổi Mật Khẩu</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Mật khẩu cũ */}
            <TextField 
              label="Mật khẩu cũ" 
              type={showOldPass ? 'text' : 'password'} 
              fullWidth 
              variant="outlined" 
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handleClickShowPassword(setShowOldPass)}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showOldPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {/* Mật khẩu mới */}
            <TextField 
              label="Mật khẩu mới" 
              type={showNewPass ? 'text' : 'password'} 
              fullWidth 
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handleClickShowPassword(setShowNewPass)}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showNewPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {/* Nhập lại mật khẩu mới */}
            <TextField 
              label="Nhập lại mật khẩu mới" 
              type={showConfirmPass ? 'text' : 'password'} 
              fullWidth 
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => handleClickShowPassword(setShowConfirmPass)}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button onClick={() => setOpenChangePassModal(false)} color="inherit" variant="outlined" sx={{ width: '40%' }}>
            Hủy
          </Button>
          <Button onClick={handleChangePassSubmit} variant="contained" sx={{ width: '40%' }}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* CHATBOT WIDGET (Chỉ hiện cho Resident hoặc tất cả tùy bạn) */}
      {user?.role === 'resident' && (
        <>
          <ChatWindow isOpen={isChatOpen} />
          <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
        </>
      )}
    </Box>
  </LayoutContext.Provider>  
    
  );
}