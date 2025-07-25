# OfficeTrack Backend API

OfficeTrack projesi için Node.js + Express + MongoDB backend API'si.

## 🚀 Özellikler

- **Role-based Authentication**: Admin, Manager, Employee rolleri
- **Proje Yönetimi**: Proje oluşturma, düzenleme, çalışan atama
- **Görev Takibi**: Görev oluşturma, atama, durum takibi
- **Yardım Sistemi**: Çalışanlar arası yardımlaşma
- **Analytics**: Detaylı istatistikler ve raporlar
- **Activity Logs**: Sistem aktivite takibi
- **RESTful API**: Modern API tasarımı
- **TypeScript**: Tip güvenliği
- **MongoDB**: NoSQL veritabanı

## 🛠️ Teknolojiler

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **TypeScript** - Type safety
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing
- **rate-limiting** - API rate limiting

## 📦 Kurulum

1. **Dependencies'leri yükleyin:**
   ```bash
   npm install
   ```

2. **Environment variables'ları ayarlayın:**
   `.env` dosyası zaten hazır durumda. MongoDB URI ayarlanmış.

3. **Veritabanını seed edin (opsiyonel):**
   ```bash
   npm run seed
   ```

4. **Development server'ı başlatın:**
   ```bash
   npm run dev
   ```

5. **Production build:**
   ```bash
   npm run build
   npm start
   ```

## 🔑 Test Hesapları

Seed çalıştırıldığında aşağıdaki test hesapları oluşturulur:

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@officetrack.com    | admin123    |
| Manager  | manager@officetrack.com  | manager123  |
| Employee | ahmet@officetrack.com    | employee123 |
| Employee | ayse@officetrack.com     | employee123 |
| Employee | mehmet@officetrack.com   | employee123 |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yapma

### Users
- `GET /api/users` - Tüm kullanıcıları listele (Admin)
- `GET /api/users/:id` - Kullanıcı detayı
- `POST /api/users` - Yeni kullanıcı oluştur (Admin)
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil (Admin)

### Projects
- `GET /api/projects` - Projeleri listele
- `GET /api/projects/:id` - Proje detayı
- `POST /api/projects` - Yeni proje oluştur (Manager/Admin)
- `PUT /api/projects/:id` - Proje güncelle (Manager/Admin)
- `POST /api/projects/:id/assign` - Çalışan ata (Manager/Admin)
- `DELETE /api/projects/:id` - Proje sil (Manager/Admin)

### Tasks
- `GET /api/tasks` - Görevleri listele
- `GET /api/tasks/my` - Kendi görevlerim
- `GET /api/tasks/:id` - Görev detayı
- `POST /api/tasks` - Yeni görev oluştur (Manager/Admin)
- `PUT /api/tasks/:id` - Görev güncelle
- `DELETE /api/tasks/:id` - Görev sil (Manager/Admin)

### Help Requests
- `GET /api/help-requests` - Yardım isteklerini listele
- `GET /api/help-requests/:id` - Yardım isteği detayı
- `POST /api/help-requests` - Yardım isteği oluştur (Employee)
- `POST /api/help-requests/:id/accept` - Yardım isteğini kabul et (Employee)
- `POST /api/help-requests/:id/complete` - Yardım isteğini tamamla (Employee)
- `DELETE /api/help-requests/:id` - Yardım isteğini sil

### Analytics
- `GET /api/analytics` - Genel istatistikler (Admin/Manager)
- `GET /api/analytics/user/:userId` - Kullanıcı istatistikleri

### Activity Logs
- `GET /api/activity-logs` - Aktivite logları (Admin/Manager)
- `GET /api/activity-logs/my` - Kendi aktivitelerim
- `GET /api/activity-logs/stats` - Aktivite istatistikleri (Admin/Manager)

## 🔒 Yetkilendirme

- **Admin**: Tüm işlemler
- **Manager**: Proje ve görev yönetimi, istatistikler
- **Employee**: Kendi görevleri, yardım istekleri

## 🗄️ Veritabanı Modelleri

### User
- name, surname, email, password
- role: Admin/Manager/Employee
- status: Aktif/Pasif
- lastLogin, timestamps

### Project
- name, description, deadline
- progress, status
- assignedEmployees[], tasks[]
- createdBy, timestamps

### Task
- title, description, project
- assignedTo, assignedBy
- priority: Düşük/Orta/Yüksek
- status: Bekliyor/Devam Ediyor/Tamamlandı
- progress, deadline, timestamps

### HelpRequest
- taskId, requestedBy, helpedBy
- status: Bekliyor/Kabul Edildi/Tamamlandı
- message, timestamps

### ActivityLog
- userId, action, details
- type: success/info/warning/error
- createdAt

## 🌐 CORS ve Güvenlik

- CORS yapılandırılmış (frontend: http://localhost:3000)
- Helmet security middleware
- Rate limiting (15 dakikada 100 istek)
- JWT token authentication
- Password hashing (bcrypt)
- Input validation

## 📊 Monitoring

- Morgan HTTP request logging
- Detailed error handling
- Activity logging
- Request/response validation

## 🚀 Production Ready

- TypeScript compilation
- Environment variables
- Error handling
- Security best practices
- Database indexing
- API documentation
- Structured logging

Frontend ile entegrasyon için API_BASE_URL'i `http://localhost:3001/api` olarak ayarlayın.
