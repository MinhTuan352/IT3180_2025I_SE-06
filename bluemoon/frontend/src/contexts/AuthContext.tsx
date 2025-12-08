// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react'; //useEffect

// Định nghĩa kiểu dữ liệu cho User (sau này bạn sẽ mở rộng)
export interface User {
  id: string;
  username: string;
  role: 'bod' | 'accountance' | 'resident' | 'cqcn'; // Dựa trên cấu trúc của bạn
}

// Định nghĩa những gì Context sẽ cung cấp
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider (component "bọc")
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Lấy thông tin user từ localStorage nếu có
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    // Lấy token từ localStorage nếu có
    return localStorage.getItem('token');
  });

  const isAuthenticated = !!token; // Nếu có token là đã đăng nhập

  // Hàm login
  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  // Hàm logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // (Bạn sẽ thêm điều hướng về /signin ở đây sau)
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// Tạo custom hook (để dễ sử dụng)
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}