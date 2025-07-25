# OfficeTrack - Deploy Rehberi

## 🚀 Canlı Demo
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app

## 📋 Deploy Sırası

### 1. MongoDB Atlas
1. [MongoDB Atlas](https://cloud.mongodb.com) → Free cluster oluştur
2. Database user ekle
3. Network access: `0.0.0.0/0`
4. Connection string al

### 2. Backend - Railway
1. [Railway.app](https://railway.app) → GitHub ile giriş
2. Deploy from GitHub repo
3. Root directory: `backend`
4. Environment variables ekle:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   FRONTEND_URL=your_vercel_url
   ```

### 3. Frontend - Vercel
1. [Vercel.com](https://vercel.com) → GitHub ile giriş
2. Import project
3. Root directory: `frontend`
4. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=your_railway_backend_url/api
   ```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/officetrack
JWT_SECRET=super-secret-jwt-key-minimum-32-characters
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## 🏗️ Yerel Geliştirme

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (yeni terminal)
cd frontend
npm install
npm run dev
```

## 🎯 Test Kullanıcıları
- **Admin**: admin@test.com / 123456
- **Manager**: manager@test.com / 123456
- **Employee**: employee@test.com / 123456

## 📁 Klasör Yapısı
```
officetrack/
├── backend/          # Node.js + Express + MongoDB
├── frontend/         # Next.js + React + TailwindCSS
└── README.md
```
