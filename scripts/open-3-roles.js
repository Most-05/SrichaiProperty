/* eslint-disable @typescript-eslint/no-require-imports */
const { exec } = require('child_process');

// รันคำสั่งเปิด 3 เบราว์เซอร์แยก 3 โปรแกรม (ลูกค้า: Chrome / นายหน้า: Edge / แอดมิน: Brave)
const cmd = `start chrome "http://localhost:3000" --profile-directory="Profile 1" && start msedge "http://localhost:3000/login/agent" --profile-directory="Profile 2" && start brave "http://localhost:3000/admin/login" --profile-directory="Profile 3"`;

exec(cmd, (err) => {
  if (err) console.error('ไม่สามารถเปิดเบราว์เซอร์อัตโนมัติได้:', err);
  else console.log('✅ เปิด 3 หน้าต่างบทบาท (ลูกค้า / นายหน้า / แอดมิน) สำเร็จ!');
});
