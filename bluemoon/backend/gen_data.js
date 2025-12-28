const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- DATA LISTS ---
const hovaten = {
    ho: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'],
    demNam: ['Văn', 'Minh', 'Đức', 'Hoàng', 'Tuấn', 'Công', 'Quang', 'Ngọc', 'Quốc', 'Thành', 'Hữu', 'Gia', 'Xuân'],
    demNu: ['Thị', 'Ngọc', 'Thu', 'Phương', 'Thanh', 'Minh', 'Kim', 'Thúy', 'Hồng', 'Mỹ', 'Ánh', 'Khánh'],
    tenNam: ['Hùng', 'Dũng', 'Tuấn', 'Thành', 'Minh', 'Hiếu', 'Hải', 'Nam', 'Khánh', 'Long', 'Quân', 'Kiên', 'Cường', 'Phúc', 'Lâm', 'Sơn'],
    tenNu: ['Lan', 'Hương', 'Thủy', 'Hà', 'Linh', 'Mai', 'Chi', 'Phương', 'Trang', 'Anh', 'Ngân', 'Huyền', 'Tâm', 'Thảo', 'Nhung']
};

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];

// --- HELPERS ---

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(gender) {
    const ho = randomItem(hovaten.ho);
    const dem = gender === 'M' ? randomItem(hovaten.demNam) : randomItem(hovaten.demNu);
    const ten = gender === 'M' ? randomItem(hovaten.tenNam) : randomItem(hovaten.tenNu);
    return { full: `${ho} ${dem} ${ten}`, first: ten };
}

function randomPhone() {
    const prefixes = ['090', '091', '092', '093', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039', '070', '079', '077', '076', '078'];
    const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return randomItem(prefixes) + suffix;
}

function randomCCCD() {
    return '0' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0'); // Basic random
}

function convertViToEn(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, "");
}

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// --- GENERATOR ---

const residents = [];
const blocks = ['A', 'B', 'C'];
let totalApts = 0;
const targetApts = 350;

// Generate Apartments sequentially until we hit target
let blockIdx = 0;
let floor = 1;
let room = 1;

while (totalApts < targetApts) {
    // Generate Apt Code
    const block = blocks[blockIdx];
    // Apartments per floor: 10
    // Rooms: 01-10
    const roomStr = room.toString().padStart(2, '0');
    const aptCode = `${block}${floor}${roomStr}`;

    // Logic to increment apt
    room++;
    if (room > 15) { // 15 rooms per floor
        room = 1;
        floor++;
        if (floor > 25) { // 25 floors
            floor = 1;
            blockIdx = (blockIdx + 1) % blocks.length;
        }
    }

    // Safety break
    // Update logic: Just spread 350 across A, B, C roughly
    // Let's simplified generation logic just to get unique codes
    // We already generated aptCode above.

    totalApts++;

    // Residents for this Apt
    const numResidents = randInt(1, 4); // 1-5 people, favoring 2-4
    const familyLastname = randomItem(hovaten.ho); // Often family shares name, but not always. Let's vary.

    // Owner
    const ownerGender = Math.random() > 0.6 ? 'M' : 'F';
    const ownerName = randomName(ownerGender);
    const ownerAge = randInt(25, 65);
    const ownerCCCD = randomCCCD();
    const ownerEmail = `${convertViToEn(ownerName.full)}${randInt(1, 99)}@${randomItem(domains)}`;
    const ownerPhone = randomPhone();
    const ownerUsername = convertViToEn(ownerName.full) + randInt(100, 999);

    // Add Owner
    residents.push({
        'Mã căn hộ': aptCode,
        'Họ và tên': ownerName.full,
        'CCCD': ownerCCCD,
        'Vai trò': 'Chủ hộ',
        'SĐT': ownerPhone,
        'Email': ownerEmail,
        'Username': ownerUsername,
        'Password': 'password123',
        'Trạng thái': 'Đang sinh sống',
        'Ngày biến động': '',
        'Tài khoản': 'Có' // Helper column
    });

    if (numResidents > 1) {
        // Add Spouse or Children
        for (let i = 1; i < numResidents; i++) {
            const isChild = Math.random() > 0.4;
            const gender = Math.random() > 0.5 ? 'M' : 'F';
            let age;
            if (isChild) {
                age = randInt(1, 20);
            } else {
                age = randInt(20, 80); // Parents or Spouse
            }

            const name = randomName(gender);
            // Try to match surname if child
            if (isChild || Math.random() > 0.5) {
                // name.full = familyLastname + " " + ... but randomName already does full. 
                // Let's just use random names for simplicity, it's just mock data.
            }

            let cccd = '';
            // If < 14, 50% chance no CCCD
            if (age < 14) {
                if (Math.random() > 0.5) cccd = '';
                else cccd = randomCCCD();
            } else {
                cccd = randomCCCD();
            }

            // Phone/Email only for adults usually
            const phone = age > 10 ? randomPhone() : '';
            const email = age > 15 ? `${convertViToEn(name.full)}${randInt(1, 999)}@${randomItem(domains)}` : '';
            const username = (age > 15 && Math.random() > 0.7) ? convertViToEn(name.full) + randInt(100, 999) : ''; // Only some members have accounts

            residents.push({
                'Mã căn hộ': aptCode,
                'Họ và tên': name.full,
                'CCCD': cccd,
                'Vai trò': 'Thành viên',
                'SĐT': phone,
                'Email': email,
                'Username': username,
                'Password': username ? 'password123' : '',
                'Trạng thái': 'Đang sinh sống',
                'Ngày biến động': '',
                'Tài khoản': username ? 'Có' : 'Không'
            });
        }
    }
}

// Write to Excel
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(residents);
xlsx.utils.book_append_sheet(wb, ws, 'Residents');

const outputPath = path.join(__dirname, '../data/BlueMoon_Resident_Data_Generated.xlsx');
xlsx.writeFile(wb, outputPath);

console.log(`Generated ${residents.length} residents in ${totalApts} apartments.`);
console.log(`File saved to: ${outputPath}`);
