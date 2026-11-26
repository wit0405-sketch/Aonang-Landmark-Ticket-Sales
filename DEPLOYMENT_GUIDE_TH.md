# คู่มือติดตั้ง Aonang Landmark Boxing Stadium Ticket Sales

ระบบนี้เป็นโปรเจกต์แยกอิสระ ไม่ใช้ฐานข้อมูล ไม่เรียก API และไม่แก้ไขเว็บไซต์จองเดิมของสนาม

## A. สร้างฐานข้อมูล D1 ใหม่

1. เข้า Cloudflare Dashboard → Workers & Pages → D1 SQL Database
2. กด Create database และตั้งชื่อ \`aonang-ticket-sales-db\`
3. เปิดฐานข้อมูล → Console
4. เปิดไฟล์ \`migrations/0001_init.sql\` ใน repository คัดลอก SQL ทั้งหมด วางใน D1 Console แล้วกด Execute
5. ตรวจสอบว่ามีตาราง \`admins\`, \`counters\`, \`sessions\`, \`settings\`, \`sales\`, \`tickets\`

**สำคัญ:** สร้าง D1 ใหม่โดยเฉพาะ ห้ามเลือก D1 ที่ระบบจองเดิมใช้อยู่

## B. สร้าง Cloudflare Pages project ใหม่

1. Workers & Pages → Create → Pages → Connect to Git
2. เลือก repository \`Aonang-Landmark-Ticket-Sales\`
3. Framework preset: None
4. Build command: เว้นว่าง
5. Build output directory: \`public\`
6. Deploy

## C. ตั้งค่า D1 Binding

1. เปิด Pages project ใหม่ → Settings → Functions → D1 database bindings
2. Add binding: Variable name \`DB\`
3. เลือก D1 database \`aonang-ticket-sales-db\`
4. Save แล้ว Trigger a new deployment

## D. ตั้งค่า Secret

Pages project → Settings → Variables and Secrets เพิ่ม:

- \`ADMIN_PASSWORD\`: รหัสผ่านผู้ดูแลอย่างน้อย 14 ตัวอักษร ใช้รหัสใหม่ที่ไม่ซ้ำกับบริการอื่น

ห้ามใส่รหัสผ่านลงในไฟล์ JavaScript, GitHub repository หรือแชต ระบบสร้าง session token แบบสุ่มและเก็บเฉพาะ hash ใน D1 ไม่ต้องกำหนด SESSION_SECRET

## E. ตรวจสอบหลังติดตั้ง

1. เปิด \`https://<ชื่อ-pages-project>.pages.dev/admin.html\`
2. Username ผู้ดูแลคือ \`admin\`; ใช้ค่า \`ADMIN_PASSWORD\` ที่ตั้งไว้เป็นรหัสผ่าน
3. เพิ่มบริษัททัวร์และบัญชีเคาน์เตอร์อย่างน้อย 2 บัญชี
4. เปิดหน้า Counter Login สอง browser/session
5. เลือกวันเดียวกันและทดลองขายที่นั่งเดียวกันจากทั้งสองบัญชี ต้องขายสำเร็จได้เพียงหนึ่งรายการ
6. กลับหน้า Admin Dashboard ตรวจสอบยอดรวมและยอดแยกบริษัท
7. ทดลองพิมพ์ตั๋วและ Export CSV

## F. ผังที่นั่งและราคาเริ่มต้น

- Ringside: S1–S66 — 1,800 บาท
- VIP Seat: A1–H18 — 1,200 บาท
- Grandstand: GT1–GT80 — 1,000 บาท

ราคานี้เป็นค่าเริ่มต้น กรุณายืนยันก่อนเปิดขายจริง แก้ไขได้ที่ Admin → Ticket Prices

## ขอบเขตเวอร์ชันนี้

- ระบบ Login ผู้ดูแลและบริษัททัวร์
- ขายตั๋วและบันทึกวิธีชำระเงินเป็นเงินสด/โอน
- คลังที่นั่งร่วมกัน แยกตามวันแสดง และบังคับ unique seat ใน D1
- Dashboard รวมยอดขายและแยกยอดตามเคาน์เตอร์ อัปเดตทุก 15 วินาที
- หน้าขายจะ refresh สถานะที่นั่งทุก 12 วินาที
- พิมพ์ตั๋วจาก Browser และ Export CSV
- ยังไม่มี Payment Gateway, ระบบคืนเงิน, QR code ตรวจตั๋ว หรือส่งตั๋วทางอีเมล

## ก่อนเปิดขายจริง

ทดสอบด้วยข้อมูลจำลอง ตรวจสอบราคาจริง กำหนดผู้ดูแลสำรอง เปิด HTTPS และตั้งค่านโยบายสำรองข้อมูล D1 เป็นประจำ ห้ามใช้ข้อมูลลูกค้าจริงจนกว่าการทดสอบสิทธิ์และความปลอดภัยจะผ่าน
