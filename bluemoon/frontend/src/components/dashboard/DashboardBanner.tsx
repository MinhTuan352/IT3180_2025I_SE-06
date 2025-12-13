// Shared Dashboard Banner Component with Real-time Weather and Clock
// This component can be reused across all dashboard pages

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    Cloud as CloudIcon,
    WbSunny as SunnyIcon,
    Opacity as RainIcon,
    AcUnit as SnowIcon,
    Thunderstorm as ThunderstormIcon,
    Notifications as NotificationsIcon,
    Close as CloseIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Schedule as ScheduleIcon,
    Lightbulb as LightbulbIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';

// Weather data interface
interface WeatherData {
    temp: number;
    condition: string;
    icon: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
    location: string;
}

// Smart report insight interface
interface SmartInsight {
    id: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    description: string;
}

// Props interface
export interface DashboardBannerProps {
    userName: string;
    userRole?: string;
    pendingTasks?: number;
    unpaidInvoices?: number;
    overdueCount?: number;
    apartmentCode?: string;
    customSubtext?: React.ReactNode;
    actionButton?: React.ReactNode;
    insights?: SmartInsight[];
    onExportFinanceReport?: () => void;
}

// Format time to Vietnamese
const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

// Format date to Vietnamese
const formatDate = (date: Date): string => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const day = days[date.getDay()];
    return `${day}, ${date.toLocaleDateString('vi-VN')}`;
};

// Get time-based greeting
const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
};

// Get weather icon component
const getWeatherIcon = (icon: string) => {
    const iconStyle = { color: 'white !important', fontSize: 18 };
    switch (icon) {
        case 'sunny':
            return <SunnyIcon sx={iconStyle} />;
        case 'rainy':
            return <RainIcon sx={iconStyle} />;
        case 'snowy':
            return <SnowIcon sx={iconStyle} />;
        case 'stormy':
            return <ThunderstormIcon sx={iconStyle} />;
        default:
            return <CloudIcon sx={iconStyle} />;
    }
};

// Weather Hook
function useWeather() {
    const [weather, setWeather] = useState<WeatherData>({
        temp: 28,
        condition: 'Có mây',
        icon: 'cloudy',
        location: 'Hà Nội'
    });
    const [loading, setLoading] = useState(true);

    const fetchWeather = useCallback(async () => {
        try {
            // Using wttr.in free API (no API key required)
            const response = await fetch('https://wttr.in/Hanoi?format=%t|%C', {
                headers: { 'Accept': 'text/plain' }
            });

            if (response.ok) {
                const text = await response.text();
                const [temp, condition] = text.split('|');

                // Parse temperature (remove °C)
                const tempNum = parseInt(temp.replace(/[^0-9-]/g, '')) || 28;

                // Determine icon based on condition
                let icon: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' = 'cloudy';
                const condLower = condition.toLowerCase();
                if (condLower.includes('sun') || condLower.includes('clear')) icon = 'sunny';
                else if (condLower.includes('rain') || condLower.includes('shower')) icon = 'rainy';
                else if (condLower.includes('snow')) icon = 'snowy';
                else if (condLower.includes('thunder') || condLower.includes('storm')) icon = 'stormy';

                // Translate condition to Vietnamese
                let conditionVi = 'Có mây';
                if (icon === 'sunny') conditionVi = 'Nắng';
                else if (icon === 'rainy') conditionVi = 'Có mưa';
                else if (icon === 'snowy') conditionVi = 'Có tuyết';
                else if (icon === 'stormy') conditionVi = 'Giông bão';
                else if (condLower.includes('partly')) conditionVi = 'Ít mây';
                else if (condLower.includes('overcast')) conditionVi = 'U ám';

                setWeather({
                    temp: tempNum,
                    condition: conditionVi,
                    icon,
                    location: 'Hà Nội'
                });
            }
        } catch (error) {
            console.log('Weather fetch error, using default:', error);
            // Keep default values on error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
        // Refresh weather every 10 minutes
        const interval = setInterval(fetchWeather, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeather]);

    return { weather, loading };
}

// Real-time Clock Hook
function useRealTimeClock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return currentTime;
}

// Smart Report Modal Component
interface SmartReportModalProps {
    open: boolean;
    onClose: () => void;
    insights: SmartInsight[];
    userRole?: string;
}

function SmartReportModal({ open, onClose, insights, userRole: _userRole }: SmartReportModalProps) {
    const getInsightIcon = (type: SmartInsight['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'tip':
                return <LightbulbIcon sx={{ color: '#ff9800' }} />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                py: 2
            }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <NotificationsIcon />
                    <Typography variant="h6" fontWeight="bold">
                        Báo cáo thông minh
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {/* Summary Section */}
                <Box sx={{ p: 3, bgcolor: 'white' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                        <ScheduleIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                            Tổng quan hệ thống
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Hệ thống đã phân tích dữ liệu và đưa ra {insights.length} gợi ý để cải thiện hiệu quả công việc.
                    </Typography>
                </Box>

                <Divider />

                {/* Insights List */}
                {insights.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">
                            Không có cảnh báo nào. Hệ thống đang hoạt động tốt!
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ bgcolor: 'white' }}>
                        {insights.map((insight, index) => (
                            <Box key={insight.id}>
                                {index > 0 && <Divider variant="inset" component="li" />}
                                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                                    <ListItemIcon sx={{ mt: 0.5 }}>
                                        {getInsightIcon(insight.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {insight.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {insight.description}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            </Box>
                        ))}
                    </List>
                )}

                {/* Footer */}
                <Box sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

// Main Banner Component
export default function DashboardBanner({
    userName,
    userRole,
    pendingTasks,
    unpaidInvoices,
    overdueCount,
    apartmentCode,
    customSubtext,
    actionButton,
    insights = [],
    onExportFinanceReport
}: DashboardBannerProps) {
    const currentTime = useRealTimeClock();
    const { weather, loading: weatherLoading } = useWeather();
    const [smartReportOpen, setSmartReportOpen] = useState(false);
    const greeting = getTimeGreeting();

    // Generate role display name
    const getRoleDisplay = (role?: string) => {
        switch (role) {
            case 'bod': return 'Quản trị viên';
            case 'accountance': return 'Kế toán';
            case 'resident': return 'Cư dân';
            default: return '';
        }
    };

    const displayName = userName || getRoleDisplay(userRole);

    // Generate default subtext based on role
    const getDefaultSubtext = () => {
        if (customSubtext) return customSubtext;

        if (pendingTasks !== undefined) {
            return (
                <>
                    Hệ thống đã tự động sắp xếp ưu tiên cho bạn. Bạn có{' '}
                    <Box component="span" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {pendingTasks} công việc
                    </Box>{' '}
                    cần duyệt hôm nay.
                </>
            );
        }

        if (unpaidInvoices !== undefined) {
            return (
                <>
                    Bạn có{' '}
                    <Box component="span" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>
                        {unpaidInvoices} hóa đơn chưa thanh toán
                    </Box>
                    {overdueCount !== undefined && overdueCount > 0 && (
                        <> và {overdueCount} hóa đơn quá hạn cần xử lý</>
                    )}
                    .
                </>
            );
        }

        return 'Chào mừng bạn đến với hệ thống quản lý BlueMoon.';
    };

    return (
        <>
            <Card
                sx={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab3 100%)',
                    borderRadius: { xs: 2, sm: 4 },
                    overflow: 'hidden',
                    position: 'relative',
                    color: 'white',
                    mb: 3,
                    minHeight: { xs: 160, sm: 180 },
                }}
            >
                {/* City skyline decorative background */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: '50%',
                        height: '100%',
                        opacity: 0.3,
                        background: `
                            linear-gradient(to right, transparent 0%, rgba(30, 58, 95, 0.8) 100%),
                            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect x='20' y='80' width='40' height='120' fill='%23fff'/%3E%3Crect x='70' y='50' width='50' height='150' fill='%23fff'/%3E%3Crect x='130' y='100' width='35' height='100' fill='%23fff'/%3E%3Crect x='175' y='30' width='45' height='170' fill='%23fff'/%3E%3Crect x='230' y='70' width='55' height='130' fill='%23fff'/%3E%3Crect x='295' y='90' width='40' height='110' fill='%23fff'/%3E%3Crect x='345' y='60' width='50' height='140' fill='%23fff'/%3E%3C/svg%3E")
                        `,
                        backgroundPosition: 'right bottom',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        display: { xs: 'none', md: 'block' }
                    }}
                />

                <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Top Row: Weather + Time + Apartment */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mb: 2 }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            {/* Weather Chip */}
                            <Chip
                                icon={weatherLoading ?
                                    <CircularProgress size={14} sx={{ color: 'white !important' }} /> :
                                    getWeatherIcon(weather.icon)
                                }
                                label={`${weather.location}: ${weather.temp}°C • ${weather.condition}`}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                    '& .MuiChip-icon': { color: 'white' }
                                }}
                            />

                            {/* Apartment Chip (for residents) */}
                            {apartmentCode && (
                                <Chip
                                    label={`🏠 Căn hộ ${apartmentCode}`}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 500,
                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                    }}
                                />
                            )}
                        </Stack>

                        {/* Real-time Clock */}
                        <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                sx={{
                                    fontFamily: 'monospace',
                                    letterSpacing: 1,
                                    fontSize: { xs: '1.2rem', sm: '1.5rem' }
                                }}
                            >
                                {formatTime(currentTime)}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    opacity: 0.8,
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                            >
                                {formatDate(currentTime)}
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Main greeting */}
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{
                            mb: 1,
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                        }}
                    >
                        {greeting}, {displayName}!
                    </Typography>

                    {/* Subtext */}
                    <Typography
                        variant="body1"
                        sx={{
                            opacity: 0.9,
                            mb: 3,
                            fontSize: { xs: '0.85rem', sm: '1rem' }
                        }}
                    >
                        {getDefaultSubtext()}
                    </Typography>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        {/* Smart Report Button */}
                        <Button
                            variant="contained"
                            startIcon={<NotificationsIcon />}
                            onClick={() => setSmartReportOpen(true)}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                borderRadius: 3,
                                px: { xs: 2, sm: 3 },
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                }
                            }}
                        >
                            Báo cáo thông minh
                            {insights.length > 0 && (
                                <Box
                                    component="span"
                                    sx={{
                                        ml: 1,
                                        bgcolor: insights.some(i => i.type === 'warning') ? 'warning.main' : 'success.main',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {insights.length}
                                </Box>
                            )}
                        </Button>

                        {/* Export Finance Report Button (for Accountant) */}
                        {onExportFinanceReport && (
                            <Button
                                variant="contained"
                                startIcon={<FileDownloadIcon />}
                                onClick={onExportFinanceReport}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    color: 'white',
                                    borderRadius: 3,
                                    px: { xs: 2, sm: 3 },
                                    py: 1,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                    }
                                }}
                            >
                                Xuất báo cáo tài chính
                            </Button>
                        )}

                        {/* Custom action button (optional) */}
                        {actionButton}
                    </Stack>
                </CardContent>
            </Card>

            {/* Smart Report Modal */}
            <SmartReportModal
                open={smartReportOpen}
                onClose={() => setSmartReportOpen(false)}
                insights={insights}
                userRole={userRole}
            />
        </>
    );
}

// Export types for use in other components
export type { SmartInsight, WeatherData };
