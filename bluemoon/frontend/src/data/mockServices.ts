// src/data/mockServices.ts

export const SERVICE_CATEGORIES = ['Ẩm thực', 'Mua sắm', 'Sức khỏe & Làm đẹp', 'Giáo dục', 'Giải trí', 'Tiện ích khác'];

export const mockServices = [
  {
    id: 'DV001',
    name: 'BlueFit Gym & Yoga Center',
    category: 'Sức khỏe & Làm đẹp',
    location: 'Tầng 3 - Tòa A',
    openTime: '05:30 - 22:00',
    phone: '0901.234.567',
    description: `Trung tâm thể hình đẳng cấp 5 sao dành riêng cho cư dân Bluemoon.
    - Hệ thống máy tập Technogym nhập khẩu Ý.
    - Bể bơi 4 mùa nước mặn.
    - Các lớp Yoga, Zumba, GroupX miễn phí cho hội viên.
    - Khu vực xông hơi (Sauna & Steam) thư giãn.`,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    status: 'Đang hoạt động'
  },
  {
    id: 'DV002',
    name: 'Siêu thị BlueMart',
    category: 'Mua sắm',
    location: 'Tầng 1 - Sảnh Trung tâm',
    openTime: '07:00 - 22:00',
    phone: '024.3333.8888',
    description: `Siêu thị tiện lợi cung cấp đầy đủ thực phẩm tươi sống, rau củ quả VietGap và nhu yếu phẩm hàng ngày.
    - Giao hàng miễn phí lên căn hộ với hóa đơn từ 200k.
    - Chương trình tích điểm thành viên Bluemoon.`,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    status: 'Đang hoạt động'
  },
  {
    id: 'DV003',
    name: 'Moonlight Coffee & Lounge',
    category: 'Ẩm thực',
    location: 'Tầng thượng (Rooftop) - Tòa B',
    openTime: '08:00 - 23:00',
    phone: '0988.777.666',
    description: `Không gian cafe sang trọng với tầm nhìn toàn cảnh thành phố.
    - Phục vụ Cafe máy, sinh tố, cocktail và đồ ăn nhẹ.
    - Thích hợp để làm việc, tiếp khách hoặc hẹn hò lãng mạn.
    - Giảm 10% cho cư dân có thẻ.`,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    status: 'Đang hoạt động'
  },
  {
    id: 'DV004',
    name: 'Trường Mầm non Quốc tế Little Stars',
    category: 'Giáo dục',
    location: 'Tầng 2 - Tòa B',
    openTime: '07:30 - 17:30 (T2-T6)',
    phone: '024.6666.9999',
    description: `Môi trường giáo dục tiêu chuẩn quốc tế cho cư dân nhí.
    - Chương trình song ngữ Anh - Việt.
    - Camera trực tuyến 24/7 cho phụ huynh.
    - Thực đơn dinh dưỡng organic.`,
    image: 'https://images.unsplash.com/photo-1587654780291-39c940483719?auto=format&fit=crop&w=600&q=80',
    status: 'Tuyển sinh'
  },
  {
    id: 'DV005',
    name: 'Nhà hàng Ẩm thực Á Đông',
    category: 'Ẩm thực',
    location: 'Shophouse 05 - Tầng 1',
    openTime: '10:00 - 14:00 | 17:00 - 22:00',
    phone: '0912.345.678',
    description: `Chuyên các món ăn Trung Hoa và Việt Nam truyền thống.
    - Nhận đặt tiệc gia đình, sinh nhật.
    - Có phòng VIP riêng tư.`,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    status: 'Đang hoạt động'
  },
  {
    id: 'DV006',
    name: 'Khu vui chơi KidzWorld',
    category: 'Giải trí',
    location: 'Tầng 3 - Tòa B',
    openTime: '09:00 - 21:00',
    phone: '0999.888.777',
    description: `Thiên đường vui chơi trong nhà cho bé.
    - Nhà bóng, cầu trượt, khu vận động liên hoàn.
    - Khu vực hướng nghiệp, tô tượng.
    - Vệ sinh khử khuẩn hàng ngày.`,
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=600&q=80',
    status: 'Bảo trì'
  }
];