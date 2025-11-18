import React, { useState,useEffect} from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import LayoutTemplates from '@/Layouts/LayoutTemplate';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Index({flash, auth, holidays, allHolidays }) {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [loadingOverlay, setLoadingOverlay] = useState(false);
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
    });
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        }
        if (flash?.error) {
            showToast(flash.error, 'error');
        }
    }, [flash]);

    const showToast = (message, type) => {
        const options = {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        };
    
        switch(type) {
            case 'success':
                toast.success(message, options);
                break;
            case 'error':
                toast.error(message, options);
                break;
            case 'warning':
                toast.warning(message, options);
                break;
            default:
                toast.info(message, options);
        }
    };

    const changeMonth = (delta) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const getDateInfo = (date) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, currentMonth - 1, date).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const holiday = holidays[dateStr];
        
        if (holiday) {
            return { type: 'holiday', message: holiday };
        } else if (isWeekend) {
            return { type: 'weekend', message: 'Libur Kerja' };
        } else {
            return { type: 'workday', message: 'Masuk Kerja' };
        }
    };

    const handleDateClick = (date) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const renderCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        const cells = [];
        const today = new Date().toISOString().split('T')[0];

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHoliday = holidays[date];
            const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isSunday = dayOfWeek === 0;
            const isToday = date === today;
            const isSelected = date === selectedDate;

            cells.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`relative aspect-square rounded-lg p-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        isSelected
                            ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                            : isHoliday
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : isWeekend
                            ? 'bg-gray-100 text-gray-400'
                            : isToday
                            ? 'bg-blue-100 text-blue-600 font-bold'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <span className={`text-sm font-semibold ${
                        isSunday && !isHoliday && !isSelected ? 'text-red-500' : ''
                    }`}>
                        {day}
                    </span>
                </div>
            );
        }

        return cells;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoadingOverlay(true); 

        post('/holidays', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowAddModal(false);
                setLoadingOverlay(false); // TAMBAH ini
                showToast('Hari libur berhasil ditambahkan!', 'success'); // TAMBAH ini
            },
            onError: (errors) => {
                setLoadingOverlay(false); // TAMBAH ini
                let errorMessage = "Gagal menambahkan hari libur";
                
                if (errors.message) {
                    errorMessage = errors.message;
                } else if (typeof errors === 'object') {
                    const errorArray = Object.values(errors).flat();
                    errorMessage = errorArray.join(', ');
                }
                
                showToast(errorMessage, 'error'); // TAMBAH ini
            },
            onFinish: () => {
                setLoadingOverlay(false); // TAMBAH ini
            }
        });
    };

    const handleEdit = (id, name) => {
        setEditingId(id);
        setEditName(name);
        setEditModalOpen(true);
    };

    const handleSaveEdit = () => {
    if (!editName.trim()) {
        showToast('Nama libur tidak boleh kosong', 'warning'); // TAMBAH ini
        return;
    }
    
    setLoadingOverlay(true); // TAMBAH ini
    
    router.put(`/holidays/${editingId}`, 
        { name: editName },
        {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingId(null);
                setEditName('');
                setLoadingOverlay(false); // TAMBAH ini
                showToast('Hari libur berhasil diperbarui!', 'success'); // TAMBAH ini
            },
            onError: (errors) => {
                setLoadingOverlay(false); // TAMBAH ini
                let errorMessage = "Gagal memperbarui hari libur";
                
                if (errors.message) {
                    errorMessage = errors.message;
                } else if (typeof errors === 'object') {
                    const errorArray = Object.values(errors).flat();
                    errorMessage = errorArray.join(', ');
                }
                
                showToast(errorMessage, 'error'); // TAMBAH ini
            },
            onFinish: () => {
                setLoadingOverlay(false); // TAMBAH ini
            }
        }
    );
};

    const handleDelete = (id) => {
        if (confirm('Hapus hari libur ini?')) {
            setLoadingOverlay(true); 

            router.delete(`/holidays/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingOverlay(false); 
                    showToast('Hari libur berhasil dihapus!', 'success'); 
                },
                onError: (errors) => {
                    setLoadingOverlay(false); 
                    let errorMessage = "Gagal menghapus hari libur";

                    if (errors.message) {
                        errorMessage = errors.message;
                    }

                    showToast(errorMessage, 'error'); // TAMBAH ini
                },
                onFinish: () => {
                    setLoadingOverlay(false); // TAMBAH ini
                }
            });
        }
    };

    const getSelectedDateInfo = () => {
        if (!selectedDate) return null;
        
        const date = new Date(selectedDate);
        const day = date.getDate();
        const dateInfo = getDateInfo(day);
        const dayName = dayNames[date.getDay()];
        
        return {
            date: selectedDate,
            day: day,
            dayName: dayName,
            fullDate: `${dayName}, ${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`,
            ...dateInfo
        };
    };

    const selectedInfo = getSelectedDateInfo();

    return (
        <LayoutTemplates>
            <Head title="Manajemen Hari Libur" />

            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - Small Calendar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-md p-4">
                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    
                                    <h2 className="text-lg font-bold text-gray-800">
                                        {monthNames[currentMonth - 1]} {currentYear}
                                    </h2>
                                    
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Day Names */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {dayShort.map((day, idx) => (
                                        <div key={day} className={`text-center text-xs font-semibold py-1 ${idx === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {renderCalendar()}
                                </div>

                                {/* Selected Date Info */}
                                {selectedInfo && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-500 mb-1">Tanggal Dipilih</div>
                                        <div className="text-sm font-semibold text-gray-800 mb-2">
                                            {selectedInfo.fullDate}
                                        </div>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                            selectedInfo.type === 'holiday' 
                                                ? 'bg-red-100 text-red-700' 
                                                : selectedInfo.type === 'weekend'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                            {selectedInfo.type === 'holiday' && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {selectedInfo.type === 'weekend' && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {selectedInfo.type === 'workday' && (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {selectedInfo.message}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Holiday List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                                {/* Header with Add Button */}
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Daftar Hari Libur {currentYear}
                                            </h3>
                                            <p className="text-blue-100 text-sm mt-1">Total {allHolidays.length} hari libur</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="bg-white text-blue-600 px-5 py-3 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Tambah Libur
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Holiday List */}
                                <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                                    {allHolidays.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 font-semibold text-lg">Belum ada hari libur</p>
                                            <p className="text-gray-400 text-sm mt-2">Klik tombol "Tambah Libur" untuk menambahkan hari libur</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {allHolidays.map((holiday) => {
                                                const date = new Date(holiday.date);
                                                const dayName = dayNames[date.getDay()];
                                                const isPast = date < new Date();
                                                return (
                                                    <div
                                                        key={holiday.id}
                                                        className={`group bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${
                                                            isPast ? 'border-gray-200 opacity-60' : 'border-blue-100 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`w-3 h-3 rounded-full ${isPast ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                                                                    <h4 className="font-bold text-gray-800 truncate">
                                                                        {holiday.name}
                                                                    </h4>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span className="font-semibold">{dayName}</span>
                                                                    <span>•</span>
                                                                    <span>{date.getDate()} {monthNames[date.getMonth()]} {date.getFullYear()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(holiday.id, holiday.name)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(holiday.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Hapus"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add Holiday */}
            {showAddModal && (
                <div style={{margin:"0px",padding:"0px"}}  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-3xl">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Tambah Hari Libur
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nama Libur
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Libur Lebaran"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-sm mt-1.5 font-medium">{errors.name}</div>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Tanggal Mulai
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    required
                                />
                                {errors.start_date && <div className="text-red-500 text-sm mt-1.5 font-medium">{errors.start_date}</div>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Tanggal Akhir
                                </label>
                                <input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    required
                                />
                                {errors.end_date && <div className="text-red-500 text-sm mt-1.5 font-medium">{errors.end_date}</div>}
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-xl hover:bg-gray-300 transition-all font-bold flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {editModalOpen && (
                <div style={{padding:"0px",margin:"0px"}} className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-scaleIn">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-t-3xl">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Nama Libur
                            </h3>
                        </div>
                        
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Nama Libur
                            </label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Masukkan nama libur"
                            />
                        </div>
                        
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3.5 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Simpan
                            </button>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-xl hover:bg-gray-300 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
              {loadingOverlay && (
      <div style={{margin:"0px" ,padding:"0px"}}className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div  className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-1">Loading</p>
            <p className="text-sm text-gray-600">Mohon tunggu sebentar...</p>
          </div>
        </div>
      </div>
    )}

        </LayoutTemplates>
    );
}