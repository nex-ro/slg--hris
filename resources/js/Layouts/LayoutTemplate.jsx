import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  Search, User, Settings, Bell, LayoutDashboard, Users, Calendar, LogOut, LogIn,
  Menu, X, Home, ChevronRight, ChevronDown, Activity, BarChart3, FileText,
  List, ClipboardCheck, XCircle, FolderOpen, Calendar1, LogOutIcon, Clock,Thermometer,CalendarClock,MapPin,
  Umbrella,
  UmbrellaIcon
} from 'lucide-react';

const LayoutTemplate = ({ children }) => {
  const { auth = {}, url } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const currentPath = usePage().url;
  const userRole = auth?.user?.role;
  const userId = auth?.user?.id;
  const userDivisi = auth?.user?.divisi;
    

  const toggleNotification = () => {
    setNotificationOpen(!notificationOpen);
    if (!notificationOpen) {
      fetchNotifications(); 
    }
  };

  useEffect(() => {
    if (auth?.user) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [auth?.user]);

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
  };

  const fetchNotifications = async () => {
    if (!auth?.user) return;
    setLoadingNotifications(true);
    try {
      const response = await fetch('/notifications', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
        setNotificationCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      const response = await fetch(`/notifications/${notification.id}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken()
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update notification list
        fetchNotifications();
        
        // Close dropdown
        setNotificationOpen(false);
        
        // Redirect jika link tidak kosong
        if (result.link && result.link.trim() !== '') {
          // Cek apakah link internal atau eksternal
          if (result.link.startsWith('http://') || result.link.startsWith('https://')) {
            window.location.href = result.link; // External link
          } else {
            window.location.href = result.link; // Internal link (relative path)
          }
        }
      } else {
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken()
        },
        credentials: 'include'
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const getMenuItems = () => {
    const hrdMenu = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/HRD/dashboard' },
      { icon: Users, label: 'Pegawai', href: '/pegawai',
        subItems: [
          { icon: List, label: 'Daftar Pegawai', href: '/pegawai/list' },
          { icon: LogOutIcon, label: 'Resign', href: '/pegawai/resign' },
        ]
      },
      { icon: Calendar, label: 'Absensi', href: '/absensi',
        subItems: [
          { icon: List, label: 'List Absensi', href: '/absensi/list' },
          { icon: ClipboardCheck, label: 'Input Absensi Harian', href: '/absensi/input-harian' },
          { icon: XCircle, label: 'Input Absensi Tidak Hadir', href: '/absensi/input-tidak-hadir' },
          { icon: Calendar1, label: 'Atur Liburan', href: '/holidays' },
          { icon: FolderOpen, label: 'Dokumen Absensi', href: '/absensi/dokumen' },
        ]
      },
      {
        icon: FileText,
        label: 'Perizinan',
        href: '/perizinan',
        subItems: [
          { icon: Thermometer, label: 'Sakit', href: '/perizinan/sakit' },
          { icon: CalendarClock, label: 'Keluar Kantor', href: '/perizinan/keluar-kantor' },
          { icon: UmbrellaIcon, label: 'Izin Cuti', href: '/perizinan/cuti'},
        ],
      },
      // { icon: BarChart3, label: 'Laporan', href: '/reports/index' },
    ];

    const headMenu = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/HEAD/dashboard' },
      { icon: Users, label: 'Pegawai', href: '/pegawai',
        subItems: [
          { icon: List, label: 'Daftar Pegawai', href: '/pegawai/list' },
          { icon: LogOutIcon, label: 'Resign', href: '/pegawai/resign' },
        ]
      },
      { icon: Calendar, label: 'List Absensi', href: userDivisi ? `/absensi/list/${userDivisi.toLowerCase().replace(/\s+/g, '-')}` : '/absensi/list'},
      {
        icon: FileText,
        label: 'Perizinan',
        href: '/perizinan',
        subItems: [
          { icon: Thermometer, label: 'Sakit', href: '/perizinan/sakit' },
          { icon: CalendarClock, label: 'Keluar Kantor', href: '/perizinan/keluar-kantor' },
          { icon: UmbrellaIcon, label: 'Izin Cuti', href: '/perizinan/cuti'},
          
          // { icon: MapPin, label: 'Dinas Luar', href: '/perizinan/dinas-luar' },
        ],
      },
      // { icon: BarChart3, label: 'Laporan', href: '/reports/index' },
    ];

    const pegawaiMenu = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
      { icon: Calendar,label: 'Absen Saya', href: `/pegawai/absensi/${userId}` },
      { icon: FileText, label: 'Dokumen', href: '/dokumen' },
      { icon: Thermometer, label: 'Sakit', href: '/pegawai/sakit' },
      { icon: CalendarClock, label: 'Izin Keluar Kantor', href: '/pegawai/izin' },
      { icon: UmbrellaIcon, label: 'Izin Cuti', href: '/pegawai/cuti'},
    ];

    // Return menu based on user role
    if (userRole === 'pegawai' || userRole === 'karyawan' || userRole === 'employee') {
      return pegawaiMenu;
    } else if (userRole === 'hrd') {
      return hrdMenu;
    } else if (userRole === 'atasan' || userRole === 'head') {
      return headMenu;
    }
  
    // Default fallback to HRD menu
    return hrdMenu;
  };

  const menuItems = getMenuItems();

  const isActive = (href) => {
    if (currentPath === href) return true;
    const normalizedPath = currentPath.replace(/\/$/, '');
    const normalizedHref = href.replace(/\/$/, '');
    return normalizedPath.startsWith(normalizedHref) && normalizedHref !== '/dashboard';
  };

  const isSubMenuActive = (subItems) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActive(subItem.href));
  };

  const toggleSubMenu = (index) => {
    setExpandedMenu(expandedMenu === index ? null : index);
  };

  useEffect(() => {
    menuItems.forEach((item, index) => {
      if (item.subItems && isSubMenuActive(item.subItems)) {
        setExpandedMenu(index);
      }
    });
  }, [currentPath]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentPageLabel = () => {
    for (const item of menuItems) {
      if (item.subItems) {
        const subItem = item.subItems.find(sub => isActive(sub.href));
        if (subItem) return subItem.label;
      }
      if (isActive(item.href)) return item.label;
    }
    return 'Dashboard';
  };

  const roleBadge = () => {
    const roleColors = {
      'hrd': 'from-purple-500 to-purple-600',
      'head': 'from-blue-500 to-blue-600',
      'admin': 'from-red-500 to-red-600',
      'pegawai': 'from-green-500 to-green-600',
      'karyawan': 'from-green-500 to-green-600',
      'employee': 'from-green-500 to-green-600',
    };
    const roleLabels = {
      'hrd': 'HRD', 'head': 'Head', 'admin': 'Admin', 
      'pegawai': 'Pegawai', 'karyawan': 'Pegawai', 'employee': 'Pegawai',
    };
    const color = roleColors[userRole?.toLowerCase()] || 'from-gray-500 to-gray-600';
    const label = roleLabels[userRole?.toLowerCase()] || 'User';
    return { color, label };
  };

  const badge = roleBadge();

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static inset-y-0 left-0 z-30 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 transform transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <img src="/asset/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="text-white font-bold text-lg">My-SLG</span>
                  <p className="text-gray-400 text-sm">Management System</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block text-gray-400 hover:text-white p-1 hover:bg-gray-700/50 rounded-lg">
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {auth?.user && !sidebarCollapsed && (
            <div className="mx-4 mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-gray-900 font-semibold text-sm">
                    {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{auth?.user?.name || 'User'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${badge.color} text-white`}>
                      {badge.label}
                    </span>
                    <Activity className="w-3 h-3 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubMenu = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenu === index;
              const hasActiveSubItem = hasSubMenu && isSubMenuActive(item.subItems);
              
              return (
                <div key={index}>
                  {hasSubMenu ? (
                    <button onClick={() => toggleSubMenu(index)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                        sidebarCollapsed ? 'justify-center' : 'space-x-3'
                      } ${hasActiveSubItem ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>
                      <Icon className="w-5 h-5" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link href={item.href}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                        sidebarCollapsed ? 'justify-center' : 'space-x-3'
                      } ${active ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>
                      <Icon className="w-5 h-5" />
                      {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  )}

                  {hasSubMenu && isExpanded && !sidebarCollapsed && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem, subIndex) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.href);
                        return (
                          <Link key={subIndex} href={subItem.href}
                            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all ${
                              subActive ? 'bg-blue-600/30 text-white border-l-2 border-blue-400' 
                                : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'}`}>
                            <SubIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-700/50">
            {auth?.user ? (
              <Link href={route('logout')} method="post" as="button"
                className={`w-full flex items-center rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg transition-all ${
                  sidebarCollapsed ? 'justify-center px-4 py-3' : 'justify-center space-x-3 px-4 py-3'}`}>
                <LogOut className="w-5 h-5" />
                {!sidebarCollapsed && <span className="font-medium">Logout</span>}
              </Link>
            ) : (
              <Link href={route('login')}
                className={`w-full flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ${
                  sidebarCollapsed ? 'justify-center px-4 py-3' : 'justify-center space-x-3 px-4 py-3'}`}>
                <LogIn className="w-5 h-5" />
                {!sidebarCollapsed && <span className="font-medium">Login</span>}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Menu className="w-6 h-6" />
              </button>
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                <div className="flex items-center text-gray-500">
                  <Home className="w-4 h-4" />
                  <span className="ml-1">Home</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{getCurrentPageLabel()}</span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Cari data..."
                  className="w-80 pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative" ref={notificationRef}>
                  <button onClick={toggleNotification}
                    className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl">
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                  
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-40 max-h-96 overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
                        {notificationCount > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 font-medium">{notificationCount} Baru</span>
                            <button onClick={markAllAsRead} className="text-xs text-gray-600 hover:text-blue-600 font-medium">
                              Tandai Semua
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-80">
                        {loadingNotifications ? (
                          <div className="px-4 py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">Memuat notifikasi...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Tidak ada notifikasi</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notif) => (
                              <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  !notif.is_read ? 'bg-blue-50' : ''}`}>
                                <div className="flex items-start space-x-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    !notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                        {notif.title}
                                      </p>
                                      {notif.type && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          notif.type === 'all' ? 'bg-green-100 text-green-700' :
                                          notif.type === 'hrd' ? 'bg-blue-100 text-blue-700' :
                                          'bg-purple-100 text-purple-700'}`}>
                                          {notif.type === 'all' ? 'Semua' : notif.type === 'hrd' ? 'HRD' : 'Atasan'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl">
                  <Settings className="w-5 h-5" />
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                    {auth?.user ? (
                      <>
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                          <span className="text-gray-900 font-semibold text-sm">
                            {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    ) : <User className="w-5 h-5" />}
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                      {auth?.user ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                            <p className="text-sm text-gray-600 truncate">{auth?.user?.email}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${badge.color} text-white`}>
                              {badge.label}
                            </span>
                          </div>
                          <Link href="/profile/edit" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </Link>
                          <Link href="/logout" method="post" as="button"
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </Link>
                        </>
                      ) : (
                        <Link href="/login" className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <LogIn className="w-4 h-4" />
                          <span>Login</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <main className="p-4 sm:p-6 space-y-6">
            {children || (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Selamat datang di My-SLG</h3>
                <p className="text-gray-600">Gunakan menu di sebelah kiri untuk navigasi ke berbagai fitur sistem.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LayoutTemplate;