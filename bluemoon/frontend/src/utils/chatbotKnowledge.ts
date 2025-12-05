// src/utils/chatbotKnowledge.ts
import { mockServices } from '../data/mockServices';
// Bạn có thể cần export các biến projectInfo, regulations từ BuildingInfo.tsx để import vào đây
// Hoặc copy lại dữ liệu tĩnh vào đây nếu muốn tách biệt hoàn toàn.
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

// Dữ liệu cứng về tòa nhà (Lấy từ BuildingInfo.tsx)
const buildingInfo = {
  name: 'CHUNG CƯ BLUEMOON',
  investor: 'Tổng công ty CP Xuất nhập khẩu & Xây dựng Việt Nam (VINACONEX)',
  location: '289 Khuất Duy Tiến - Trung Hòa - Cầu Giấy - Hà Nội',
  hotline: '0988484068',
  scale: 'Cao 31 tầng, 03 tầng hầm, 04 tầng dịch vụ thương mại.',
  apartments: '216 căn hộ diện tích từ 86,5 - 113m2',
  description: `Tọa lạc tại vị trí đắc địa, Chung cư Bluemoon tiếp giáp với nút giao thông trung tâm Vành đai 3 - Đại lộ Thăng Long - Trần Duy Hưng. 
  
  Tòa nhà được thiết kế với không gian sống xanh, hòa với thiên nhiên cùng hệ thống hạ tầng khớp nối đồng bộ. Tiện ích và dịch vụ hoàn hảo, khép kín phù hợp với nhu cầu đa dạng của các thế hệ trong gia đình: Siêu thị, dịch vụ spa, phòng tập gym, nhà trẻ...
  
  Với tiêu chí an toàn cho cư dân, tòa nhà có hệ thống PCCC tự động, hiện đại, hệ thống camera giám sát an ninh, hệ thống kiểm soát bảo vệ 24/24.`,
  totalArea: '1,3 ha',
  startDate: 'Quý IV/2016',
  finishDate: 'Quý IV/2018',
  regulations: regulations
};


// Hàm này sẽ được gọi khi chuẩn bị gửi tin nhắn lên AI
export const getSystemContext = () => {
  // 1. Chuyển đổi danh sách dịch vụ thành văn bản dễ đọc cho AI
  const servicesText = mockServices.map(s => 
    `- ${s.name} (${s.category}): Tầng ${s.location}. Mở cửa: ${s.openTime}. Hotline: ${s.phone}. Trạng thái: ${s.status}.`
  ).join('\n');

  // 2. Chuyển đổi nội quy từ Object sang Text dễ đọc
  const regulationsText = buildingInfo.regulations.map(rule => 
    `${rule.title}\n${rule.content.map(line => `- ${line}`).join('\n')}`
  ).join('\n\n');

  // 3. Tạo Prompt ngữ cảnh hệ thống (System Prompt)
  return `
    Bạn là Trợ lý ảo AI của chung cư Bluemoon.
    Dưới đây là thông tin về tòa nhà (Knowledge Base):

    --- THÔNG TIN CHUNG ---
    Tên: ${buildingInfo.name}
    Địa chỉ: ${buildingInfo.location}
    Hotline BQL: ${buildingInfo.hotline}

    --- NỘI QUY TÒA NHÀ ---
    ${regulationsText}

    --- DANH SÁCH DỊCH VỤ & TIỆN ÍCH ---
    ${servicesText}

    Hãy trả lời câu hỏi của cư dân dựa trên thông tin trên. Giọng điệu thân thiện, lịch sự, chuyên nghiệp.
    Nếu không tìm thấy thông tin, hãy hướng dẫn họ liên hệ Hotline BQL.
  `;
};