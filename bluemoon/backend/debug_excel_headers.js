const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Find the most recent Excel file in uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
console.log('Available Excel files:', files);

// Use the file name from command line or find sample
const testFile = process.argv[2];
if (!testFile) {
    console.log('\nUsage: node debug_excel_headers.js <path-to-excel-file>');
    console.log('Please provide an Excel file path to analyze.');
    process.exit(0);
}

const workbook = xlsx.readFile(testFile);
console.log('\n=== SHEETS IN WORKBOOK ===');
console.log(workbook.SheetNames);

if (workbook.Sheets['Residents']) {
    const data = xlsx.utils.sheet_to_json(workbook.Sheets['Residents']);
    if (data.length > 0) {
        console.log('\n=== COLUMN HEADERS (Keys from first row) ===');
        const keys = Object.keys(data[0]);
        keys.forEach((key, i) => {
            // Show actual bytes for detection of hidden chars
            const charCodes = [...key].map(c => c.charCodeAt(0)).join(',');
            console.log(`  [${i}] "${key}" (charCodes: ${charCodes})`);
        });

        console.log('\n=== FIRST ROW DATA ===');
        console.log(JSON.stringify(data[0], null, 2));

        // Check for Tài khoản specifically
        console.log('\n=== CHECKING "Tài khoản" COLUMN ===');
        const taiKhoanVal = data[0]['Tài khoản'];
        console.log(`Value of data[0]['Tài khoản']: ${taiKhoanVal}`);
        console.log(`Value is truthy: ${!!taiKhoanVal}`);
        if (taiKhoanVal) {
            console.log(`Lowercase: "${String(taiKhoanVal).toLowerCase().trim()}"`);
            console.log(`Is "có": ${String(taiKhoanVal).toLowerCase().trim() === 'có'}`);
        }
    }
}
