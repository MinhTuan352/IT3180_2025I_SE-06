// src/pages/Auth/SignIn.tsx
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
} from '@mui/material'; // thêm Alert
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
//import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/authApi';
import { type LoginFormInputs, loginSchema } from '../../schemas/auth.schema';

// Import ảnh nền (sửa đường dẫn nếu cần)
import backgroundImage from '../../assets/bluemoon-background.jpg'; // <-- Thay ảnh của bạn vào đây

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // === React Hook Form ===
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // === React Query Mutation ===
  const mutation = useMutation({
    mutationFn: (data: LoginFormInputs) => authApi.login(data),
    onSuccess: (data) => {
      // data trả về từ authApi.login (gồm token và user)
      toast.success('Đăng nhập thành công!');
      login(data.user, data.token); // Lưu vào Context

      // Điều hướng dựa trên vai trò backend trả về
      switch (data.user.role) {
        case 'bod':
          navigate('/bod/admin/list');
          break;
        case 'accountance':
          navigate('/accountance/fee/list');
          break;
        case 'resident':
          navigate('/resident/profile/edit');
          break;
        default:
          navigate('/'); // Trang chủ mặc định
      }
    },
    onError: (_error) => {
      // (Bạn có thể check error.response.data.message để có lỗi cụ thể)
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng.');
    },
  });

  // === Handlers ===
  const onSubmit = (data: LoginFormInputs) => {
    console.log('VALIDATION THÀNH CÔNG:', data);
    mutation.mutate(data); // Gửi data (username, password) lên server
  };

  const onInvalid = (errors: any) => {
    console.error('VALIDATION THẤT BẠI:', errors);
  };

  return (
    <>
      {/* Component để hiển thị thông báo */}
      <Toaster position="top-right" reverseOrder={false} />

      <Grid container
        component="main"
        sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* 1. Cột Ảnh (Bên trái) */}
        <Grid size={{
          xs: 0,
          sm: 4,
          md: 7
        }}

          sx={{
            backgroundImage: `url(${backgroundImage})`, // <-- Ảnh của bạn
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* 2. Cột Form (Bên phải) */}
        <Grid size={{
          xs: 12,
          sm: 8,
          md: 5
        }}

          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              maxWidth: 400,
            }}
          >
            {/* Logo */}
            <Typography
              component="h1"
              variant="h5"
              sx={{
                color: 'primary.main',
                fontWeight: 'bold'
              }}>
              WELCOME
            </Typography>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                color: 'primary.main',
                fontWeight: 'bold',
                mb: 3
              }}>
              BLUEMOON
            </Typography>

            {/* Form */}
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} sx={{ width: '100%' }}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    autoComplete="username"
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px'
                      }
                    }}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px'
                      }
                    }}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />

              <Link href="#" variant="body2" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                Quên mật khẩu?
              </Link>

              {/* Nút Đăng nhập */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
                mt: 3
              }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending}
                  sx={{
                    mb: 2,
                    py: 1,
                    px: 5,
                    borderRadius: 9999,
                    backgroundColor: '#0A4A9C',
                    '&:hover': {
                      backgroundColor: '#083B7E'
                    }
                  }}
                >
                  {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
                </Button>
              </Box>

            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}