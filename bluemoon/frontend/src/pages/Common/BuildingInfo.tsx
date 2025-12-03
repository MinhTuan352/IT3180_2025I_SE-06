// src/pages/Common/BuildingInfo.tsx
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
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
} from '@mui/material';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Import ảnh (Bạn hãy thay thế bằng đường dẫn ảnh thực tế trong dự án của bạn)
import bannerImg from '../../assets/bluemoon-background.jpg'; // Ví dụ dùng lại ảnh nền cũ

// --- DỮ LIỆU CỨNG (HARDCODED DATA) ---

// 1. Thông tin giới thiệu (Lấy từ ảnh bạn cung cấp, đã đổi tên thành Bluemoon)
const projectInfo = {
  name: 'CHUNG CƯ BLUEMOON',
  investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
  location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
  scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
  apartments: '216 căn hộ diện tích từ 86,5 - 113m2',
  description: `Tọa lạc tại vị trí đắc địa, Chung cư Bluemoon tiếp giáp với nút giao thông trung tâm Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng. 
  
  Tòa nhà được thiết kế với không gian sống xanh, hòa với thiên nhiên cùng hệ thống hạ tầng khớp nối đồng bộ. Tiện ích và dịch vụ hoàn hảo, khép kín phù hợp với nhu cầu đa dạng của các thế hệ trong gia đình: Siêu thị, dịch vụ spa, phòng tập gym, nhà trẻ...
  
  Với tiêu chí an toàn cho cư dân, tòa nhà có hệ thống PCCC tự động, hiện đại, hệ thống camera giám sát an ninh, hệ thống kiểm soát bảo vệ 24/24.`,
  totalArea: '1,3 ha',
  startDate: 'Quý IV/2016',
  finishDate: 'Quý IV/2018'
};

// 2. Dữ liệu Quy định (Nội quy tòa nhà)
const regulations = [
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
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
            backgroundColor: 'rgba(0,0,0,.5)', // Lớp phủ tối màu để chữ dễ đọc
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Tổng quan Dự án" icon={<BusinessIcon />} iconPosition="start" sx={{fontSize: '1.1rem'}} />
          <Tab label="Nội quy & Quy định" icon={<GavelIcon />} iconPosition="start" sx={{fontSize: '1.1rem'}} />
        </Tabs>
      </Box>

      {/* 3. CONTENT - TAB 1: TỔNG QUAN */}
      <div role="tabpanel" hidden={tabValue !== 0}>
        {tabValue === 0 && (
          <Grid container spacing={4}>
            {/* Cột trái: Thông tin chi tiết */}
            <Grid
            sx={{
                xs: 12, 
                md: 8
            }}>
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
                            <ListItemIcon><HomeWorkIcon color="primary"/></ListItemIcon>
                            <ListItemText primary="Quy mô" secondary={projectInfo.scale} />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleOutlineIcon color="primary"/></ListItemIcon>
                            <ListItemText primary="Số lượng căn hộ" secondary={projectInfo.apartments} />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><AccessTimeIcon color="primary"/></ListItemIcon>
                            <ListItemText primary="Thời gian thi công" secondary={`${projectInfo.startDate} - ${projectInfo.finishDate}`} />
                        </ListItem>
                    </List>
                </Paper>
            </Grid>

            {/* Cột phải: Thông tin tóm tắt (Card) */}
            <Grid
                sx={{
                    xs: 12,
                    md:4
            }}
            >
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
                    {/* Có thể thêm bản đồ nhỏ ở đây nếu muốn */}
                    <CardMedia
                        component="img"
                        height="140"
                        image="https://www.google.com/maps/vt/data=lyX_2k8V_M8j-j7g-w" // Placeholder map image
                        alt="Map placeholder"
                        sx={{ bgcolor: '#e0e0e0' }}
                    />
                </Card>
            </Grid>
          </Grid>
        )}
      </div>

      {/* 4. CONTENT - TAB 2: QUY ĐỊNH */}
      <div role="tabpanel" hidden={tabValue !== 1}>
        {tabValue === 1 && (
          <Box sx={{ maxWidth: 900, margin: 'auto' }}>
             <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center', color: 'primary.main' }}>
                SỔ TAY CƯ DÂN & NỘI QUY TÒA NHÀ
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
                Để đảm bảo môi trường sống văn minh, an toàn và sạch đẹp, Ban Quản Trị kính mong Quý cư dân tuân thủ các quy định sau:
            </Typography>

            {regulations.map((rule, index) => (
                <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2, borderRadius: '8px !important', '&:before': {display: 'none'}, boxShadow: 2 }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {rule.title}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List dense>
                            {rule.content.map((item, i) => (
                                <ListItem key={i} alignItems="flex-start">
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1976d2', marginTop: 8 }} />
                                    </ListItemIcon>
                                    <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.95rem', lineHeight: 1.6 }} />
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            ))}
          </Box>
        )}
      </div>

    </Box>
  );
}