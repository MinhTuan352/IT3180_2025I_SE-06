// src/utils/chatbotKnowledge.ts
import axiosClient from '../api/axiosClient';

// Dữ liệu cứng về tòa nhà (Giữ nguyên)
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

const buildingInfo = {
  name: 'CHUNG CƯ BLUEMOON',
  investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
  location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
  hotline: '0988484068',
  scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
  apartments: '216 căn hộ diện tích từ 86,5 - 113m2'
};

// Interface cho dữ liệu user từ API
interface UserContextData {
  hasResident: boolean;
  resident?: {
    fullName: string;
    phone: string;
    email: string;
    role: string;
    status: string;
  };
  apartment?: {
    code: string;
    building: string;
    floor: number;
    area: number;
    status: string;
    members: Array<{ name: string; role: string; phone: string }>;
  };
  fees?: Array<{
    month: string;
    type: string;
    total: number;
    paid: number;
    status: string;
    dueDate: string;
  }>;
  services?: Array<{
    name: string;
    category: string;
    price: number;
    status: string;
  }>;
  notifications?: Array<{
    title: string;
    content: string;
    type: string;
    date: string;
  }>;
  incidents?: Array<{
    title: string;
    status: string;
    date: string;
  }>;
}

// [MỚI] Fetch dữ liệu user từ backend
export const fetchUserContext = async (): Promise<UserContextData | null> => {
  try {
    const response = await axiosClient.get('/chatbot/context');
    return (response.data as any).data || null;
  } catch (error) {
    console.error('Lỗi fetch user context cho chatbot:', error);
    return null;
  }
};

// [CẬP NHẬT] Tạo system context với dữ liệu động
export const getSystemContext = (userData?: UserContextData | null) => {
  // 1. Nội quy (cố định)
  const regulationsText = regulations.map(rule =>
    `${rule.title}\n${rule.content.map(line => `- ${line}`).join('\n')}`
  ).join('\n\n');

  // 2. Thông tin cá nhân từ database
  let personalInfoText = '';
  if (userData?.hasResident && userData.resident) {
    personalInfoText = `
    --- THÔNG TIN CÁ NHÂN CỦA BẠN ---
    Họ tên: ${userData.resident.fullName}
    Số điện thoại: ${userData.resident.phone || 'Chưa cập nhật'}
    Email: ${userData.resident.email || 'Chưa cập nhật'}
    Vai trò: ${userData.resident.role === 'owner' ? 'Chủ hộ' : 'Thành viên'}
    Trạng thái: ${userData.resident.status}
    `;
  }

  // 3. Thông tin căn hộ
  let apartmentText = '';
  if (userData?.apartment) {
    const apt = userData.apartment;
    const membersText = apt.members?.map(m =>
      `  - ${m.name} (${m.role === 'owner' ? 'Chủ hộ' : 'Thành viên'})`
    ).join('\n') || 'Không có thông tin';

    apartmentText = `
    --- CĂN HỘ CỦA BẠN ---
    Mã căn hộ: ${apt.code}
    Tòa nhà: ${apt.building}
    Tầng: ${apt.floor}
    Diện tích: ${apt.area} m²
    Thành viên trong căn hộ:
${membersText}
    `;
  }

  // 4. Thông tin công nợ
  let feesText = '';
  if (userData?.fees && userData.fees.length > 0) {
    const feesItems = userData.fees.slice(0, 5).map(f => {
      const remaining = f.total - f.paid;
      return `  - ${f.type} (${f.month}): Tổng ${f.total?.toLocaleString()}đ, Đã trả ${f.paid?.toLocaleString()}đ, Còn nợ ${remaining?.toLocaleString()}đ - ${f.status}`;
    }).join('\n');

    feesText = `
    --- CÔNG NỢ GẦN ĐÂY ---
${feesItems}
    `;
  }

  // 5. Dịch vụ đăng ký
  let servicesText = '';
  if (userData?.services && userData.services.length > 0) {
    const servicesItems = userData.services.map(s =>
      `  - ${s.name} (${s.category}): ${s.price?.toLocaleString()}đ/tháng - ${s.status}`
    ).join('\n');

    servicesText = `
    --- DỊCH VỤ ĐANG ĐĂNG KÝ ---
${servicesItems}
    `;
  }

  // 6. Thông báo gần đây
  let notificationsText = '';
  if (userData?.notifications && userData.notifications.length > 0) {
    const notifItems = userData.notifications.slice(0, 3).map(n =>
      `  - ${n.title}: ${n.content?.substring(0, 100)}...`
    ).join('\n');

    notificationsText = `
    --- THÔNG BÁO GẦN ĐÂY ---
${notifItems}
    `;
  }

  // 7. Sự cố đã báo cáo
  let incidentsText = '';
  if (userData?.incidents && userData.incidents.length > 0) {
    const incidentItems = userData.incidents.map(i =>
      `  - ${i.title}: ${i.status}`
    ).join('\n');

    incidentsText = `
    --- SỰ CỐ ĐÃ BÁO CÁO ---
${incidentItems}
    `;
  }

  // Tạo Prompt ngữ cảnh hệ thống (System Prompt)
  return `
    Bạn là Trợ lý ảo AI của chung cư Bluemoon.
    Dưới đây là thông tin về tòa nhà và thông tin cá nhân của cư dân đang chat với bạn (Knowledge Base):

    --- THÔNG TIN CHUNG VỀ TÒA NHÀ ---
    Tên: ${buildingInfo.name}
    Địa chỉ: ${buildingInfo.location}
    Hotline BQL: ${buildingInfo.hotline}
    Quy mô: ${buildingInfo.scale}
    ${personalInfoText}
    ${apartmentText}
    ${feesText}
    ${servicesText}
    ${notificationsText}
    ${incidentsText}
    --- NỘI QUY TÒA NHÀ ---
    ${regulationsText}

    HƯỚNG DẪN:
    - Khi cư dân hỏi về thông tin cá nhân, căn hộ, công nợ, dịch vụ: Trả lời dựa trên dữ liệu phía trên.
    - Khi cư dân hỏi về nội quy, quy định: Trả lời dựa trên nội quy tòa nhà.
    - Giọng điệu thân thiện, lịch sự, chuyên nghiệp.
    - Nếu không tìm thấy thông tin, hãy hướng dẫn họ liên hệ Hotline BQL: ${buildingInfo.hotline}.
  `;
};

// [GIỮ NGUYÊN] Export cho tương thích ngược
export const getStaticSystemContext = () => getSystemContext(null);