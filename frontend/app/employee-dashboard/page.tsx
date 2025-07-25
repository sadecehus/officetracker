"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle, Clock, AlertCircle, BarChart3, HelpCircle, LogOut, Home, Edit, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Task, Project, HelpRequest } from "@/types/api"

export default function EmployeeDashboard() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout: authLogout } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskProgress, setTaskProgress] = useState<{ [key: string]: number }>({})
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [myHelpRequests, setMyHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [helpMessage, setHelpMessage] = useState("")
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Project name'i güvenli bir şekilde al
  const getProjectName = (project: string | { _id: string; name: string; description: string }): string => {
    if (typeof project === 'string') {
      return project
    }
    return project.name || 'Bilinmeyen Proje'
  }

  // AssignedBy bilgisini güvenli bir şekilde al
  const getAssignedByName = (assignedBy: string | { _id: string; name: string; surname: string; email: string }): string => {
    if (typeof assignedBy === 'string') {
      return assignedBy
    }
    return `${assignedBy.name || ''} ${assignedBy.surname || ''}`.trim() || assignedBy.email || 'Bilinmeyen Kullanıcı'
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
    if (currentUser.role !== 'Employee') {
      window.location.href = '/'
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Kendi görevlerini getir
        const tasksRes = await apiClient.getMyTasks() as any
        const tasks = (tasksRes.data || tasksRes) as Task[]
        setTasks(tasks)
        
        // Projeleri getir
        const projectsRes = await apiClient.getProjects() as any
        const projects = (projectsRes.data || projectsRes) as Project[]
        setProjects(projects)
        
        // Yardım taleplerini getir
        const helpRes = await apiClient.getHelpRequests() as any
        setHelpRequests((helpRes.data || helpRes) as HelpRequest[])
        // Kendi gönderdiği yardım taleplerini getir
        // (Varsa apiClient.getMyHelpRequests() fonksiyonu eklenebilir)
      } catch (err: any) {
        if (err.message?.includes("Oturum süresi dolmuş")) {
          // Session süresi dolmuşsa otomatik logout
          return
        }
        setError(err?.message || "Veriler alınamadı.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAuthenticated, currentUser, authLoading])

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Yüksek":
        return "bg-red-100 text-red-800"
      case "Orta":
        return "bg-yellow-100 text-yellow-800"
      case "Düşük":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Tamamlandı":
        return "bg-green-100 text-green-800"
      case "Devam Ediyor":
        return "bg-blue-100 text-blue-800"
      case "Bekliyor":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Görev ilerlemesi güncelleme
  const updateTaskProgress = async (taskId: string, newProgress: number) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.updateTask(taskId, { progress: newProgress })
      setSuccessMsg("Görev ilerlemesi başarıyla güncellendi!")
      // Listeyi güncelle
      const tasksRes = await apiClient.getMyTasks() as any
      const tasks = (tasksRes.data || tasksRes) as Task[]
      setTasks(tasks)
    } catch (err: any) {
      setErrorMsg(err?.message || "Görev güncellenemedi.")
    }
  }

  // Görev tamamlama
  const completeTask = async (taskId: string) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.updateTask(taskId, { progress: 100, status: "Tamamlandı" })
      setSuccessMsg("Görev başarıyla tamamlandı!")
      // Listeyi güncelle
      const tasksRes = await apiClient.getMyTasks() as any
      const tasks = (tasksRes.data || tasksRes) as Task[]
      setTasks(tasks)
    } catch (err: any) {
      setErrorMsg(err?.message || "Görev tamamlanamadı.")
    }
  }

  const handleLogout = () => {
    authLogout()
  }

  const requestHelp = (task: Task) => {
    setSelectedTask(task)
    setShowHelpDialog(true)
  }

  // Yardım talebi oluşturma
  const submitHelpRequest = async () => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      if (!selectedTask) throw new Error("Görev seçilmedi.")
      await apiClient.createHelpRequest({ taskId: selectedTask._id, message: helpMessage })
      setSuccessMsg("Yardım talebi başarıyla gönderildi!")
      setHelpMessage("")
      setShowHelpDialog(false)
      // Listeyi güncelle
      const helpRes = await apiClient.getHelpRequests() as any
      setHelpRequests((helpRes.data || helpRes) as HelpRequest[])
    } catch (err: any) {
      setErrorMsg(err?.message || "Yardım talebi gönderilemedi.")
    }
  }

  // Yardım talebini kabul etme
  const acceptHelpRequest = async (requestId: string) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.acceptHelpRequest(requestId)
      setSuccessMsg("Yardım talebi kabul edildi!")
      // Listeyi güncelle
      const helpRes = await apiClient.getHelpRequests() as any
      setHelpRequests((helpRes.data || helpRes) as HelpRequest[])
    } catch (err: any) {
      setErrorMsg(err?.message || "Yardım talebi kabul edilemedi.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Çalışan Paneli</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
               
                <span className="text-sm font-medium">{currentUser?.name} {currentUser?.surname}</span>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Görevler</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'Tamamlandı').length}</div>
              <p className="text-xs text-muted-foreground">Devam eden görevler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'Tamamlandı').length}</div>
              <p className="text-xs text-muted-foreground">Başarıyla tamamlanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yardım Talepleri</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myHelpRequests.length}</div>
              <p className="text-xs text-muted-foreground">Gönderilen talepler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verimlilik</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tasks.length > 0 
                  ? Math.round((tasks.filter(t => t.status === 'Tamamlandı').length / tasks.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Tamamlama oranı</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tasks">Görevlerim</TabsTrigger>
            <TabsTrigger value="projects">Projeler</TabsTrigger>
            <TabsTrigger value="calendar">Takvim</TabsTrigger>
            <TabsTrigger value="help">Yardım</TabsTrigger>
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Görevlerim</CardTitle>
                <CardDescription>Atanmış görevlerinizi görüntüleyin ve yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-600">{getProjectName(task.project)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>İlerleme</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Son tarih: {new Date(task.deadline).toLocaleDateString('tr-TR')}</span>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => setSelectedTask(task)}>
                            Detaylar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => requestHelp(task)}>
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Yardım
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Görev Detayları Modalı */}
            {selectedTask && !showHelpDialog && (
              <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedTask.title}</DialogTitle>
                    <DialogDescription>Görev Detayları ve İlerleme Takibi</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Proje</Label>
                        <p className="text-sm text-gray-600">{getProjectName(selectedTask.project)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Öncelik</Label>
                        <Badge className={getPriorityColor(selectedTask.priority)}>{selectedTask.priority}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Durum</Label>
                        <Badge className={getStatusColor(selectedTask.status)}>{selectedTask.status}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Son Tarih</Label>
                        <p className="text-sm text-gray-600">{new Date(selectedTask.deadline).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Açıklama</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Atayan</Label>
                      <p className="text-sm text-gray-600">{getAssignedByName(selectedTask.assignedBy)}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">İlerleme Durumu</Label>
                        <span className="text-sm font-medium">
                          {taskProgress[selectedTask._id] || selectedTask.progress}%
                        </span>
                      </div>
                      <Progress value={taskProgress[selectedTask._id] || selectedTask.progress} className="h-3" />

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="progress-input" className="text-sm">
                          İlerleme güncelle:
                        </Label>
                        <Input
                          id="progress-input"
                          type="number"
                          min="0"
                          max="100"
                          className="w-20"
                          placeholder={String(taskProgress[selectedTask._id] || selectedTask.progress)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const value = Number.parseInt((e.target as HTMLInputElement).value)
                              if (value >= 0 && value <= 100) {
                                updateTaskProgress(selectedTask._id, value)
                              }
                            }
                          }}
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          const input = document.getElementById("progress-input") as HTMLInputElement
                          const value = Number.parseInt(input.value)
                          if (value >= 0 && value <= 100) {
                            updateTaskProgress(selectedTask._id, value)
                          }
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Görev Güncelle
                      </Button>
                      <Button variant="outline" onClick={() => requestHelp(selectedTask)} className="flex-1">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Yardım Talep Et
                      </Button>
                      {selectedTask.status !== "Tamamlandı" && (
                        <Button onClick={() => completeTask(selectedTask._id)} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Görevi Tamamla
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setSelectedTask(null)} className="flex-1">
                        Kapat
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Yardım Talep Modalı */}
            <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yardım Talep Et</DialogTitle>
                  <DialogDescription>{selectedTask?.title} görevi için yardım talebinde bulunun</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="help-message">Yardım Mesajı (İsteğe bağlı)</Label>
                    <Textarea
                      id="help-message"
                      placeholder="Hangi konuda yardıma ihtiyacınız var? Detayları açıklayın..."
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={submitHelpRequest} className="flex-1">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Yardım Talep Et
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowHelpDialog(false)
                        setHelpMessage("")
                      }}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projelerim</CardTitle>
                <CardDescription>Dahil olduğunuz projelerin durumu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div key={project._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge variant="outline">
                          {tasks.filter(t => {
                            const projectName = getProjectName(t.project)
                            return projectName === project.name
                          }).length} görev
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>İlerleme</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Takvim</CardTitle>
                  <CardDescription>Görev son tarihlerinizi takip edin</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Yaklaşan Son Tarihler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks
                      .filter((task) => task.status !== "Tamamlandı")
                      .map((task) => (
                        <div key={task._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-gray-600">{new Date(task.deadline).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Yardım Talepleri</CardTitle>
                  <CardDescription>Diğer çalışanların yardım taleplerini görün</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {helpRequests.map((request) => (
                      <div key={request._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">Görev ID: {request.taskId}</h3>
                            <p className="text-sm text-gray-500">Talep eden: {request.requestedBy}</p>
                            <Badge variant="outline" className="text-xs">
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            {request.status === "Bekliyor" && (
                              <Button size="sm" variant="outline" onClick={() => acceptHelpRequest(request._id)}>
                                <Users className="h-4 w-4 mr-2" />
                                Yardım Et
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gönderdiğim Talepler</CardTitle>
                  <CardDescription>Yardım taleplerinin durumu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myHelpRequests.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">Henüz yardım talebi göndermediniz.</p>
                    ) : (
                      myHelpRequests.map((request) => (
                        <div key={request._id} className="border rounded-lg p-4">
                          <div className="space-y-2">
                            <h3 className="font-medium">Görev ID: {request.taskId}</h3>
                            <Badge variant="outline" className="text-xs">
                              {request.status}
                            </Badge>
                            {request.message && <p className="text-sm text-gray-500 italic">"{request.message}"</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aylık Performans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Tamamlanan Görevler</span>
                      <span className="font-bold">{tasks.filter(t => t.status === 'Tamamlandı').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aktif Görevler</span>
                      <span className="font-bold">{tasks.filter(t => t.status !== 'Tamamlandı').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verimlilik Skoru</span>
                      <span className="font-bold">
                        {tasks.length > 0 
                          ? Math.round((tasks.filter(t => t.status === 'Tamamlandı').length / tasks.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yardım Talepleri</span>
                      <span className="font-bold">{myHelpRequests.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Proje Katkıları</CardTitle>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {successMsg && <div className="text-green-600 text-center mb-4">{successMsg}</div>}
      {errorMsg && <div className="text-red-500 text-center mb-4">{errorMsg}</div>}
    </div>
  )
}
