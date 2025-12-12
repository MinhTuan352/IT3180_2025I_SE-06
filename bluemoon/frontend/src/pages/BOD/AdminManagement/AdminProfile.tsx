// src/pages/BOD/AdminManagement/AdminProfile.tsx
import {
  Box,
  Typography,
  Grid,
  Card,
  Avatar,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { useParams } from 'react-router-dom'; // --- THÊM MỚI ---
import { useState, useEffect } from 'react'; // --- THÊM MỚI ---

// (Giả lập dữ liệu, sau này bạn sẽ thay bằng API call)
const mockData = {
  'ID0001': {
    fullName: 'Nguyễn Văn A',
    dob: '1990-01-01',
    gender: 'Nam',
    cccd: '012345678901',
    phone: '0900000001',
    email: 'admin.a@bluemoon.com',
    role: 1, // ID của BQT
    username: 'admin.a',
  },
  'ID0002': {
    fullName: 'Nguyễn Văn B',
    dob: '1992-05-10',
    gender: 'Nam',
    cccd: '012345678902',
    phone: '0900000002',
    email: 'ketoan.b@bluemoon.com',
    role: 2, // ID của Kế toán
    username: 'ketoan.b',
  },
  // ... (thêm data cho các ID khác)
};

export default function AdminProfile() {
  // --- THÊM MỚI: Lấy ID từ URL ---
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);

  // --- THÊM MỚI: Giả lập việc fetch data ---
  useEffect(() => {
    if (id && (mockData as any)[id]) {
      setUserData((mockData as any)[id]);
    }
    // (Trong tương lai, bạn sẽ gọi API ở đây, ví dụ: adminApi.getById(id))
  }, [id]);

  const handleUpdateAdmin = () => {
    alert('Logic cập nhật tài khoản sẽ được thêm vào đây!');
  };

  if (!userData) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Đang tải thông tin...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Tiêu đề trang */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Hồ sơ Quản trị viên
      </Typography>

      <Grid container spacing={3}>
        {/* CỘT BÊN TRÁI: Avatar và ID */}
        <Grid size={{
          xs: 12,
          md: 4
        }}>
          <Card sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              {userData.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.username}
            </Typography>
          </Card>
        </Grid>

        {/* CỘT BÊN PHẢI: Form điền thông tin */}
        <Grid size={{
          xs: 12,
          md: 8
        }}>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* (Các trường này được điền sẵn giá trị `defaultValue`) */}
              <Grid size={{
                xs: 12
              }}>
                <TextField label="Họ và tên" fullWidth defaultValue={userData.fullName} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField
                  label="Ngày sinh"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  defaultValue={userData.dob}
                />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select label="Giới tính" defaultValue={userData.gender}>
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                    <MenuItem value="Khác">Khác</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="CCCD" fullWidth defaultValue={userData.cccd} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="Số điện thoại" fullWidth defaultValue={userData.phone} />
              </Grid>
              <Grid size={{
                xs: 12
              }}>
                <TextField label="Email" type="email" fullWidth defaultValue={userData.email} />
              </Grid>

              <Grid size={{
                xs: 12
              }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  Thông tin tài khoản
                </Typography>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <FormControl fullWidth>
                  <InputLabel>Vai trò</InputLabel>
                  <Select label="Vai trò" defaultValue={userData.role}>
                    <MenuItem value={1}>BQT (Ban quản trị)</MenuItem>
                    <MenuItem value={2}>Kế toán</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField label="Username" fullWidth defaultValue={userData.username} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid size={{
                xs: 12,
                sm: 6
              }}>
                <TextField
                  label="Mật khẩu"
                  type="password"
                  fullWidth
                  helperText="Bỏ trống nếu không muốn thay đổi mật khẩu"
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Nút Cập nhật */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mt: 3
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpdateAdmin}
        >
          Cập nhật thông tin
        </Button>
      </Box>
    </Paper>
  );
}