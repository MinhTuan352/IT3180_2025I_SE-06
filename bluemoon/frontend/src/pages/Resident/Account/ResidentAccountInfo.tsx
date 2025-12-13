// src/pages/Resident/Account/ResidentAccountInfo.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  //Alert, // <-- Thêm Alert để hiển thị thông báo
  CircularProgress, // <-- Thêm Loading
  InputAdornment, // <-- Thêm để hiện/ẩn mật khẩu
  IconButton, // <-- Thêm để hiện/ẩn mật khẩu
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext'; // <-- Lấy user hiện tại
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form'; // <-- Dùng React Hook Form
import { zodResolver } from '@hookform/resolvers/zod'; // <-- Dùng Zod
import { z } from 'zod'; // <-- Dùng Zod
import { useMutation } from '@tanstack/react-query'; // <-- Dùng React Query
import axiosClient from '../../../api/axiosClient'; // <-- Import axiosClient trực tiếp (hoặc tạo hàm trong authApi)
import Visibility from '@mui/icons-material/Visibility'; // <-- Icon hiện MK
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // <-- Icon ẩn MK
import toast, { Toaster } from 'react-hot-toast'; // <-- Thêm Toast

// --- Schema Validation bằng Zod ---
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu cũ là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"], // Gắn lỗi vào trường confirmPassword
});

type ChangePasswordFormInputs = z.infer<typeof changePasswordSchema>;

export default function ResidentAccountInfo() {
  const { user } = useAuth(); // Lấy thông tin user đang đăng nhập
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    reset, // <-- Thêm reset để xóa form sau khi thành công
    formState: { errors },
  } = useForm<ChangePasswordFormInputs>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // --- React Query Mutation ---
  const mutation = useMutation({
    mutationFn: (data: Omit<ChangePasswordFormInputs, 'confirmPassword'>) => {
      // Gọi API POST /api/auth/change-password
      return axiosClient.post('/auth/change-password', data);
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      reset(); // Xóa các trường input
    },
    onError: (error: any) => {
      // Hiển thị lỗi cụ thể từ backend nếu có
      const message = error.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      toast.error(message);
    },
  });

  // --- Submit Handler ---
  const onSubmit = (data: ChangePasswordFormInputs) => {
    // Chỉ gửi oldPassword và newPassword lên API
    const { confirmPassword, ...apiData } = data;
    mutation.mutate(apiData);
  };

  const onInvalid = () => {
    console.error('Validation Lỗi:', errors);
  }

  // --- Toggle Password Visibility ---
  const handleClickShowPassword = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter((show) => !show);
  };
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Ngăn không bị focus khi nhấn icon
  };


  return (
    <>
      <Toaster position="top-right" /> {/* Component hiển thị Toast */}
      <Paper sx={{ p: 3, maxWidth: 600, margin: 'auto', borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
          Thông tin Tài khoản
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <Grid container spacing={3}>
            {/* Tên đăng nhập */}
            <Grid size={12}>
              <TextField
                label="Tên đăng nhập (Username)"
                fullWidth
                value={user?.username || ''} // Hiển thị username từ context
                InputProps={{ readOnly: true }} // Không cho sửa username
                variant="filled" // Kiểu hiển thị khác biệt
              />
            </Grid>

            {/* Phần đổi mật khẩu */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Đổi mật khẩu</Typography>
            </Grid>

            {/* Mật khẩu cũ */}
            <Grid size={12}>
              <Controller
                name="oldPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mật khẩu cũ"
                    type={showOldPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    error={!!errors.oldPassword}
                    helperText={errors.oldPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword(setShowOldPassword)}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Mật khẩu mới */}
            <Grid size={12}>
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mật khẩu mới"
                    type={showNewPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword(setShowNewPassword)}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Xác nhận mật khẩu mới */}
            <Grid size={12}>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Xác nhận mật khẩu mới"
                    type={showConfirmPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword(setShowConfirmPassword)}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Nút Submit */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={mutation.isPending} // Disable khi đang gọi API
            >
              {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Lưu Thay Đổi Mật khẩu'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
}