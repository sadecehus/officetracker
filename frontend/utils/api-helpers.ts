// Backend API endpoint'leri için yardımcı fonksiyonlar
// Bu fonksiyonlar backend hazır olduğunda kullanılabilir

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",

  // User endpoints
  USERS: "/api/users",
  USER_BY_ID: (id: string) => `/api/users/${id}`,

  // Project endpoints
  PROJECTS: "/api/projects",
  PROJECT_BY_ID: (id: string) => `/api/projects/${id}`,
  ASSIGN_TO_PROJECT: (id: string) => `/api/projects/${id}/assign`,

  // Task endpoints
  TASKS: "/api/tasks",
  MY_TASKS: "/api/tasks/my",
  TASK_BY_ID: (id: string) => `/api/tasks/${id}`,

  // Help Request endpoints
  HELP_REQUESTS: "/api/help-requests",
  MY_HELP_REQUESTS: "/api/help-requests/my",
  ACCEPT_HELP: (id: string) => `/api/help-requests/${id}/accept`,
  COMPLETE_HELP: (id: string) => `/api/help-requests/${id}/complete`,

  // Analytics endpoints
  ANALYTICS: "/api/analytics",
  USER_ANALYTICS: (id: string) => `/api/analytics/user/${id}`,

  // Activity Log endpoints
  ACTIVITY_LOGS: "/api/activity-logs",
}

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const

// API Response helper
export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
) => ({
  success,
  data,\
  message: message || (success ? 'İşlem başarılı' : 'İşlem başarısız'),
  error,
})

// Local Storage helpers
export const storage = {\
  setToken: (token: string) => {\
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  },
  
  getToken: (): string | null => {\
    if (typeof window !== 'undefined') {\
      return localStorage.getItem('token')
    }
    return null
  },
  
  removeToken: () => {\
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  },
  
  setUser: (user: any) => {\
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },
  
  getUser: () => {\
    if (typeof window !== 'undefined') {\
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
    return null
  },
  
  removeUser: () => {\
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
  },
  
  clear: () => {\
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  }
}

// Date helpers
export const formatDate = (date: Date | string) => {\
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR')
}

export const formatDateTime = (date: Date | string) => {\
  const d = new Date(date)
  return d.toLocaleString('tr-TR')
}

// Task helpers
export const getTaskStatusColor = (status: string) => {\
  switch (status) {
    case \"Tamamlandı":
      return "bg-green-100 text-green-800"
    case "Devam Ediyor":
      return "bg-blue-100 text-blue-800"
    case "Bekliyor":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getPriorityColor = (priority: string) => {\
  switch (priority) {
    case "Yüksek":\
      return "bg-red-100 text-red-800"
    case "Orta":
      return "bg-yellow-100 text-yellow-800"
    case "Düşük":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Validation helpers
export const validateEmail = (email: string): boolean => {\
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {\
  return password.length >= 6
}

export const validateRequired = (value: string): boolean => {\
  return value.trim().length > 0
}

// Mock data generators (development için)
interface User {
  _id: string;\
  name: string;
  surname: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  _id: string;\
  title: string;
  description: string;
  project: string;
  assignedTo: string;
  assignedBy: string;
  priority: string;
  status: string;
  progress: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const generateMockUser = (overrides?: Partial<User>) => ({\
  _id: Math.random().toString(36).substr(2, 9),
  name: 'Test',
  surname: 'User',
  email: 'test@example.com',
  role: 'Employee',
  status: 'Aktif',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const generateMockTask = (overrides?: Partial<Task>) => ({\
  _id: Math.random().toString(36).substr(2, 9),
  title: 'Test Görev',
  description: 'Test açıklaması',
  project: 'project-id',
  assignedTo: 'user-id',
  assignedBy: 'manager-id',
  priority: 'Orta',
  status: 'Bekliyor',
  progress: 0,
  deadline: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,\
})
