// File: backend/controllers/chatbotController.js

const db = require('../config/db');
const Resident = require('../models/residentModel');

const chatbotController = {
    /**
     * Lấy context cho chatbot dựa trên user đang đăng nhập
     * Trả về dữ liệu cá nhân từ database để AI có thể trả lời câu hỏi
     */
    getUserContext: async (req, res) => {
        try {
            const userId = req.user.id;

            // 1. Lấy thông tin cư dân
            const resident = await Resident.findByUserId(userId);
            if (!resident) {
                return res.json({
                    success: true,
                    data: {
                        hasResident: false,
                        message: 'User chưa có hồ sơ cư dân'
                    }
                });
            }

            // 2. Lấy thông tin căn hộ và thành viên
            const apartmentData = await Resident.getApartmentWithMembers(resident.apartment_id);

            // 3. Lấy danh sách hóa đơn/công nợ
            const [fees] = await db.execute(`
                SELECT f.id, f.fee_month, f.total_amount, f.paid_amount, f.status, f.due_date,
                       ft.fee_name
                FROM fees f
                JOIN fee_types ft ON f.fee_type_id = ft.id
                WHERE f.apartment_id = ?
                ORDER BY f.created_at DESC
                LIMIT 10
            `, [resident.apartment_id]);

            // 4. Lấy danh sách dịch vụ đang đăng ký
            const [services] = await db.execute(`
                SELECT s.service_name, s.category, s.price, sr.status, sr.registered_at
                FROM service_registrations sr
                JOIN services s ON sr.service_id = s.id
                WHERE sr.resident_id = ?
                ORDER BY sr.registered_at DESC
                LIMIT 10
            `, [resident.id]);

            // 5. Lấy thông báo gần đây
            const [notifications] = await db.execute(`
                SELECT n.title, n.content, n.type, n.created_at
                FROM notifications n
                WHERE (n.target_type = 'all' OR 
                       (n.target_type = 'apartment' AND n.target_id = ?) OR
                       (n.target_type = 'resident' AND n.target_id = ?))
                ORDER BY n.created_at DESC
                LIMIT 5
            `, [resident.apartment_id, resident.id]);

            // 6. Lấy sự cố đã báo cáo
            const [incidents] = await db.execute(`
                SELECT title, description, status, created_at
                FROM incidents
                WHERE reporter_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            `, [resident.id]);

            res.json({
                success: true,
                data: {
                    hasResident: true,
                    resident: {
                        id: resident.id,
                        fullName: resident.full_name,
                        phone: resident.phone,
                        email: resident.email,
                        role: resident.role,
                        status: resident.status
                    },
                    apartment: apartmentData ? {
                        code: apartmentData.apartment_code,
                        building: apartmentData.building,
                        floor: apartmentData.floor,
                        area: apartmentData.area,
                        status: apartmentData.status,
                        members: apartmentData.members?.map(m => ({
                            name: m.full_name,
                            role: m.role,
                            phone: m.phone
                        })) || []
                    } : null,
                    fees: fees.map(f => ({
                        month: f.fee_month,
                        type: f.fee_name,
                        total: f.total_amount,
                        paid: f.paid_amount,
                        status: f.status,
                        dueDate: f.due_date
                    })),
                    services: services.map(s => ({
                        name: s.service_name,
                        category: s.category,
                        price: s.price,
                        status: s.status
                    })),
                    notifications: notifications.map(n => ({
                        title: n.title,
                        content: n.content?.substring(0, 200),
                        type: n.type,
                        date: n.created_at
                    })),
                    incidents: incidents.map(i => ({
                        title: i.title,
                        status: i.status,
                        date: i.created_at
                    }))
                }
            });

        } catch (error) {
            console.error('Error getting chatbot context:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy dữ liệu cho chatbot',
                error: error.message
            });
        }
    }
};

module.exports = chatbotController;
