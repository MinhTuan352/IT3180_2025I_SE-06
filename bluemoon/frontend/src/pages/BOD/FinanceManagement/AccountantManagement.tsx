
import { Box, Typography, Grid, Paper, Tabs, Tab, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Divider, TextField } from '@mui/material';
import { useState } from 'react';
import AddTaskIcon from '@mui/icons-material/AddTask';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
// import PersonIcon from '@mui/icons-material/Person';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function AccountantManagement() {
    const [value, setValue] = useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quản Lý Kế Toán
            </Typography>

            <Paper sx={{ width: '100%', borderRadius: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="accountant management tabs">
                        <Tab label="Tiến độ công việc" icon={<AssignmentIcon />} iconPosition="start" />
                        <Tab label="Giao việc mới" icon={<AddTaskIcon />} iconPosition="start" />
                        <Tab label="Lịch sử hoạt động" icon={<HistoryIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* TAB 1: TIẾN ĐỘ */}
                <CustomTabPanel value={value} index={0}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom color="info.main">Đang thực hiện</Typography>
                                <List>
                                    <ListItem alignItems="flex-start" sx={{ bgcolor: '#f5f5f5', mb: 1, borderRadius: 1 }}>
                                        <ListItemAvatar>
                                            <Avatar>KT</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary="Kiểm kê phí tháng 12"
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">Nguyễn Văn A</Typography>
                                                    {" — Deadline: 31/12/2025"}
                                                </>
                                            }
                                        />
                                        <Chip label="In Progress" color="info" size="small" />
                                    </ListItem>
                                    <ListItem alignItems="flex-start" sx={{ bgcolor: '#f5f5f5', mb: 1, borderRadius: 1 }}>
                                        <ListItemAvatar>
                                            <Avatar>KT</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary="Tổng hợp báo cáo quý 4"
                                            secondary="Trần Thị B — Deadline: 05/01/2026"
                                        />
                                        <Chip label="In Progress" color="info" size="small" />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom color="warning.main">Chờ duyệt</Typography>
                                <List>
                                    <ListItem sx={{ bgcolor: '#fff8e1', mb: 1, borderRadius: 1 }}>
                                        <ListItemText primary="Xác nhận thanh toán #INV-0092" secondary="Cần BQT phê duyệt bút toán" />
                                        <Button size="small">Xem</Button>
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom color="success.main">Hoàn thành gần đây</Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText primary="Phát hành thông báo phí T12" secondary="Hoàn thành: hôm qua" />
                                        <Chip label="Done" color="success" size="small" />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>
                    </Grid>
                </CustomTabPanel>

                {/* TAB 2: GIAO VIỆC */}
                <CustomTabPanel value={value} index={1}>
                    <Box component="form" sx={{ maxWidth: 600, mx: 'auto' }}>
                        <Typography variant="h6" gutterBottom>Tạo công việc mới cho Kế toán</Typography>
                        <TextField label="Tiêu đề công việc" fullWidth required sx={{ mb: 2 }} />
                        <TextField label="Mô tả chi tiết" multiline rows={4} fullWidth sx={{ mb: 2 }} />
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Người thực hiện" select SelectProps={{ native: true }} fullWidth>
                                    <option>Chọn kế toán...</option>
                                    <option>Nguyễn Văn A</option>
                                    <option>Trần Thị B</option>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField label="Hạn chót" type="date" InputLabelProps={{ shrink: true }} fullWidth />
                            </Grid>
                        </Grid>
                        <Button variant="contained" size="large">Giao việc</Button>
                    </Box>
                </CustomTabPanel>

                {/* TAB 3: LỊCH SỬ */}
                <CustomTabPanel value={value} index={2}>
                    <List>
                        {[1, 2, 3].map((i) => (
                            <div key={i}>
                                <ListItem>
                                    <ListItemText
                                        primary={`Cập nhật trạng thái hóa đơn #${1000 + i} -> Đã thanh toán`}
                                        secondary={`Bởi: Nguyễn Văn A - ${i} giờ trước`}
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </div>
                        ))}
                    </List>
                </CustomTabPanel>
            </Paper>
        </Box>
    );
}
