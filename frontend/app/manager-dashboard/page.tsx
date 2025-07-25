"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, FolderPlus, UserPlus, BarChart3, Calendar, LogOut, Crown, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { User, Project, Task } from "@/types/api"
import { EmployeeWithStatistics } from "@/types/backend-types"

export default function ManagerDashboard() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout: authLogout } = useAuth()
  const [newProject, setNewProject] = useState({ name: "", description: "", deadline: "" })
  const [newTask, setNewTask] = useState({ title: "", description: "", assignees: [] as string[], priority: "", deadline: "", project: "" })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [assignEmployeeDialog, setAssignEmployeeDialog] = useState(false)
  const [selectedEmployeeForProject, setSelectedEmployeeForProject] = useState("")
  const [employees, setEmployees] = useState<User[]>([])
  const [employeeStatistics, setEmployeeStatistics] = useState<EmployeeWithStatistics[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: "", surname: "", email: "", password: "" })

  // Project name'i güvenli bir şekilde al
  const getProjectName = (project: string | { _id: string; name: string; description: string }): string => {
    if (typeof project === 'string') {
      return project
    }
    return project?.name || 'Bilinmeyen Proje'
  }

  // Project ID'sini güvenli bir şekilde al
  const getProjectId = (project: string | { _id: string; name: string; description: string }): string => {
    if (typeof project === 'string') {
      return project
    }
    return project?._id || ''
  }

  // Data fetching function
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Kullanıcıları getir (çalışanlar için)
      const usersRes = await apiClient.getUsers()
      const users: User[] = (usersRes as any)?.data || (usersRes as User[]) || []
      
      // Çalışan istatistiklerini getir
      const employeeStatsRes = await apiClient.getEmployeeStatistics()
      const employeeStats: EmployeeWithStatistics[] = (employeeStatsRes as any)?.data || []
      
      // Projeleri getir
      const projectsRes = await apiClient.getProjects()
      const projects: Project[] = (projectsRes as any)?.data || (projectsRes as Project[]) || []
      
      // Görevleri getir
      const tasksRes = await apiClient.getTasks()
      const tasks: Task[] = (tasksRes as any)?.data || (tasksRes as Task[]) || []
      
      // Çalışanlar için performans verilerini hesapla
      const employeesWithStats = users.filter(user => user.role === 'Employee').map(employee => {
        const userTasks = tasks.filter(task => 
          Array.isArray(task.assignedTo) 
            ? task.assignedTo.includes(employee._id)
            : task.assignedTo === employee._id
        )
        const completedTasks = userTasks.filter(task => task.status === 'Tamamlandı')
        const performance = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0
        
        return {
          ...employee,
          tasks: userTasks.length,
          completed: completedTasks.length,
          performance
        }
      })
      
      // Projeler için tamamlanma verilerini hesapla
      const projectsWithStats = projects.map(project => {
        const projectTasks = tasks.filter(task => getProjectId(task.project) === project._id)
        const completedTasks = projectTasks.filter(task => task.status === 'Tamamlandı')
        
        return {
          ...project,
          completed: completedTasks.length,
          progress: projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
          // assignedEmployees'i olduğu gibi bırak - backend'den populate edilmiş haliyle gelir
        }
      })
      
      // Görevler için atanan kişi bilgilerini ekle
      const tasksWithAssignee = tasks.map(task => {
        // assignedTo artık array, bu yüzden birden fazla kullanıcı olabilir
        const assignedUsers = Array.isArray(task.assignedTo) 
          ? task.assignedTo.map(userId => {
              const user = users.find(u => u._id === (typeof userId === 'string' ? userId : userId._id))
              return user ? `${user.name} ${user.surname}` : 'Bilinmeyen Kullanıcı'
            })
          : [users.find(user => user._id === task.assignedTo)]
              .filter(Boolean)
              .map(user => user ? `${user.name} ${user.surname}` : 'Bilinmeyen Kullanıcı')
        
        const projectData = projects.find(p => p._id === getProjectId(task.project))
        
        return {
          ...task,
          assignee: assignedUsers.length > 0 ? assignedUsers.join(', ') : 'Belirlenmemiş',
          project: projectData ? projectData.name : getProjectName(task.project)
        }
      })
      
      setEmployees(employeesWithStats)
      setEmployeeStatistics(employeeStats)
      setProjects(projectsWithStats)
      setTasks(tasksWithAssignee)
    } catch (err: any) {
      setError(err?.message || "Veriler alınamadı.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auth loading bitene kadar bekle
    if (authLoading) return

    // Authentication check
    if (!isAuthenticated || !currentUser) {
      window.location.href = '/'
      return
    }

    // Role check
    if (currentUser.role !== 'Manager') {
      window.location.href = '/'
      return
    }
    
    fetchData()
  }, [isAuthenticated, currentUser, authLoading])

  // Proje ekleme
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const res = await apiClient.createProject(newProject)
      setSuccessMsg("Proje başarıyla oluşturuldu!")
      setNewProject({ name: "", description: "", deadline: "" })
      // Veriyi yeniden yükle
      await fetchData()
    } catch (err: any) {
      setErrorMsg(err?.message || "Proje oluşturulamadı.")
    }
  }

  // Görev atama
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      // Proje ve çalışanlar id'si bul
      const project = projects.find((p) => p._id === newTask.project)
      const assignees = newTask.assignees.map(assigneeId => 
        employees.find((e) => e._id === assigneeId)
      ).filter(Boolean)
      
      if (!project || assignees.length === 0) throw new Error("Proje veya çalışan seçilmedi.")
      
      // Frontend validation kontrolü
      if (!newTask.title.trim()) throw new Error("Görev başlığı gereklidir.")
      if (newTask.title.trim().length < 5) throw new Error("Görev başlığı en az 5 karakter olmalıdır.")
      if (!newTask.description.trim()) throw new Error("Görev açıklaması gereklidir.")
      if (newTask.description.trim().length < 10) throw new Error("Görev açıklaması en az 10 karakter olmalıdır.")
      if (!newTask.priority) throw new Error("Öncelik seçilmelidir.")
      if (!newTask.deadline) throw new Error("Son tarih belirtilmelidir.")
      if (!newTask.project) throw new Error("Proje seçilmelidir.")
      
      // Her atanan çalışanın projeye atanıp atanmadığını kontrol et
      for (const assignee of assignees) {
        if (!assignee) continue // Type safety
        
        const isEmployeeAssigned = project.assignedEmployees.some((emp: any) => 
          typeof emp === 'string' ? emp === assignee._id : emp._id === assignee._id
        )
        
        if (!isEmployeeAssigned) {
          try {
            // Çalışanı otomatik olarak projeye ata
            await apiClient.assignEmployeeToProject(project._id, assignee._id)
            console.log(`${assignee.name} otomatik olarak ${project.name} projesine atandı.`)
          } catch (assignError: any) {
            throw new Error(`Çalışan projeye atanamadı: ${assignError.message}`)
          }
        }
      }
      
      await apiClient.createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        project: project._id,
        assignedTo: assignees.filter(Boolean).map(a => a!._id), // Array olarak gönder, undefined filtrele
        assignedBy: currentUser._id, // Manager'ın ID'si
        priority: newTask.priority,
        deadline: newTask.deadline,
      })
      setSuccessMsg("Görev başarıyla atandı!")
      setNewTask({ title: "", description: "", assignees: [], priority: "", deadline: "", project: "" })
      // Veriyi yeniden yükle
      await fetchData()
    } catch (err: any) {
      console.error('Task assignment error:', err)
      setErrorMsg(err?.message || "Görev atanamadı.")
    }
  }

  const handleLogout = () => {
    authLogout()
  }

  // Projeye çalışan atama
  const assignEmployeeToProject = async () => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      if (!selectedProject || !selectedEmployeeForProject) throw new Error("Proje veya çalışan seçilmedi.")
      const assignee = employees.find((e) => e.name === selectedEmployeeForProject)
      if (!assignee) throw new Error("Çalışan bulunamadı.")
      await apiClient.assignEmployeeToProject(selectedProject._id, assignee._id)
      setSuccessMsg("Çalışan başarıyla projeye atandı!")
      setAssignEmployeeDialog(false)
      setSelectedEmployeeForProject("")
      setSelectedProject(null)
      // Veriyi yeniden yükle
      await fetchData()
    } catch (err: any) {
      setErrorMsg(err?.message || "Çalışan atanamadı.")
    }
  }

  // Çalışan ekleme
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.createUser({ ...newEmployee, role: "Employee" })
      setSuccessMsg("Çalışan başarıyla eklendi!")
      setAddEmployeeDialog(false)
      setNewEmployee({ name: "", surname: "", email: "", password: "" })
      // Veriyi yeniden yükle
      await fetchData()
    } catch (err: any) {
      setErrorMsg(err?.message || "Çalışan eklenemedi.")
    }
  }

  // Auth loading durumunda bekleme ekranı göster
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Yönetici Paneli</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                
                <span className="text-sm font-medium">
                  {currentUser ? `${currentUser.name} ${currentUser.surname}` : 'Yönetici Kullanıcı'}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Çıkış Yap</AlertDialogTitle>
                    <AlertDialogDescription>
                      Çıkış yapmak istediğinizden emin misiniz? Kaydedilmemiş değişiklikler kaybolabilir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Çıkış Yap</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Çalışan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">Aktif çalışanlar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Projeler</CardTitle>
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">Devam eden projeler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">Sistemdeki tüm görevler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Performans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.length > 0 
                  ? Math.round(employees.reduce((acc, emp) => acc + (emp.performance || 0), 0) / employees.length)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Çalışan ortalaması</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="employees">Çalışanlar</TabsTrigger>
            <TabsTrigger value="projects">Projeler</TabsTrigger>
            <TabsTrigger value="tasks">Görevler</TabsTrigger>
            <TabsTrigger value="analytics">Analitik</TabsTrigger>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Son Projeler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-600">
                            {project.completed || 0}/{tasks.filter(t => getProjectId(t.project) === project._id).length || 0} görev tamamlandı
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{project.progress}%</div>
                          <Progress value={project.progress} className="w-20 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Çalışan Performansı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div key={employee._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {employee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{employee.name}</h3>
                            <p className="text-sm text-gray-600">{employee.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{employee.performance || 0}%</div>
                          <div className="text-xs text-gray-600">
                            {employee.completed || 0}/{employee.tasks || 0} görev
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Çalışan Yönetimi</CardTitle>
                  <CardDescription>Çalışanlarınızın performansını ve görev istatistiklerini görüntüleyin</CardDescription>
                </div>
                <Button onClick={() => setAddEmployeeDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Yeni Çalışan
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeStatistics.map((employeeStat) => (
                    <div key={employeeStat.employee._id} className="border rounded-lg p-6 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                              {employeeStat.employee.name.charAt(0)}{employeeStat.employee.surname.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{employeeStat.employee.name} {employeeStat.employee.surname}</h3>
                            <p className="text-sm text-gray-600">{employeeStat.employee.email}</p>
                            <Badge variant="outline" className="mt-1">
                              {employeeStat.employee.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* İstatistik kartları */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{employeeStat.statistics.totalTasks}</div>
                          <div className="text-xs text-blue-700">Toplam Görev</div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{employeeStat.statistics.completedTasks}</div>
                          <div className="text-xs text-green-700">Tamamlanan</div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600">{employeeStat.statistics.activeTasks}</div>
                          <div className="text-xs text-yellow-700">Aktif Görev</div>
                        </div>
                        
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">{employeeStat.statistics.overdueTasks}</div>
                          <div className="text-xs text-red-700">Geciken</div>
                        </div>
                      </div>
                      
                      {/* Detaylı istatistikler */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tamamlanma Oranı</span>
                            <span className="font-medium">{employeeStat.statistics.completionRate}%</span>
                          </div>
                          <Progress value={employeeStat.statistics.completionRate} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Ortalama İlerleme</span>
                            <span className="font-medium">{employeeStat.statistics.avgProgress}%</span>
                          </div>
                          <Progress value={employeeStat.statistics.avgProgress} className="h-2" />
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Bu Ay Tamamlanan</div>
                          <div className="text-lg font-bold text-indigo-600">{employeeStat.statistics.tasksCompletedThisMonth}</div>
                        </div>
                      </div>
                      
                      {/* Görev durumu özeti */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bekleyen: {employeeStat.statistics.pendingTasks}</span>
                          <span className="text-gray-600">Devam Eden: {employeeStat.statistics.activeTasks}</span>
                          <span className="text-gray-600">Tamamlanan: {employeeStat.statistics.completedTasks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {employeeStatistics.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      Henüz çalışan bulunmuyor.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Proje Yönetimi</CardTitle>
                  <CardDescription>Projelerinizi oluşturun ve yönetin</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Proje
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Proje Oluştur</DialogTitle>
                      <DialogDescription>Yeni bir proje oluşturmak için bilgileri doldurun</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div>
                        <Label htmlFor="project-name">Proje Adı</Label>
                        <Input
                          id="project-name"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="project-description">Açıklama</Label>
                        <Textarea
                          id="project-description"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="project-deadline">Son Tarih</Label>
                        <Input
                          id="project-deadline"
                          type="date"
                          value={newProject.deadline}
                          onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Proje Oluştur
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-600">Son tarih: {new Date(project.deadline).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedProject(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            İlerleme ({project.completed || 0}/{tasks.filter(t => getProjectId(t.project) === project._id).length || 0} görev)
                          </span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {selectedProject && (
              <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedProject.name}</DialogTitle>
                    <DialogDescription>Proje Detayları ve Çalışan Yönetimi</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Son Tarih</Label>
                        <p className="text-sm text-gray-600">{new Date(selectedProject.deadline).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">İlerleme</Label>
                        <p className="text-sm text-gray-600">{selectedProject.progress}%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Toplam Görev</Label>
                        <p className="text-sm text-gray-600">{tasks.filter(t => getProjectId(t.project) === selectedProject._id).length || 0}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tamamlanan</Label>
                        <p className="text-sm text-gray-600">{selectedProject.completed || 0}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Açıklama</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Atanmış Çalışanlar</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedProject.assignedEmployees && selectedProject.assignedEmployees.length > 0 ? (
                          selectedProject.assignedEmployees.map((employee: any, index: number) => {
                            // employee object ise direkt kullan, string ise ID'ye göre bul
                            const empData = typeof employee === 'string' 
                              ? employees.find(emp => emp._id === employee)
                              : employee
                            
                            return (
                              <Badge key={index} variant="outline">
                                {empData ? `${empData.name} ${empData.surname}` : 'Bilinmeyen Çalışan'}
                              </Badge>
                            )
                          })
                        ) : (
                          <p className="text-sm text-gray-500">Henüz çalışan atanmamış</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">İlerleme Durumu</Label>
                      <Progress value={selectedProject.progress} className="h-3" />
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={() => setAssignEmployeeDialog(true)} className="flex-1">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Çalışan Ata
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedProject(null)} className="flex-1">
                        Kapat
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Çalışan Atama Modalı */}
            <Dialog open={assignEmployeeDialog} onOpenChange={setAssignEmployeeDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Projeye Çalışan Ata</DialogTitle>
                  <DialogDescription>{selectedProject?.name} projesine çalışan atayın</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee-select">Çalışan Seçin</Label>
                    <Select value={selectedEmployeeForProject} onValueChange={setSelectedEmployeeForProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Çalışan seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee._id} value={employee.name}>
                            {employee.name} - {employee.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={assignEmployeeToProject} className="flex-1">
                      Ata
                    </Button>
                    <Button variant="outline" onClick={() => setAssignEmployeeDialog(false)} className="flex-1">
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Görev Yönetimi</CardTitle>
                  <CardDescription>Görevleri atayın ve takip edin</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Görev Ata
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Görev Ata</DialogTitle>
                      <DialogDescription>Çalışana yeni bir görev atayın</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignTask} className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Görev Başlığı *</Label>
                        <Input
                          id="task-title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="En az 5 karakter"
                          minLength={5}
                          maxLength={200}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Açıklama *</Label>
                        <Textarea
                          id="task-description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Görev detaylarını açıklayın (en az 10 karakter)"
                          minLength={10}
                          maxLength={1000}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-assignees">Atanacak Kişiler *</Label>
                        <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                          {employees.map((employee) => (
                            <div key={employee._id} className="flex items-center space-x-2 mb-2">
                              <input
                                type="checkbox"
                                id={`assignee-${employee._id}`}
                                checked={newTask.assignees.includes(employee._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewTask({ 
                                      ...newTask, 
                                      assignees: [...newTask.assignees, employee._id] 
                                    })
                                  } else {
                                    setNewTask({ 
                                      ...newTask, 
                                      assignees: newTask.assignees.filter(id => id !== employee._id) 
                                    })
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <label 
                                htmlFor={`assignee-${employee._id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {employee.name} {employee.surname}
                              </label>
                            </div>
                          ))}
                          {employees.length === 0 && (
                            <p className="text-sm text-gray-500">Henüz çalışan yok</p>
                          )}
                        </div>
                        {newTask.assignees.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            {newTask.assignees.length} kişi seçildi
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="task-priority">Öncelik *</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: string) => setNewTask({ ...newTask, priority: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Öncelik seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Düşük">Düşük</SelectItem>
                            <SelectItem value="Orta">Orta</SelectItem>
                            <SelectItem value="Yüksek">Yüksek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="task-deadline">Son Tarih *</Label>
                        <Input
                          id="task-deadline"
                          type="date"
                          value={newTask.deadline}
                          onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-project">Proje *</Label>
                        <Select
                          value={newTask.project}
                          onValueChange={(value: string) => setNewTask({ ...newTask, project: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Proje seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project._id} value={project._id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">
                        Görev Ata
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-600">{getProjectName(task.project)}</p>
                          <p className="text-sm text-gray-500">Atanan: {task.assignee || 'Belirlenmemiş'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              task.priority === "Yüksek"
                                ? "destructive"
                                : task.priority === "Orta"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant={task.status === "Tamamlandı" ? "default" : "outline"}>{task.status}</Badge>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proje İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project._id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{project.name}</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Çalışan Performansı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div key={employee._id} className="flex items-center justify-between">
                        <span className="text-sm">{employee.name}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={employee.performance || 0} className="w-20 h-2" />
                          <span className="text-sm font-medium">{employee.performance || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>Şirket ayarlarını yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Şirket Adı</Label>
                    <Input id="company-name" defaultValue="Örnek Şirket A.Ş." />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Şirket E-postası</Label>
                    <Input id="company-email" type="email" defaultValue="info@company.com" />
                  </div>
                  <div>
                    <Label htmlFor="working-hours">Çalışma Saatleri</Label>
                    <Input id="working-hours" defaultValue="09:00 - 18:00" />
                  </div>
                  <Button>Ayarları Kaydet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
      )}
    </div>

      {/* Çalışan Ekleme Modalı */}
      <Dialog open={addEmployeeDialog} onOpenChange={setAddEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Çalışan Ekle</DialogTitle>
            <DialogDescription>Yeni bir çalışan ekleyin</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="emp-name">Ad</Label>
              <Input id="emp-name" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="emp-surname">Soyad</Label>
              <Input id="emp-surname" value={newEmployee.surname} onChange={e => setNewEmployee({ ...newEmployee, surname: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="emp-email">E-posta</Label>
              <Input id="emp-email" type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="emp-password">Şifre</Label>
              <Input id="emp-password" type="password" value={newEmployee.password} onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full">Çalışan Ekle</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
