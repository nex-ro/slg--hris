  import { useState, useEffect, useMemo } from 'react';
  import { Head, router } from '@inertiajs/react';
  import LayoutTemplate from "@/Layouts/LayoutTemplate";
  import { ToastContainer } from 'react-toastify';
  import {
    Pencil,
    Trash2,
    Plus,
    X,
    Upload,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Users,
    UserX,
    Eye,
    EyeOff,
    Send,
  } from 'lucide-react';
  import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
  import { toast } from 'react-toastify';
  import 'react-toastify/dist/ReactToastify.css';

  const activeColumns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Nama' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'active', header: 'Status' },
    { accessorKey: 'tmk', header: 'TMK' },
    { accessorKey: 'divisi', header: 'Divisi' },
    { accessorKey: 'jabatan', header: 'Jabatan' },
    { accessorKey: 'tower', header: 'Tower' },
    { id: 'actions', header: 'Aksi', enableSorting: false },
  ];

  const resignColumns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Nama' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'active', header: 'Status' },
    { accessorKey: 'tanggal_keluar', header: 'Tanggal Keluar' },
    { accessorKey: 'divisi', header: 'Divisi' },
    { accessorKey: 'jabatan', header: 'Jabatan' },
    { accessorKey: 'tower', header: 'Tower' },
    { id: 'actions', header: 'Aksi', enableSorting: false },
  ];

  function Pegawai({ flash }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [showEmployeePassword, setShowEmployeePassword] = useState(false);
    const [showEmployeePasswordConfirmation, setShowEmployeePasswordConfirmation] = useState(false);

    const [users, setUsers] = useState({ data: [], links: [], total: 0, from: 0, to: 0, last_page: 1 });
    const [divisiList, setDivisiList] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisi, setSelectedDivisi] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState('');
  const [selectedTower, setSelectedTower] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState([]);
    
useEffect(() => {
  fetchData(1);
  
  const interval = setInterval(() => {
    fetchData(currentPage);
  }, 150000);
  
  return () => clearInterval(interval);
}, [activeTab, sorting]);

useEffect(() => {
  if (flash?.error) toast.error(flash.error);
}, [flash?.error]);

    const [formData, setFormData] = useState({
    id: '',  // ✅ TAMBAHKAN INI
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'pegawai',
    active: true,
    tmk: '',
    tanggal_keluar: '',
    divisi: '',
    jabatan: '',
    tower: '',
    keterangan: '',
    ttd: null
  });
    const [ttdPreview, setTtdPreview] = useState(null);
  // Debounced effect untuk semua filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1); // Selalu fetch dari page 1 ketika filter berubah
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDivisi, selectedJabatan, selectedTower]);


  const [invitingId, setInvitingId] = useState(null);

  const handleSendInvite = async (user) => {
    if (!user.email) {
      toast.warning('Pegawai ini tidak memiliki alamat email!');
      return;
    }

    if (!confirm(`Kirim link undangan aktivasi akun & buat password ke email ${user.email} (${user.name})?`)) {
      return;
    }

    setInvitingId(user.id);
    try {
      const response = await fetch(`/pegawai/${user.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message || 'Link undangan berhasil dikirim!');
      } else {
        toast.error(result.message || 'Gagal mengirim email undangan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengirim undangan.');
    } finally {
      setInvitingId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDivisi('');
    setSelectedJabatan('');
    setSelectedTower('');
    // Data akan otomatis di-fetch karena useEffect akan trigger
  };



  const fetchData = async (page = 1) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedDivisi) params.append('divisi', selectedDivisi);
    if (selectedJabatan) params.append('jabatan', selectedJabatan);
    if (selectedTower) params.append('tower', selectedTower);
    const defaultSortField = activeTab === 'resign' ? 'tanggal_keluar' : 'id';
    const defaultSortDir = activeTab === 'resign' ? 'desc' : 'asc';
    params.append('sortBy', sorting[0]?.id || defaultSortField);
    params.append('sortDirection', sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : defaultSortDir);
    params.append('page', page);
    params.append('status', activeTab); // ✅ TAMBAHKAN INI

    const response = await fetch(`/api/pegawai?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const data = await response.json();
    setUsers(data.users);
    setDivisiList(data.divisiList || []);
    setJabatanList(data.jabatanList || []);
    setCurrentPage(page);
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Gagal memuat data pegawai. Silakan coba lagi.');
  } finally {
    setLoading(false);
  }
};


    const resetForm = () => {
      setFormData({
        id: '',  
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'pegawai',
        active: true,
        tmk: '',
        tanggal_keluar: '',
        divisi: '',
        jabatan: '',
        tower: '',
        keterangan: '',
        ttd: null
      });
      setTtdPreview(null);
      setIsEditing(false);
      setCurrentUser(null);
      setShowEmployeePassword(false);
      setShowEmployeePasswordConfirmation(false);
    };

    const openAddModal = () => {
      resetForm();
      setIsModalOpen(true);
    };

    const openEditModal = (user) => {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.role,
        active: user.active,
        tmk: user.tmk || '',
          tanggal_keluar: user.tanggal_keluar || '', 
        divisi: user.divisi || '',
        jabatan: user.jabatan || '',
        tower: user.tower || '',
        keterangan: user.keterangan || '',
        ttd: null
      });
      setTtdPreview(user.ttd ? `/storage/ttd/${user.ttd}` : null);
      setCurrentUser(user);
      setIsEditing(true);
      setShowEmployeePassword(false);
      setShowEmployeePasswordConfirmation(false);
      setIsModalOpen(true);
    };

    const closeModal = () => {
      setIsModalOpen(false);
      resetForm();
    };

    const handleSubmit = (e) => {
      e.preventDefault();

      if (isSubmittingForm) return;
      if (formData.password && formData.password !== formData.password_confirmation) {
        toast.error('Konfirmasi password tidak cocok.');
        return;
      }
      if (!formData.password && formData.password_confirmation) {
        toast.error('Masukkan password terlebih dahulu.');
        return;
      }

      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'ttd' && value) {
          submitData.append('ttd', value);
        } else if (key === 'active') {
          submitData.append('active', value ? '1' : '0');
        } else if (key === 'tanggal_keluar') {
          submitData.append(key, value || '');
        } else if (key === 'password_confirmation' && !formData.password) {
          return;
        } else if (value !== null && value !== '') {
          submitData.append(key, value);
        }
      });

      if (isEditing) {
        submitData.append('_method', 'PUT');
      }

      router.post(isEditing ? `/pegawai/${currentUser.id}` : '/pegawai', submitData, {
        onStart: () => setIsSubmittingForm(true),
        onFinish: () => setIsSubmittingForm(false),
        onSuccess: () => {
          closeModal();
          fetchData(isEditing ? currentPage : 1);
        },
        onError: (errors) => {
          const errorMessage = (Array.isArray(errors.id) ? errors.id[0] : errors.id)
            || Object.values(errors).flat().find(Boolean);
          toast.error(errorMessage || 'Gagal menyimpan data pegawai.', {
            containerId: 'hrd-pegawai-form'
          });
        },
        onException: () => toast.error('Gagal menyimpan data pegawai. Silakan coba lagi.', {
          containerId: 'hrd-pegawai-form'
        }),
        forceFormData: true
      });
    };

    const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      router.delete(`/pegawai/${id}`, {
        onSuccess: () => {
          fetchData(currentPage); 
        },
        onError: () => toast.error('Gagal menghapus data pegawai.')
      });
    }
  };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2048000) {
          toast.error('Ukuran file maksimal 2MB.');
          e.target.value = '';
          return;
        }
        if (!file.type.startsWith('image/')) {
          toast.error('File harus berupa gambar.');
          e.target.value = '';
          return;
        }
        setFormData(prev => ({ ...prev, ttd: file }));
        setTtdPreview(URL.createObjectURL(file));
      }
    };

    const handlePageChange = (page) => {
    fetchData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
    const removeTtd = () => {
      setFormData(prev => ({ ...prev, ttd: null }));
      setTtdPreview(null);
    };

    const userData = users.data || [];
    const activeFilters = [searchTerm, selectedDivisi, selectedJabatan, selectedTower].filter(Boolean).length;
    const currentColumns = useMemo(() => {
      return activeTab === 'resign' ? resignColumns : activeColumns;
    }, [activeTab]);

    const table = useReactTable({
      data: userData,
      columns: currentColumns,
      getCoreRowModel: getCoreRowModel(),
      manualSorting: true,
      state: { sorting },
      onSortingChange: setSorting,
    });

    return (
      <LayoutTemplate>
          <ToastContainer
            containerId="hrd-pegawai-form"
            position="top-right"
            autoClose={5000}
            style={{ zIndex: 10000 }}
          />
          <Head title="Pegawai" />
        <div className="">
        <div className="mb-6 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Data Pegawai</h1>
      {/* ✅ TAMBAHKAN INI */}
      <button
        onClick={() => fetchData(currentPage)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        title="Refresh data"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
    <button
      onClick={openAddModal}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      <Plus size={20} />
      Tambah Pegawai
    </button>
  </div>

          {flash?.success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              {flash.success}
            </div>
          )}

          {/* Tab Navigation - Updated Design */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setSorting([]);
                  setCurrentPage(1);
                }}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-medium transition relative ${
                  activeTab === 'active'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users size={20} />
                <span>Pegawai Aktif</span>
                {activeTab === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('resign');
                  setSorting([]);
                  setCurrentPage(1);
                }}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-medium transition relative ${
                  activeTab === 'resign'
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserX size={20} />
                <span>Pegawai Resign</span>
                {activeTab === 'resign' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition relative"
              >
                <Filter size={20} />
                Filter
                {activeFilters > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
  <select
    value={selectedDivisi}
    onChange={(e) => setSelectedDivisi(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Divisi</option>
    {divisiList.map((divisi, idx) => (
      <option key={idx} value={divisi}>{divisi}</option>
    ))}
  </select>

  <select
    value={selectedJabatan}
    onChange={(e) => setSelectedJabatan(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Jabatan</option>
    {jabatanList.map((jabatan, idx) => (
      <option key={idx} value={jabatan}>{jabatan}</option>
    ))}
  </select>
  <select
    value={selectedTower}
    onChange={(e) => setSelectedTower(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Semua Tower</option>
    <option value="Eiffel">Eiffel</option>
    <option value="Liberty">Liberty</option>
  </select>

                {activeFilters > 0 && (
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden relative" aria-busy={loading}>
            {loading && (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        const direction = header.column.getIsSorted();

                        return (
                          <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button
                              type="button"
                              disabled={!header.column.getCanSort()}
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 disabled:cursor-default"
                              aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {direction === 'asc' ? <ArrowUp size={14} /> : direction === 'desc' ? <ArrowDown size={14} /> : header.column.getCanSort() ? <ArrowUpDown size={14} className="opacity-40" /> : null}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map(({ original: user }) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activeTab === 'resign' ? (user.tanggal_keluar || '-') : (user.tmk || '-')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.divisi || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-[150px] truncate" title={user.jabatan}>
                            {user.jabatan || '-'}
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.tower === 'Eiffel' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {user.tower || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSendInvite(user)}
                            disabled={invitingId === user.id || !user.email}
                            className={`p-1.5 rounded-lg transition ${
                              invitingId === user.id
                                ? 'bg-amber-100 text-amber-600 animate-pulse'
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={user.email ? `Kirim Link Undangan (${user.email})` : 'Email tidak tersedia'}
                          >
                            <Send size={17} className={invitingId === user.id ? 'animate-spin' : ''} />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Pegawai"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Pegawai"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        {activeFilters > 0 ? 'Tidak ada data sesuai filter' : 'Belum ada data pegawai'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* Pagination */}
  {users.last_page > 1 && (
    <div className="px-6 py-4 border-t flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} data
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              currentPage === page
                ? 'bg-blue-600 text-white cursor-default'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === users.last_page}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            currentPage === users.last_page
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )}
          </div>

          {/* Modal Form */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {isEditing ? 'Edit Pegawai' : 'Tambah Pegawai'}
                  </h2>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} aria-busy={isSubmittingForm}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID Pegawai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        required
                        placeholder="Contoh: 101, 102, 103..."
                        disabled={isEditing} // <-- Tambahkan ini
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isEditing ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Masukkan ID unik untuk pegawai (angka)
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password {isEditing ? '(Kosongkan jika tidak ingin mengubah)' : <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showEmployeePassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required={!isEditing}
                          minLength={8}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                          aria-label={showEmployeePassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showEmployeePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Konfirmasi Password {isEditing ? '(Isi jika mengubah password)' : <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showEmployeePasswordConfirmation ? 'text' : 'password'}
                          name="password_confirmation"
                          value={formData.password_confirmation}
                          onChange={handleChange}
                          required={!isEditing || Boolean(formData.password)}
                          minLength={8}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmployeePasswordConfirmation(!showEmployeePasswordConfirmation)}
                          aria-label={showEmployeePasswordConfirmation ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showEmployeePasswordConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pegawai">Pegawai</option>
                        <option value="hrd">HRD</option>
                        <option value="head">Head</option>
                        <option value="Site">Site</option>
                        <option value="eksekutif">Eksekutif</option>
                        <option value="it">IT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TMK(Tanggal Mulai Kerja)
                      </label>
                      <input
                        type="date"
                        name="tmk"
                        value={formData.tmk}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Keluar (Opsional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          name="tanggal_keluar"
                          value={formData.tanggal_keluar}
                          onChange={handleChange}
                          className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((previous) => ({ ...previous, tanggal_keluar: '' }))}
                          disabled={!formData.tanggal_keluar}
                          className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Isi jika pegawai sudah resign
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Divisi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="divisi"
                        value={formData.divisi}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jabatan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jabatan"
                        value={formData.jabatan}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tower <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="tower"
                        value={formData.tower}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Pilih Tower --</option>
                        <option value="Eiffel">Eiffel</option>
                        <option value="Liberty">Liberty</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                      <textarea
                        name="keterangan"
                        value={formData.keterangan}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanda Tangan Digital
                      </label>
                      
                      {ttdPreview ? (
                        <div className="relative inline-block">
                          <img 
                            src={ttdPreview} 
                            alt="TTD Preview" 
                            className="w-48 h-32 object-contain border-2 border-gray-300 rounded-lg bg-gray-50 p-2"
                          />
                          <button
                            type="button"
                            onClick={removeTtd}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                            <Upload size={18} />
                            <span className="text-sm">Upload TTD</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-gray-500">Max 2MB (JPG, PNG)</span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="active"
                          checked={formData.active}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Status Aktif</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmittingForm ? 'Menyimpan...' : isEditing ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </LayoutTemplate>
    );
  }

  export default Pegawai;