import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  Search, 
  User, 
  Settings, 
  Bell, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  LogOut,
  LogIn,
  Menu,
  X,
  Home,
  ChevronRight,
  ChevronDown,
  Activity,
  BarChart3,
  FileText,
  Shield,
  List,
  ClipboardCheck,
  XCircle,
  FolderOpen,
  Calendar1,
  LogOutIcon,
  Clock,
  UserCheck
} from 'lucide-react';

const LayoutTemplate = ({ children }) => {
  const { auth = {}, url } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationCount] = useState(3);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const dropdownRef = useRef(null);
  
  const currentPath = usePage().url;
  const userRole = auth?.user?.role; // Asumsi role ada di auth.user.role

  // Menu Items berdasarkan Role
  const getMenuItems = () => {
    // Menu untuk HRD dan Atasan
    const hrdAtasanMenu = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/HRD/dashboard' },
      { 
        icon: Users, 
        label: 'Pegawai', 
        href: '/pegawai',
        subItems: [
          { icon: List, label: 'Daftar Pegawai', href: '/pegawai/list' },
          { icon: LogOutIcon, label: 'Resign', href: '/pegawai/resign' },
        ]
      },
      { 
        icon: Calendar, 
        label: 'Absensi', 
        href: '/absensi',
        subItems: [
          { icon: List, label: 'List Absensi', href: '/absensi/list' },
          { icon: ClipboardCheck, label: 'Input Absensi Harian', href: '/absensi/input-harian' },
          { icon: XCircle, label: 'Input Absensi Tidak Hadir', href: '/absensi/input-tidak-hadir' },
          { icon: Calendar1, label: 'Atur Liburan', href: '/holidays' },
          { icon: FolderOpen, label: 'Dokumen Absensi', href: '/absensi/dokumen' },
        ]
      },
      { icon: BarChart3, label: 'Laporan', href: '/reports/index' },
    ];

    // Menu untuk Pegawai
    const pegawaiMenu = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
      { 
        icon: Calendar, 
        label: 'Absensi Saya', 
        href: '/pegawai/absensi',
        subItems: [
          { icon: ClipboardCheck, label: 'Absen Hari Ini', href: '/pegawai/absensi/checkin' },
          { icon: Clock, label: 'Riwayat Absensi', href: '/pegawai/absensi/history' },
          { icon: XCircle, label: 'Pengajuan Izin', href: '/pegawai/absensi/izin' },
        ]
      },
      { 
        icon: FileText, 
        label: 'Dokumen', 
        href: '/dokumen',
      },
      { 
        icon: LogOutIcon, 
        label: 'Resign', 
        href: '/pegawai/resign/request'
      },
    ];

    // Return menu berdasarkan role
    if (userRole === 'pegawai' || userRole === 'karyawan' || userRole === 'employee') {
      return pegawaiMenu;
    } else if (userRole === 'hrd' || userRole === 'atasan' || userRole === 'admin') {
      return hrdAtasanMenu;
    } else {
      // Default menu jika role tidak dikenali
      return hrdAtasanMenu;
    }
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  // Function untuk mendapatkan badge role
  const getRoleBadge = () => {
    const roleColors = {
      'hrd': 'from-purple-500 to-purple-600',
      'atasan': 'from-blue-500 to-blue-600',
      'admin': 'from-red-500 to-red-600',
      'pegawai': 'from-green-500 to-green-600',
      'karyawan': 'from-green-500 to-green-600',
      'employee': 'from-green-500 to-green-600',
    };

    const roleLabels = {
      'hrd': 'HRD',
      'atasan': 'Atasan',
      'admin': 'Admin',
      'pegawai': 'Pegawai',
      'karyawan': 'Pegawai',
      'employee': 'Pegawai',
    };

    const color = roleColors[userRole?.toLowerCase()] || 'from-gray-500 to-gray-600';
    const label = roleLabels[userRole?.toLowerCase()] || 'User';

    return { color, label };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50 flex-shrink-0">
            <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
                <img
                  src="/asset/logo.png"
                  alt="Logo"
                  className="w-12 h-12 object-contain drop-shadow-md"
                />
              </div>

              {!sidebarCollapsed && (
                <div>
                  <span className="text-white font-bold text-lg">My-SLG</span>
                  <p className="text-gray-400 text-sm">Management System</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Desktop Toggle Button */}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-lg"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
              {/* Mobile Close Button */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* User Info Card */}
          {auth?.user && !sidebarCollapsed && (
            <div className="mx-4 mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <span className="text-gray-900 font-semibold text-sm">
                    {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {auth?.user?.name || 'User'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${roleBadge.color} text-white`}>
                      {roleBadge.label}
                    </span>
                    <Activity className="w-3 h-3 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Collapsed User Avatar */}
          {auth?.user && sidebarCollapsed && (
            <div className="mx-4 mt-4 flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <span className="text-gray-900 font-semibold text-sm">
                  {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${roleBadge.color}`}></span>
            </div>
          )}

          {/* Menu Items - Scrollable */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubMenu = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenu === index;
              const hasActiveSubItem = hasSubMenu && isSubMenuActive(item.subItems);
              
              return (
                <div key={index}>
                  {hasSubMenu ? (
                    <button
                      onClick={() => toggleSubMenu(index)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        sidebarCollapsed ? 'justify-center' : 'space-x-3'
                      } ${
                        hasActiveSubItem
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 ${hasActiveSubItem ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        sidebarCollapsed ? 'justify-center' : 'space-x-3'
                      } ${
                        active 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'
                      }`}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon className={`w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {!active && <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </>
                      )}
                    </Link>
                  )}

                  {hasSubMenu && isExpanded && !sidebarCollapsed && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem, subIndex) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.href);
                        
                        return (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                              subActive 
                                ? 'bg-blue-600/30 text-white border-l-2 border-blue-400' 
                                : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                            }`}
                          >
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

          {/* Auth Button at Bottom */}
          <div className="p-4 flex-shrink-0 border-t border-gray-700/50">
            {auth?.user ? (
              <Link 
                href={route('logout')} 
                method="post" 
                as="button"
                className={`w-full flex items-center rounded-xl bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg transition-all duration-200 group ${
                  sidebarCollapsed ? 'justify-center px-4 py-3' : 'justify-center space-x-3 px-4 py-3'
                }`}
                title={sidebarCollapsed ? 'Logout' : ''}
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {!sidebarCollapsed && <span className="font-medium">Logout</span>}
              </Link>
            ) : (
              <Link 
                href={route('login')} 
                className={`w-full flex items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 group ${
                  sidebarCollapsed ? 'justify-center px-4 py-3' : 'justify-center space-x-3 px-4 py-3'
                }`}
                title={sidebarCollapsed ? 'Login' : ''}
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {!sidebarCollapsed && <span className="font-medium">Login</span>}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 h-screen">
        {/* Top Navigation - Sticky */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-10">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Left Side - Mobile Menu + Breadcrumb */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center space-x-2 text-sm">
                <div className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                  <Home className="w-4 h-4" />
                  <span className="ml-1">Home</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {getCurrentPageLabel()}
                </span>
              </nav>
            </div>

            {/* Right Side - Search + Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari data..."
                  className="block w-80 pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                  <Settings className="w-5 h-5" />
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    {auth?.user ? (
                      <>
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                          <span className="text-gray-900 font-semibold text-sm">
                            {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                      {auth?.user ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                            <p className="text-sm text-gray-600 truncate">{auth?.user?.email}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r ${roleBadge.color} text-white`}>
                              {roleBadge.label}
                            </span>
                          </div>
                          <Link 
                            href="/profile/edit" 
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </Link>
                          <Link 
                            href="/logout" 
                            method="post" 
                            as="button"
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </Link>
                        </>
                      ) : (
                        <Link 
                          href="/login" 
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
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

          {/* Mobile Search */}
          <div className="md:hidden px-4 pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari data..."
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Page Title & Stats Cards */}
       

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 space-y-6">
            {/* Content Area for Children */}
            {children && (
              <div>
                {children}
              </div>
            )}

            {/* Default Content if no children */}
            {!children && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Selamat datang di My-SLG</h3>
                  <p className="text-gray-600">Gunakan menu di sebelah kiri untuk navigasi ke berbagai fitur sistem.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LayoutTemplate;