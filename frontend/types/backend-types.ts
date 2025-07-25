// Backend ile uyumlu TypeScript tipleri
export interface User {
  _id: string
  name: string
  surname: string
  email: string
  password?: string
  role: "Admin" | "Manager" | "Employee"
  status: "Aktif" | "Pasif"
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

export interface Project {
  _id: string
  name: string
  description: string
  deadline: Date
  progress: number
  status: "Aktif" | "Tamamlandı" | "Beklemede"
  assignedEmployees: string[] // User IDs
  tasks: string[] // Task IDs
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  _id: string
  title: string
  description: string
  project: string // Project ID
  assignedTo: string[] // User IDs array
  assignedBy: string // User ID
  priority: "Düşük" | "Orta" | "Yüksek"
  status: "Bekliyor" | "Devam Ediyor" | "Tamamlandı"
  progress: number
  deadline: Date
  createdAt: Date
  updatedAt: Date
}

export interface HelpRequest {
  _id: string
  taskId: string // Task ID
  requestedBy: string // User ID
  helpedBy?: string // User ID
  status: "Bekliyor" | "Kabul Edildi" | "Tamamlandı"
  message?: string
  createdAt: Date
  updatedAt: Date
}

export interface ActivityLog {
  _id: string
  userId: string
  action: string
  details: string
  type: "success" | "info" | "warning" | "error"
  createdAt: Date
}

// API Request/Response tipleri
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: Omit<User, "password">
  token: string
}

export interface RegisterRequest {
  name: string
  surname: string
  email: string
  password: string
}

export interface TaskUpdateRequest {
  progress?: number
  status?: Task["status"]
  description?: string
}

export interface ProjectCreateRequest {
  name: string
  description: string
  deadline: string
  assignedEmployees?: string[]
}

export interface TaskCreateRequest {
  title: string
  description: string
  project: string
  assignedTo: string
  priority: Task["priority"]
  deadline: string
}

export interface HelpRequestCreate {
  taskId: string
  message?: string
}

// MongoDB Schema örnekleri (referans için)
export const UserSchema = {
  name: { type: String, required: true, trim: true },
  surname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["Admin", "Manager", "Employee"], default: "Employee" },
  status: { type: String, enum: ["Aktif", "Pasif"], default: "Aktif" },
  lastLogin: { type: Date },
  timestamps: true,
}

export const TaskSchema = {
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  project: { type: "ObjectId", ref: "Project", required: true },
  assignedTo: { type: "ObjectId", ref: "User", required: true },
  assignedBy: { type: "ObjectId", ref: "User", required: true },
  priority: { type: String, enum: ["Düşük", "Orta", "Yüksek"], default: "Orta" },
  status: { type: String, enum: ["Bekliyor", "Devam Ediyor", "Tamamlandı"], default: "Bekliyor" },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  deadline: { type: Date, required: true },
  timestamps: true,
}

// Employee statistics types
export interface EmployeeStatistics {
  totalTasks: number
  completedTasks: number
  activeTasks: number
  pendingTasks: number
  overdueTasks: number
  tasksCompletedThisMonth: number
  completionRate: number
  avgProgress: number
}

export interface EmployeeWithStatistics {
  employee: {
    _id: string
    name: string
    surname: string
    email: string
    role: string
    status: string
  }
  statistics: EmployeeStatistics
}

export const HelpRequestSchema = {
  task: { type: "ObjectId", ref: "Task", required: true },
  requestedBy: { type: "ObjectId", ref: "User", required: true },
  helpedBy: { type: "ObjectId", ref: "User" },
  status: { type: String, enum: ["Bekliyor", "Kabul Edildi", "Tamamlandı"], default: "Bekliyor" },
  message: { type: String, trim: true },
  timestamps: true,
}
