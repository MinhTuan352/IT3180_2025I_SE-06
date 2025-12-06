// src/pages/BOD/ResidentManagement/ResidentApartmentDetail.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  //ListItemAvatar,
  ListItemText,
  //ListItemIcon,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';

// Mock Data cho chi tiết căn hộ
const mockApartmentDetail = {
  id: 'A-101',
  floor: 10,
  block: 'A',
  status: 'Đã có người',
  area: '98m2',
  handoverDate: '20/10/2018',
  members: [
    { id: 'R0001', name: 'Trần Văn Hộ', role: 'Chủ hộ', phone: '0901234567', gender: 'Nam', dob: '1980-01-01' },
    { id: 'R0002', name: 'Nguyễn Thị Thành Viên', role: 'Vợ/Chồng', phone: '0909876543', gender: 'Nữ', dob: '1985-05-05' },
  ]
};

export default function ResidentApartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // (Thực tế bạn sẽ fetch API dựa vào `id`)
  const apartment = mockApartmentDetail; 

  return (
    <Box>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/bod/resident/lookup')}
        sx={{ mb: 3 }}
      >
        Quay lại sơ đồ
      </Button>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">Căn hộ {id}</Typography>
              <Typography variant="body1" color="text.secondary">
                Tòa {apartment.block} - Tầng {apartment.floor}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={apartment.status} 
            color="success" 
            sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2, px: 1 }} 
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Thông tin cơ bản */}
          <Grid sx={{xs: 12, md: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Thông tin Căn hộ</Typography>
            <List>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Diện tích" secondary={apartment.area} />
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Ngày bàn giao" secondary={apartment.handoverDate} />
              </ListItem>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText primary="Số lượng cư dân" secondary={`${apartment.members.length} người`} />
              </ListItem>
            </List>
          </Grid>

          {/* Danh sách thành viên */}
          <Grid sx={{xs: 12, md: 8}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Danh sách Cư dân</Typography>
                <Button variant="outlined" startIcon={<EditIcon />}>Cập nhật Cư dân</Button>
            </Box>
            
            <Grid container spacing={2}>
              {apartment.members.map((member) => (
                <Grid sx={{xs: 12}} key={member.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover': { bgcolor: '#f5f5f5', cursor: 'pointer' }
                    }}
                    onClick={() => navigate(`/bod/resident/profile/${member.id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: member.role === 'Chủ hộ' ? 'primary.main' : 'secondary.main', mr: 2 }}>
                            <PersonIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{member.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {member.role} • {member.gender} • {member.dob}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">{member.phone}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}