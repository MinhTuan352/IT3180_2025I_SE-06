// src/pages/Common/BuildingInfo.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import { useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import * as buildingApi from '../../api/buildingApi';
import type { BuildingInfo as BuildingInfoType, Regulation } from '../../api/buildingApi';

// Import ảnh
import bannerImg from '../../assets/bluemoon-background.jpg';

// --- DỮ LIỆU CỨNG (HARDCODED DATA) ---
const defaultProjectInfo = {
  name: 'CHUNG CƯ BLUEMOON',
  investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
  location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
  scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
  apartments: '216 căn hộ diện tích từ 86,5 - 113m2',
  description: `Chung cư Bluemoon là dự án căn hộ cao cấp tọa lạc tại vị trí đắc địa, nơi giao thoa giữa các tuyến đường huyết mạch: Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng. Với thiết kế hiện đại theo phong cách châu Âu, tòa nhà mang đến không gian sống sang trọng, tiện nghi và đẳng cấp.

THIẾT KẾ VÀ KIẾN TRÚC:
• Thiết kế căn hộ thông minh, tối ưu hóa ánh sáng tự nhiên và thông gió
• Không gian xanh được bố trí hài hòa với khu vườn trên cao và cây xanh ở hành lang
• Hệ thống thang máy tốc độ cao, tiết kiệm năng lượng
• Sảnh đón sang trọng với phong cách khách sạn 5 sao

HỆ THỐNG TIỆN ÍCH ĐẲNG CẤP:
• Siêu thị, trung tâm mua sắm ngay tại tầng thương mại
• Phòng tập Gym & Spa hiện đại với trang thiết bị cao cấp
• Bể bơi bốn mùa trên tầng thượng với view toàn thành phố
• Nhà trẻ quốc tế, khu vui chơi an toàn cho trẻ em
• Khu BBQ và sân vườn dành cho cộng đồng cư dân

AN NINH VÀ AN TOÀN:
• Hệ thống PCCC tự động hiện đại theo tiêu chuẩn quốc tế
• Camera an ninh 24/7 tại tất cả khu vực công cộng
• Bảo vệ chuyên nghiệp và kiểm soát ra vào bằng thẻ từ
• Hầm đỗ xe thông minh với hệ thống cảm biến`,
  totalArea: '1,3 ha',
  startDate: 'Quý IV/2016',
  finishDate: 'Quý IV/2018',
  totalInvestment: '618,737 tỷ đồng'
};

const defaultRegulations = [
  {
    title: '1. Quy định về An ninh & Ra vào',
    content: [
      'Cư dân ra vào tòa nhà phải sử dụng Thẻ Cư Dân.',
      'Khách đến thăm phải đăng ký tại Quầy Lễ Tân hoặc bảo vệ sảnh.',
      'Không cho người lạ đi cùng vào thang máy hoặc khu vực hạn chế.',
      'Mọi hành vi gây mất trật tự, an ninh sẽ bị xử lý theo quy định.'
    ]
  },
  {
    title: '2. Quy định về Tiếng ồn & Giờ giấc',
    content: [
      'Giờ yên tĩnh: Từ 22:00 đến 07:00 sáng hôm sau và 12:00 đến 13:30 trưa.',
      'Việc thi công sửa chữa chỉ được phép thực hiện trong giờ hành chính (8:00 - 17:00) từ Thứ 2 đến Thứ 6 và sáng Thứ 7.',
      'Vui lòng không gây tiếng ồn lớn, mở nhạc to ảnh hưởng đến các căn hộ lân cận.'
    ]
  },
  {
    title: '3. Quy định về Vệ sinh & Rác thải',
    content: [
      'Rác thải sinh hoạt phải được phân loại và bỏ vào túi kín trước khi cho vào phòng rác/ống rác.',
      'Không để rác, giày dép, vật dụng cá nhân tại hành lang chung.',
      'Cấm vứt tàn thuốc, rác thải từ ban công xuống dưới.',
      'Rác cồng kềnh (nội thất, xà bần) phải đăng ký với BQL để vận chuyển riêng.'
    ]
  },
  {
    title: '4. Quy định về Phòng cháy Chữa cháy (PCCC)',
    content: [
      'Tuyệt đối không hút thuốc tại các khu vực chung, cầu thang bộ, thang máy.',
      'Không đốt vàng mã tại ban công hoặc hành lang (chỉ đốt tại khu vực quy định của tòa nhà).',
      'Không chặn cửa thoát hiểm, không để đồ vật cản trở lối đi PCCC.',
      'Tham gia đầy đủ các buổi diễn tập PCCC định kỳ do BQL tổ chức.'
    ]
  },
  {
    title: '5. Quy định về Thú cưng',
    content: [
      'Cư dân nuôi thú cưng phải đăng ký với Ban Quản Lý.',
      'Khi đưa thú cưng ra khu vực công cộng phải có dây xích, rọ mõm và người dắt.',
      'Tuyệt đối giữ vệ sinh chung, chủ nuôi phải dọn dẹp chất thải của thú cưng ngay lập tức.',
      'Không để thú cưng gây ồn ào ảnh hưởng đến người xung quanh.'
    ]
  }
];

// --- COMPONENT CHÍNH ---
export default function BuildingInfo() {
  const { user } = useAuth();
  const isBOD = user?.role === 'bod';

  const [tabValue, setTabValue] = useState(0);
  const [projectInfo, setProjectInfo] = useState<BuildingInfoType>(defaultProjectInfo);
  const [regulations, setRegulations] = useState<Regulation[]>(defaultRegulations);
  const [_loading, setLoading] = useState(true);

  // Edit modals
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProject, setEditProject] = useState<BuildingInfoType>(defaultProjectInfo);

  const [editRegOpen, setEditRegOpen] = useState(false);
  const [editRegIndex, setEditRegIndex] = useState(-1);
  const [editRegData, setEditRegData] = useState<{ id?: number; title: string; content: string[] }>({ title: '', content: [''] });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [infoData, regsData] = await Promise.all([
          buildingApi.getBuildingInfo(),
          buildingApi.getRegulations()
        ]);
        setProjectInfo(infoData);
        if (regsData.length > 0) {
          setRegulations(regsData);
        }
      } catch (error) {
        console.error('Error fetching building data:', error);
        // Keep default data if API fails
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Project info handlers
  const handleSaveProject = async () => {
    try {
      await buildingApi.updateBuildingInfo(editProject);
      setProjectInfo(editProject);
      setEditProjectOpen(false);
      toast.success('Đã lưu thông tin dự án!');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Lỗi khi lưu thông tin!');
    }
  };

  // Regulation handlers
  const handleEditReg = (index: number) => {
    setEditRegIndex(index);
    setEditRegData({ ...regulations[index] });
    setEditRegOpen(true);
  };

  const handleAddReg = () => {
    setEditRegIndex(-1);
    setEditRegData({ title: `${regulations.length + 1}. Quy định mới`, content: [''] });
    setEditRegOpen(true);
  };

  const handleSaveReg = async () => {
    try {
      if (editRegIndex === -1) {
        // Add new
        const newReg = await buildingApi.createRegulation({ title: editRegData.title, content: editRegData.content });
        setRegulations([...regulations, newReg]);
      } else {
        // Update existing
        const regId = regulations[editRegIndex].id;
        if (regId) {
          await buildingApi.updateRegulation(regId, { title: editRegData.title, content: editRegData.content });
        }
        const updated = [...regulations];
        updated[editRegIndex] = { ...editRegData, id: regId };
        setRegulations(updated);
      }
      setEditRegOpen(false);
      toast.success('Đã lưu quy định!');
    } catch (error) {
      console.error('Error saving regulation:', error);
      toast.error('Lỗi khi lưu quy định!');
    }
  };

  const handleDeleteReg = async (index: number) => {
    try {
      const regId = regulations[index].id;
      if (regId) {
        await buildingApi.deleteRegulation(regId);
      }
      const updated = regulations.filter((_, i) => i !== index);
      setRegulations(updated);
      toast.success('Đã xóa quy định!');
    } catch (error) {
      console.error('Error deleting regulation:', error);
      toast.error('Lỗi khi xóa quy định!');
    }
  };

  const handleAddContent = () => {
    setEditRegData({ ...editRegData, content: [...editRegData.content, ''] });
  };

  const handleContentChange = (idx: number, value: string) => {
    const updated = [...editRegData.content];
    updated[idx] = value;
    setEditRegData({ ...editRegData, content: updated });
  };

  const handleRemoveContent = (idx: number) => {
    const updated = editRegData.content.filter((_: string, i: number) => i !== idx);
    setEditRegData({ ...editRegData, content: updated });
  };

  return (
    <Box sx={{ width: '100%', pb: 5 }}>

      {/* 1. HERO BANNER */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `url(${bannerImg})`,
          height: { xs: 200, md: 350 },
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.5)',
          }}
        />
        <Box sx={{ position: 'relative', p: { xs: 3, md: 6 }, textAlign: 'center' }}>
          <Typography component="h1" variant="h3" color="inherit" gutterBottom sx={{ fontWeight: 'bold', fontFamily: '"ITCBenguiat", serif' }}>
            {projectInfo.name}
          </Typography>
          <Typography variant="h6" color="inherit">
            Nơi giá trị sống được tôn vinh
          </Typography>
        </Box>
      </Paper>

      {/* 2. TABS NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Tổng quan Dự án" icon={<BusinessIcon />} iconPosition="start" sx={{ fontSize: '1.1rem' }} />
          <Tab label="Nội quy & Quy định" icon={<GavelIcon />} iconPosition="start" sx={{ fontSize: '1.1rem' }} />
        </Tabs>
      </Box>

      {/* 3. CONTENT - TAB 1: TỔNG QUAN */}
      <div role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && (
          <>
            {/* Edit button for BOD */}
            {isBOD && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setEditProject(projectInfo); setEditProjectOpen(true); }}>
                  Chỉnh sửa
                </Button>
              </Box>
            )}

            <Grid container spacing={4}>
              {/* Cột trái */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }} elevation={1}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Giới thiệu chung
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {projectInfo.description}
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Quy mô dự án
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><HomeWorkIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Quy mô" secondary={projectInfo.scale} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircleOutlineIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Số lượng căn hộ" secondary={projectInfo.apartments} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AccessTimeIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="Thời gian thi công" secondary={`${projectInfo.startDate} - ${projectInfo.finishDate}`} />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Cột phải */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ borderRadius: 2, height: '100%', bgcolor: '#f4f6f8' }} elevation={0}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Thông tin nhanh
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">CHỦ ĐẦU TƯ</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 2 }}>{projectInfo.investor}</Typography>

                      <Typography variant="subtitle2" color="text.secondary">VỊ TRÍ DỰ ÁN</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                        <LocationOnIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{projectInfo.location}</Typography>
                      </Box>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>DIỆN TÍCH TOÀN KHU</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{projectInfo.totalArea}</Typography>

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>TỔNG MỨC ĐẦU TƯ</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>618,737 tỷ đồng</Typography>
                    </Box>
                  </CardContent>
                  {/* Google Map Embed */}
                  <Box sx={{ height: 250, width: '100%', overflow: 'hidden' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://maps.google.com/maps?q=289+Khuất+Duy+Tiến,+Trung+Hòa,+Cầu+Giấy,+Hà+Nội&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      title="Google Map"
                      style={{ border: 0 }}
                    ></iframe>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </div>

      {/* 4. CONTENT - TAB 2: QUY ĐỊNH */}
      <div role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && (
          <Box>
            {/* Header with edit button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
                  SỔ TAY CƯ DÂN & NỘI QUY TÒA NHÀ
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', mt: 1, color: 'text.secondary' }}>
                  Để đảm bảo môi trường sống văn minh, an toàn và sạch đẹp, Ban Quản Trị kính mong Quý cư dân tuân thủ các quy định sau:
                </Typography>
              </Box>
              {isBOD && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddReg} sx={{ ml: 2, flexShrink: 0 }}>
                  Thêm quy định
                </Button>
              )}
            </Box>

            {/* Regulations - Full width layout */}
            <Grid container spacing={2}>
              {regulations.map((rule, index) => (
                <Grid key={index} size={12}>
                  <Accordion defaultExpanded={index < 2} sx={{ borderRadius: '12px !important', '&:before': { display: 'none' }, boxShadow: 2, height: '100%' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                          {rule.title}
                        </Typography>
                        {isBOD && (
                          <Box onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" color="primary" onClick={() => handleEditReg(index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteReg(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {rule.content.map((item, i) => (
                          <ListItem key={i} alignItems="flex-start">
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                            </ListItemIcon>
                            <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.95rem', lineHeight: 1.6 }} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </div>

      {/* MODAL: Edit Project Info */}
      <Dialog open={editProjectOpen} onClose={() => setEditProjectOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa Thông tin Dự án</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tên dự án" fullWidth value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} />
            <TextField label="Chủ đầu tư" fullWidth value={editProject.investor} onChange={(e) => setEditProject({ ...editProject, investor: e.target.value })} />
            <TextField label="Vị trí" fullWidth value={editProject.location} onChange={(e) => setEditProject({ ...editProject, location: e.target.value })} />
            <TextField label="Quy mô" fullWidth value={editProject.scale} onChange={(e) => setEditProject({ ...editProject, scale: e.target.value })} />
            <TextField label="Số căn hộ" fullWidth value={editProject.apartments} onChange={(e) => setEditProject({ ...editProject, apartments: e.target.value })} />
            <TextField label="Mô tả" fullWidth multiline rows={5} value={editProject.description} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
            <Grid container spacing={2}>
              <Grid sx={{ xs: 6 }}><TextField label="Diện tích" fullWidth value={editProject.totalArea} onChange={(e) => setEditProject({ ...editProject, totalArea: e.target.value })} /></Grid>
              <Grid sx={{ xs: 3 }}><TextField label="Bắt đầu" fullWidth value={editProject.startDate} onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })} /></Grid>
              <Grid sx={{ xs: 3 }}><TextField label="Hoàn thành" fullWidth value={editProject.finishDate} onChange={(e) => setEditProject({ ...editProject, finishDate: e.target.value })} /></Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProjectOpen(false)}>Hủy</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProject}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Edit Regulation */}
      <Dialog open={editRegOpen} onClose={() => setEditRegOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRegIndex === -1 ? 'Thêm Quy định mới' : 'Chỉnh sửa Quy định'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tiêu đề quy định" fullWidth value={editRegData.title} onChange={(e) => setEditRegData({ ...editRegData, title: e.target.value })} />
            <Typography variant="subtitle2" color="text.secondary">Nội dung chi tiết:</Typography>
            {editRegData.content.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField fullWidth value={item} onChange={(e) => handleContentChange(idx, e.target.value)} placeholder={`Nội dung ${idx + 1}`} />
                <IconButton color="error" onClick={() => handleRemoveContent(idx)} disabled={editRegData.content.length === 1}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddContent}>Thêm nội dung</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRegOpen(false)}>Hủy</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveReg}>Lưu</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
