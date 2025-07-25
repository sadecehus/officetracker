// API fonksiyonları - Backend ile iletişim için
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

// Debug için console'a yazdır
if (typeof window !== "undefined") {
  console.log('API_BASE_URL:', API_BASE_URL)
}

class ApiClient {
  private token: string | null = null
  private tokenExpiry: number | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
      const expiry = localStorage.getItem("tokenExpiry")
      this.tokenExpiry = expiry ? parseInt(expiry) : null
      this.checkTokenValidity()
    }
  }

  private checkTokenValidity() {
    if (this.token && this.tokenExpiry) {
      const now = Date.now()
      if (now >= this.tokenExpiry) {
        // Token süresi dolmuş
        this.logout()
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Her request öncesi token geçerliliğini kontrol et
    this.checkTokenValidity()

    const url = `${API_BASE_URL}${endpoint}`
    console.log('API Request URL:', url) // Debug için

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // Response'un content-type'ını kontrol et
      const contentType = response.headers.get("content-type")
      console.log('Response Status:', response.status, 'Content-Type:', contentType)
      
      // 401 durumunda token geçersiz, logout yap
      if (response.status === 401) {
        this.logout()
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
        throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.")
      }

      // Response boşsa veya JSON değilse
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error('Non-JSON Response:', text)
        throw new Error(`Server yanıtı JSON formatında değil. Status: ${response.status}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API Error:", error)
      throw error
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if (response.data?.token) {
      this.token = response.data.token
      // Token'ı 24 saat geçerli olacak şekilde ayarla
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000) // 24 saat
      this.tokenExpiry = expiryTime
      
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("tokenExpiry", expiryTime.toString())
      localStorage.setItem("user", JSON.stringify(response.data.user))
    }

    return response
  }

  async register(userData: { name: string; surname: string; email: string; password: string }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    this.token = null
    this.tokenExpiry = null
    localStorage.removeItem("token")
    localStorage.removeItem("tokenExpiry")
    localStorage.removeItem("user")
  }

  // Token geçerliliğini kontrol et
  isAuthenticated(): boolean {
    this.checkTokenValidity()
    return !!this.token
  }

  // Kullanıcı bilgilerini al
  getCurrentUser() {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user) : null
    }
    return null
  }

  // User endpoints
  async getUsers() {
    return this.request("/users")
  }

  async getEmployeeStatistics() {
    return this.request("/users/employees/statistics")
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Project endpoints
  async getProjects() {
    return this.request("/projects")
  }

  async createProject(projectData: any) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    })
  }

  async updateProject(projectId: string, projectData: any) {
    return this.request(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    })
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: "DELETE",
    })
  }

  async assignEmployeeToProject(projectId: string, employeeId: string) {
    return this.request(`/projects/${projectId}/assign`, {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    })
  }

  // Task endpoints
  async getTasks() {
    return this.request("/tasks")
  }

  async getMyTasks() {
    return this.request("/tasks/my")
  }

  async createTask(taskData: any) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(taskId: string, taskData: any) {
    return this.request(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    })
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: "DELETE",
    })
  }

  // Help Request endpoints
  async getHelpRequests() {
    return this.request("/help-requests")
  }

  async createHelpRequest(helpData: { taskId: string; message?: string }) {
    return this.request("/help-requests", {
      method: "POST",
      body: JSON.stringify(helpData),
    })
  }

  async acceptHelpRequest(helpRequestId: string) {
    return this.request(`/help-requests/${helpRequestId}/accept`, {
      method: "POST",
    })
  }

  async completeHelpRequest(helpRequestId: string) {
    return this.request(`/help-requests/${helpRequestId}/complete`, {
      method: "POST",
    })
  }

  // Analytics endpoints
  async getAnalytics() {
    return this.request("/analytics")
  }

  async getUserAnalytics(userId: string) {
    return this.request(`/analytics/user/${userId}`)
  }

  // Activity Log endpoints
  async getActivityLogs() {
    return this.request("/activity-logs")
  }
}

export const apiClient = new ApiClient()
