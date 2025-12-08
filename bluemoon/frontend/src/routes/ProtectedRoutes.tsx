// src/routes/ProtectedRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// (Tùy chọn) Thêm prop để kiểm tra vai trò
interface ProtectedRoutesProps {
  allowedRoles?: ('bod' | 'accountance' | 'resident' | 'cqcn')[];
}

export default function ProtectedRoutes({ allowedRoles }: ProtectedRoutesProps) {
  const { isAuthenticated, user } = useAuth();

  // 1. Kiểm tra đăng nhập
  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, đá về /signin
    return <Navigate to="/signin" replace />;
  }

  // 2. (Nâng cao) Kiểm tra phân quyền
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Nếu đã đăng nhập nhưng sai vai trò, đá về trang 403 (Chưa tạo)
    // Tạm thời đá về trang chủ
    return <Navigate to="/" replace />;
  }

  // Nếu mọi thứ OK, cho phép render trang con (Layout)
  return <Outlet />;
}