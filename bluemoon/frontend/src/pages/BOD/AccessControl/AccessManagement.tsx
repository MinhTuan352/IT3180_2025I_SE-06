import { Box, Typography, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

// Import existing components
import AccessControl from './AccessControl';
import BODVisitorList from '../Visitor/BODVisitorList';
import VehicleList from './VehicleList';

export default function AccessManagement() {
    const [tabValue, setTabValue] = useState(0);
    const { user } = useAuth();

    // Check if user is cqcn (read-only)
    const isCQCN = user?.role === 'cqcn';

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                Quản Lý Ra Vào
            </Typography>

            <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="Theo Dõi Ra Vào" />
                <Tab label="Danh Sách Xe Đăng Ký" />
                <Tab label="Quản Lý Khách" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
                {tabValue === 0 && <AccessControl />}
                {tabValue === 1 && <VehicleList readOnly={isCQCN} />}
                {tabValue === 2 && <BODVisitorList readOnly={isCQCN} />}
            </Box>
        </Box>
    );
}
