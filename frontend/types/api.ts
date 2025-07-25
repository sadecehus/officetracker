// Backend API için TypeScript tipleri
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
  // UI için ek alanlar
  performance?: number
  completed?: number
  tasks?: number
}

export interface Project {
  _id: string
  name: string
  description: string
  deadline: Date
  progress: number
  status: "Aktif" | "Tamamlandı" | "Beklemede"
  assignedEmployees: (string | User)[] // User IDs veya User objects (populate edilmiş)
  tasks: string[] // Task IDs
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
  // UI için ek alanlar
  completed?: number
}

export interface Task {
  _id: string
  title: string
  description: string
  project: string | { _id: string; name: string; description: string } // Project ID or Project object
  assignedTo: string // User ID
  assignedBy: string // User ID
  priority: "Düşük" | "Orta" | "Yüksek"
  status: "Bekliyor" | "Devam Ediyor" | "Tamamlandı"
  progress: number
  deadline: Date
  createdAt: Date
  updatedAt: Date
  // UI için ek alanlar
  assignee?: string
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

// API Response tipleri
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
  dashboardUrl?: string
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
  assignedBy: string
  priority: Task["priority"]
  deadline: string
}

export interface HelpRequestCreate {
  taskId: string
  message?: string
}
