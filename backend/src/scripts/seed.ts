import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { ActivityLog } from '../models/ActivityLog';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.DB_NAME || 'officetrack',
    });

    console.log('🍃 Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      ActivityLog.deleteMany({})
    ]);

    console.log('🧹 Cleared existing data');

    // Create Admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'System',
      surname: 'Admin',
      email: 'admin@officetrack.com',
      password: adminPassword,
      role: 'Admin',
      status: 'Aktif'
    });

    // Create Manager user
    const managerPassword = await bcrypt.hash('manager123', 12);
    const manager = await User.create({
      name: 'Proje',
      surname: 'Yöneticisi',
      email: 'manager@officetrack.com',
      password: managerPassword,
      role: 'Manager',
      status: 'Aktif'
    });

    // Create Employee users
    const employeePassword = await bcrypt.hash('employee123', 12);
    const employees = await User.insertMany([
      {
        name: 'Ahmet',
        surname: 'Yılmaz',
        email: 'ahmet@officetrack.com',
        password: employeePassword,
        role: 'Employee',
        status: 'Aktif'
      },
      {
        name: 'Ayşe',
        surname: 'Demir',
        email: 'ayse@officetrack.com',
        password: employeePassword,
        role: 'Employee',
        status: 'Aktif'
      },
      {
        name: 'Mehmet',
        surname: 'Kaya',
        email: 'mehmet@officetrack.com',
        password: employeePassword,
        role: 'Employee',
        status: 'Aktif'
      }
    ]);

    console.log('👥 Created users');

    // Create sample project
    const project = await Project.create({
      name: 'OfficeTrack Web Uygulaması',
      description: 'Şirket içi proje ve görev takip sistemi geliştirme',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      assignedEmployees: employees.map(emp => emp._id),
      createdBy: manager._id,
      status: 'Aktif',
      progress: 25
    });

    console.log('📁 Created sample project');

    // Create sample tasks
    const tasks = await Task.insertMany([
      {
        title: 'React Frontend Geliştirme',
        description: 'Kullanıcı arayüzü ve bileşenlerinin geliştirilmesi',
        project: project._id,
        assignedTo: employees[0]._id,
        assignedBy: manager._id,
        priority: 'Yüksek',
        status: 'Devam Ediyor',
        progress: 60,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'API Entegrasyonu',
        description: 'Backend API ile frontend entegrasyonu',
        project: project._id,
        assignedTo: employees[1]._id,
        assignedBy: manager._id,
        priority: 'Orta',
        status: 'Bekliyor',
        progress: 0,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Veritabanı Tasarımı',
        description: 'MongoDB şema tasarımı ve optimizasyonu',
        project: project._id,
        assignedTo: employees[2]._id,
        assignedBy: manager._id,
        priority: 'Yüksek',
        status: 'Tamamlandı',
        progress: 100,
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);

    // Update project with tasks
    project.tasks = tasks.map(task => task._id as any);
    await project.save();

    console.log('✅ Created sample tasks');

    // Create activity logs
    await ActivityLog.insertMany([
      {
        userId: admin._id,
        action: 'System Setup',
        details: 'Initial system setup completed',
        type: 'success'
      },
      {
        userId: manager._id,
        action: 'Project Created',
        details: 'Created project: OfficeTrack Web Uygulaması',
        type: 'success'
      },
      {
        userId: manager._id,
        action: 'Tasks Assigned',
        details: 'Assigned tasks to team members',
        type: 'info'
      }
    ]);

    console.log('📊 Created activity logs');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@officetrack.com / admin123');
    console.log('Manager: manager@officetrack.com / manager123');
    console.log('Employee 1: ahmet@officetrack.com / employee123');
    console.log('Employee 2: ayse@officetrack.com / employee123');
    console.log('Employee 3: mehmet@officetrack.com / employee123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

seedDatabase();
