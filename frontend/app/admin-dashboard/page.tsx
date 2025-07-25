"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  Users,
  Database,
  Settings,
  Activity,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Server,
  HardDrive,
  Cpu,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { User, ActivityLog } from "@/types/api"

export default function AdminDashboard() {
  const [newUser, setNewUser] = useState({ name: "", surname: "", email: "", role: "", password: "" })
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [systemStats, setSystemStats] = useState<any>({ totalUsers: 0, activeUsers: 0, totalProjects: 0, systemUptime: "", storageUsed: 0, cpuUsage: 0, memoryUsage: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Kullanıcı düzenleme için state
  const [editUserDialog, setEditUserDialog] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  
  const handleEditUser = (user: any) => {
    setEditUser(user)
    setEditUserDialog(true)
  }
  
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.updateUser(editUser._id, editUser)
      setSuccessMsg("Kullanıcı başarıyla güncellendi!")
      setEditUserDialog(false)
      setEditUser(null)
      // Listeyi güncelle
      const usersRes = await apiClient.getUsers() as any
      setUsers((usersRes.data || usersRes) as User[])
    } catch (err: any) {
      setErrorMsg(err?.message || "Kullanıcı güncellenemedi.")
    }
  }

  useEffect(() => {
    // Authentication check
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      window.location.href = '/'
      return
    }
    
    try {
      const userData = JSON.parse(user) as User
      if (userData.role !== 'Admin') {
        window.location.href = '/'
        return
      }
      setCurrentUser(userData)
    } catch {
      window.location.href = '/'
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Kullanıcıları getir
        const usersRes = await apiClient.getUsers() as any
        const users: User[] = (usersRes.data || usersRes) as User[]
        setUsers(users)
        // Aktivite loglarını getir
        const logsRes = await apiClient.getActivityLogs() as any
        const logs: ActivityLog[] = (logsRes.data?.logs || logsRes.data || logsRes) as ActivityLog[]
        setActivityLogs(logs)
        // Sistem istatistiklerini getir
        const analyticsRes = await apiClient.getAnalytics() as any
        setSystemStats({
          totalUsers: analyticsRes.data?.overview?.totalUsers || 0,
          activeUsers: analyticsRes.data?.overview?.totalUsers || 0, // örnek
          totalProjects: analyticsRes.data?.overview?.totalProjects || 0,
          systemUptime: "99.9%", // örnek
          storageUsed: 75, // örnek
          cpuUsage: 45, // örnek
          memoryUsage: 62, // örnek
        })
      } catch (err: any) {
        setError(err?.message || "Veriler alınamadı.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = () => {
    apiClient.logout()
    window.location.href = "/"
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.createUser(newUser)
      setSuccessMsg("Kullanıcı başarıyla oluşturuldu!")
      setNewUser({ name: "", surname: "", email: "", role: "", password: "" })
      // Listeyi güncelle
      const usersRes = await apiClient.getUsers() as any
      setUsers((usersRes.data || usersRes) as User[])
    } catch (err: any) {
      setErrorMsg(err?.message || "Kullanıcı oluşturulamadı.")
    }
  }

  // Kullanıcı silme
  const handleDeleteUser = async (userId: string) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await apiClient.deleteUser(userId)
      setSuccessMsg("Kullanıcı başarıyla silindi!")
      // Listeyi güncelle
      const usersRes = await apiClient.getUsers() as any
      setUsers((usersRes.data || usersRes) as User[])
    } catch (err: any) {
      setErrorMsg(err?.message || "Kullanıcı silinemedi.")
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Paneli</h1>
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
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{systemStats.activeUsers} aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Durumu</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Çevrimiçi</div>
              <p className="text-xs text-muted-foreground">{systemStats.systemUptime} uptime</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Depolama</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.storageUsed}%</div>
              <p className="text-xs text-muted-foreground">Kullanılan alan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Kullanımı</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.cpuUsage}%</div>
              <p className="text-xs text-muted-foreground">Ortalama yük</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Kullanıcı Yönetimi</TabsTrigger>
            <TabsTrigger value="system">Sistem İzleme</TabsTrigger>
            <TabsTrigger value="database">Veritabanı</TabsTrigger>
            <TabsTrigger value="logs">Aktivite Logları</TabsTrigger>
            <TabsTrigger value="settings">Sistem Ayarları</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kullanıcı Yönetimi</CardTitle>
                  <CardDescription>Sistem kullanıcılarını görüntüleyin ve yönetin</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Yeni Kullanıcı
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                      <DialogDescription>Sisteme yeni bir kullanıcı ekleyin</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="user-name">Ad</Label>
                          <Input
                            id="user-name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="user-surname">Soyad</Label>
                          <Input
                            id="user-surname"
                            value={newUser.surname}
                            onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="user-email">E-posta</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-role">Rol</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Rol seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user-password">Şifre</Label>
                        <Input
                          id="user-password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Kullanıcı Oluştur
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Son Giriş</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name[0]}
                                {user.surname[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.name} {user.surname}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "Admin" ? "destructive" : user.role === "Manager" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Aktif" ? "default" : "secondary"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR') : 'Hiç giriş yapmamış'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sistem Performansı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CPU Kullanımı</span>
                      <span className="text-sm font-medium">{systemStats.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${systemStats.cpuUsage}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bellek Kullanımı</span>
                      <span className="text-sm font-medium">{systemStats.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${systemStats.memoryUsage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Depolama</span>
                      <span className="text-sm font-medium">{systemStats.storageUsed}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${systemStats.storageUsed}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Sistem Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sistem Durumu</span>
                      <Badge className="bg-green-100 text-green-800">Çevrimiçi</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="text-sm font-medium">{systemStats.systemUptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Toplam Kullanıcı</span>
                      <span className="text-sm font-medium">{systemStats.totalUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Aktif Kullanıcı</span>
                      <span className="text-sm font-medium">{systemStats.activeUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Toplam Proje</span>
                      <span className="text-sm font-medium">{systemStats.totalProjects}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Veritabanı Yönetimi</CardTitle>
                <CardDescription>Veritabanı durumunu izleyin ve yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">2.4 GB</div>
                    <div className="text-sm text-gray-600">Toplam Boyut</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-gray-600">Toplam Kayıt</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Server className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">15ms</div>
                    <div className="text-sm text-gray-600">Ortalama Yanıt</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button className="w-full bg-transparent" variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Veritabanı Yedekle
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Performans Analizi
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Veritabanı Ayarları
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aktivite Logları</CardTitle>
                <CardDescription>Sistem aktivitelerini izleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getActivityTypeColor(log.type)}>{log.type}</Badge>
                        <div>
                          <p className="font-medium text-sm">{log.userId}</p>
                          <p className="text-sm text-gray-600">{log.action}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>Genel sistem ayarlarını yönetin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Güvenlik Ayarları</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
                        <Input id="session-timeout" type="number" defaultValue="30" />
                      </div>
                      <div>
                        <Label htmlFor="password-policy">Minimum Şifre Uzunluğu</Label>
                        <Input id="password-policy" type="number" defaultValue="8" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">E-posta Ayarları</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtp-server">SMTP Sunucusu</Label>
                        <Input id="smtp-server" defaultValue="smtp.company.com" />
                      </div>
                      <div>
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input id="smtp-port" type="number" defaultValue="587" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Yedekleme Ayarları</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="backup-frequency">Yedekleme Sıklığı</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Saatlik</SelectItem>
                            <SelectItem value="daily">Günlük</SelectItem>
                            <SelectItem value="weekly">Haftalık</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="backup-retention">Yedek Saklama (gün)</Label>
                        <Input id="backup-retention" type="number" defaultValue="30" />
                      </div>
                    </div>
                  </div>
                  <Button className="w-full">Ayarları Kaydet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {successMsg && <div className="text-green-600 text-center mb-4">{successMsg}</div>}
        {errorMsg && <div className="text-red-500 text-center mb-4">{errorMsg}</div>}
      </div>
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
            <DialogDescription>Kullanıcı bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-user-name">Ad</Label>
                  <Input id="edit-user-name" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="edit-user-surname">Soyad</Label>
                  <Input id="edit-user-surname" value={editUser.surname} onChange={e => setEditUser({ ...editUser, surname: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-user-email">E-posta</Label>
                <Input id="edit-user-email" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="edit-user-role">Rol</Label>
                <Select value={editUser.role} onValueChange={value => setEditUser({ ...editUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-user-status">Durum</Label>
                <Select value={editUser.status} onValueChange={value => setEditUser({ ...editUser, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Pasif">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Güncelle</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
