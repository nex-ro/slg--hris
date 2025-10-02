import { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle,ChevronDown , AlertCircle, X, Save, Loader, UserPlus, Trash2 } from "lucide-react";
import  LayoutTemplate  from "@/Layouts/LayoutTemplate";
import { router, usePage } from "@inertiajs/react";

// Toast Component
function Toast({ message, type, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  const icon = type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />;
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50`}>
      {icon}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
const handleSaveData = async () => {
  if (data.length === 0) {
    showToast("Tidak ada data untuk disimpan", "error");
    return;
  }
  
  setSaving(true);
  setError("");
  
  try {
    const dataByPersonAndDate = {};
    
    Object.keys(groupedData).forEach(date => {
      groupedData[date].forEach(row => {
        const dateTime = row["Date And Time"] || "";
        const [dateOnly, timeOnly] = dateTime.split(' ');
        
        let formattedDate = dateOnly;
        if (dateOnly && dateOnly.includes('/')) {
          const [day, month, year] = dateOnly.split('/');
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        const personnelId = row["Personnel ID"];
        const key = `${formattedDate}-${personnelId}`;
        
        if (!dataByPersonAndDate[key]) {
          dataByPersonAndDate[key] = {
            tanggal: formattedDate,
            uid: personnelId,
            jam_kedatangan: null,
            jam_pulang: null,
            status_kedatangan: null,
            status_pulang: null,
            status: 'hadir'
          };
        }
        
        const classified = classifyTime(timeOnly);
        
        if (classified.type === 'kedatangan') {
          if (!dataByPersonAndDate[key].jam_kedatangan) {
            dataByPersonAndDate[key].jam_kedatangan = classified.time;
            const [hours, minutes] = classified.time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            dataByPersonAndDate[key].status_kedatangan = totalMinutes <= (8 * 60) ? 'On Time' : 'Terlambat';
          }
        } else if (classified.type === 'pulang') {
          if (!dataByPersonAndDate[key].jam_pulang) {
            dataByPersonAndDate[key].jam_pulang = classified.time;
            const [hours, minutes] = classified.time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            dataByPersonAndDate[key].status_pulang = totalMinutes >= (17 * 60) ? 'Normal' : 'pulang_cepat';
          }
        }
        
        if (row["jam_pulang"] && !dataByPersonAndDate[key].jam_pulang) {
          dataByPersonAndDate[key].jam_pulang = row["jam_pulang"];
          const [hours, minutes] = row["jam_pulang"].split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          dataByPersonAndDate[key].status_pulang = totalMinutes >= (17 * 60) ? 'normal' : 'pulang_cepat';
        }
      });
    });
    
    const formattedData = Object.values(dataByPersonAndDate);
    
    router.post('/absensi/save', 
      { data: formattedData }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setSaving(false);
          setFile(null);
          setData([]);
          setGroupedData({});
        },
        onError: (errors) => {
          setSaving(false);
          let errorMessage = "Gagal menyimpan data";
          
          if (errors.error) {
            errorMessage = errors.error;
          } else if (errors.message) {
            errorMessage = errors.message;
          } else if (typeof errors === 'object') {
            const errorArray = Object.values(errors).flat();
            errorMessage = errorArray.join(', ');
          }
          
          showToast(errorMessage, "error");
          setError(errorMessage);
        },
        onFinish: () => {
          setSaving(false);
        }
      }
    );
    
  } catch (err) {
    setSaving(false);
    const errorMsg = "Gagal menyimpan data: " + err.message;
    showToast(errorMsg, "error");
    setError(errorMsg);
  }
};
// Manual Input Modal


function Input_Absen() {
  const [file, setFile] = useState(null);
   const { flash } = usePage().props;
  const [data, setData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const classifyTime = (timeString) => {
    if (!timeString) return { type: null, time: null };
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    const morningStart = 5 * 60;
    const morningEnd = 10 * 60;
    const eveningStart = 17 * 60;
    const eveningEnd = 22 * 60;
    
    if (totalMinutes >= morningStart && totalMinutes <= morningEnd) {
      return { type: 'kedatangan', time: timeString };
    } else if (totalMinutes >= eveningStart && totalMinutes <= eveningEnd) {
      return { type: 'pulang', time: timeString };
    }
    return { type: 'other', time: timeString };
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];
    
    if (!validTypes.includes(uploadedFile.type) && 
        !uploadedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Format file tidak valid. Gunakan Excel (.xlsx, .xls) atau CSV");
      showToast("Format file tidak valid", "error");
      return;
    }

    setFile(uploadedFile);
    setError("");
    setLoading(true);

    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: ""
          });
          
          if (jsonData.length > 0) {
            const normalizedData = jsonData.map((row, idx) => {
              const newRow = { _id: `csv-${Date.now()}-${idx}` };
              Object.keys(row).forEach(key => {
                const trimmedKey = key.trim();
                newRow[trimmedKey] = row[key];
              });
              return newRow;
            });
            
            const firstRow = normalizedData[0];
            const availableColumns = Object.keys(firstRow);
            
            const hasDateColumn = availableColumns.some(col => 
              col.toLowerCase().includes('date') && col.toLowerCase().includes('time')
            );
            const hasPersonalId = availableColumns.some(col => 
              col.toLowerCase().includes('personnel id') || col.toLowerCase().includes('id')
            );
            
            if (!hasDateColumn || !hasPersonalId) {
              setError(`Format Excel tidak sesuai. Kolom yang ditemukan: ${availableColumns.join(', ')}`);
              showToast("Format Excel tidak sesuai", "error");
              setData([]);
              setGroupedData({});
              setLoading(false);
            } else {
              // PERBAIKAN: Tidak memfilter berdasarkan nama, gunakan semua data
              const grouped = {};
              const seenEntries = new Set(); // Untuk tracking duplikat
              let duplicateCount = 0;
              
              normalizedData.forEach(row => {
                const dateTime = row["Date And Time"] || "";
                const [dateOnly, timeOnly] = dateTime.split(' ');
                const personnelId = row["Personnel ID"] || "";
                
                if (dateOnly && dateOnly !== "" && timeOnly && personnelId) {
                  // Classify the time
                  const classified = classifyTime(timeOnly);
                  
                  // Only include if it's within valid time ranges
                  if (classified.type !== 'other') {
                    // Buat unique key berdasarkan tanggal, personnel ID, dan tipe waktu
                    const uniqueKey = `${dateOnly}-${personnelId}-${classified.type}`;
                    
                    // Cek apakah sudah ada entry yang sama
                    if (!seenEntries.has(uniqueKey)) {
                      seenEntries.add(uniqueKey);
                      
                      if (!grouped[dateOnly]) {
                        grouped[dateOnly] = [];
                      }
                      
                      // Add classification info to the row
                      row.timeType = classified.type;
                      grouped[dateOnly].push(row);
                    } else {
                      duplicateCount++;
                    }
                  }
                }
              });
              
              // Count total valid entries
              const totalValidEntries = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
              
              setData(normalizedData);
              setGroupedData(grouped);
              setError("");
              
              let successMessage = `Berhasil membaca ${totalValidEntries} data valid (dalam rentang waktu 05:00-10:00 dan 17:00-22:00)`;
              if (duplicateCount > 0) {
                successMessage += `. ${duplicateCount} data duplikat diabaikan`;
              }
              
              showToast(successMessage, "success");
              setLoading(false);
            }
          } else {
            setError("File Excel kosong");
            showToast("File Excel kosong", "error");
            setData([]);
            setGroupedData({});
            setLoading(false);
          }
        } catch (err) {
          setError("Gagal membaca file: " + err.message);
          showToast("Gagal membaca file", "error");
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Gagal membaca file");
        showToast("Gagal membaca file", "error");
        setLoading(false);
      };
      
      reader.readAsBinaryString(uploadedFile);
      
    } catch (err) {
      setError("Terjadi kesalahan: " + err.message);
      showToast("Terjadi kesalahan", "error");
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setData([]);
    setGroupedData({});
    setError("");
  };
  const handleDeleteRow = (date, index) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const rowToDelete = groupedData[date][index];
      
      setGroupedData(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        newGrouped[date] = [...newGrouped[date]];
        newGrouped[date].splice(index, 1);
        
        if (newGrouped[date].length === 0) {
          delete newGrouped[date];
        }
        
        return newGrouped;
      });

      setData(prevData => prevData.filter(item => item._id !== rowToDelete._id));
      
      showToast("Data berhasil dihapus", "success");
    }
  };
  const handleSaveData = async () => {
  if (data.length === 0) {
    showToast("Tidak ada data untuk disimpan", "error");
    return;
  }
  
  setSaving(true);
  setError("");
  
  try {
    const dataByPersonAndDate = {};
    
    Object.keys(groupedData).forEach(date => {
      groupedData[date].forEach(row => {
        const dateTime = row["Date And Time"] || "";
        const [dateOnly, timeOnly] = dateTime.split(' ');
        
        let formattedDate = dateOnly;
        if (dateOnly && dateOnly.includes('/')) {
          const [day, month, year] = dateOnly.split('/');
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        const personnelId = row["Personnel ID"];
        const key = `${formattedDate}-${personnelId}`;
        
        if (!dataByPersonAndDate[key]) {
          dataByPersonAndDate[key] = {
            tanggal: formattedDate,
            uid: personnelId,
            jam_kedatangan: null,
            jam_pulang: null,
            status_kedatangan: null,
            status_pulang: null,
            status: 'hadir'
          };
        }
        
        const classified = classifyTime(timeOnly);
        
        if (classified.type === 'kedatangan') {
          if (!dataByPersonAndDate[key].jam_kedatangan) {
            dataByPersonAndDate[key].jam_kedatangan = classified.time;
            const [hours, minutes] = classified.time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            dataByPersonAndDate[key].status_kedatangan = totalMinutes <= (8 * 60) ? 'On Time' : 'Terlambat';
          }
        } else if (classified.type === 'pulang') {
          if (!dataByPersonAndDate[key].jam_pulang) {
            dataByPersonAndDate[key].jam_pulang = classified.time;
            const [hours, minutes] = classified.time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            dataByPersonAndDate[key].status_pulang = totalMinutes >= (17 * 60) ? 'Normal' : 'pulang_cepat';
          }
        }
        
        if (row["jam_pulang"] && !dataByPersonAndDate[key].jam_pulang) {
          dataByPersonAndDate[key].jam_pulang = row["jam_pulang"];
          const [hours, minutes] = row["jam_pulang"].split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          dataByPersonAndDate[key].status_pulang = totalMinutes >= (17 * 60) ? 'normal' : 'pulang_cepat';
        }
      });
    });
    
    const formattedData = Object.values(dataByPersonAndDate);
    
    router.post('/absensi/save', 
      { data: formattedData }, 
      {
        preserveScroll: true,
        onSuccess: () => {
          setSaving(false);
          setFile(null);
          setData([]);
          setGroupedData({});
        },
        onError: (errors) => {
          setSaving(false);
          let errorMessage = "Gagal menyimpan data";
          
          if (errors.error) {
            errorMessage = errors.error;
          } else if (errors.message) {
            errorMessage = errors.message;
          } else if (typeof errors === 'object') {
            const errorArray = Object.values(errors).flat();
            errorMessage = errorArray.join(', ');
          }
          
          showToast(errorMessage, "error");
          setError(errorMessage);
        },
        onFinish: () => {
          setSaving(false);
        }
      }
    );
    
  } catch (err) {
    setSaving(false);
    const errorMsg = "Gagal menyimpan data: " + err.message;
    showToast(errorMsg, "error");
    setError(errorMsg);
  }
};

 

  return (
    <LayoutTemplate>
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
    
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Upload Data Absensi</h1>

        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="fileUpload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            
            {!file ? (
              <label htmlFor="fileUpload" className={`cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Klik untuk upload file
                </p>
                <p className="text-sm text-gray-500">
                  Support: Excel (.xlsx, .xls) atau CSV
                </p>
              </label>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <span className="text-gray-700 font-medium">{file.name}</span>
                {!loading && (
                  <button
                    onClick={handleRemoveFile}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader className="animate-spin h-5 w-5" />
              <span>Memproses file...</span>
            </div>
          )}

          {saving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <Loader className="animate-spin h-5 w-5" />
              <span>Menyimpan data ke database...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {Object.keys(groupedData).length > 0 && !error && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-green-700">
                <p className="font-semibold">
                  Total {Object.values(groupedData).reduce((sum, arr) => sum + arr.length, 0)} data siap untuk disimpan
                </p>
                <p className="text-sm mt-1">
                  Data dalam rentang waktu: 05:00-10:00 (Kedatangan) dan 17:00-22:00 (Pulang)
                </p>
              </div>
            </div>
          )}

          {Object.keys(groupedData).length > 0 && !error && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleSaveData}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-5 w-5" />
                {saving ? "Menyimpan..." : "Simpan Semua Data"}
              </button>
            </div>
          )}
        </div>

        {Object.keys(groupedData).length > 0 && (
          <div className="space-y-6">
            {Object.keys(groupedData).sort().reverse().map((date) => (
              <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-3">
                  <h2 className="text-lg font-semibold">Tanggal: {date}</h2>
                  <p className="text-sm text-blue-100">{groupedData[date].length} data absensi</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Personnel ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          First Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Name
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedData[date].map((row, index) => {
                        const dateTime = row["Date And Time"] || "";
                        const time = dateTime.split(' ')[1] || "-";
                        const timeType = row.timeType || 'other';
                        
                        return (
                          <tr key={row._id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                timeType === 'kedatangan' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {timeType === 'kedatangan' ? 'Datang' : 'Pulang'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row["Personnel ID"] || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row["First Name"] || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row["Last Name"] || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <button
                                onClick={() => handleDeleteRow(date, index)}
                                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </LayoutTemplate>

  );
}

export default Input_Absen;