import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Save, Loader, Plus, UserPlus, Trash2 } from "lucide-react";
import LayoutTemplate from "@/Layouts/LayoutTemplate";
import { router } from '@inertiajs/react';

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

// Manual Input Modal
function ManualInputModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tanggal: '',
    uid: '',
    firstName: '',
    lastName: '',
    jam_kedatangan: '',
    jam_pulang: ''
  });

  const handleSubmit = () => {
    if (!formData.tanggal || !formData.uid || !formData.jam_kedatangan) {
      alert('Harap isi semua field yang wajib (Tanggal, Personnel ID, Jam Kedatangan)');
      return;
    }
    onSave(formData);
    setFormData({ tanggal: '', uid: '', firstName: '', lastName: '', jam_kedatangan: '', jam_pulang: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tambah Data Manual</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personnel ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.uid}
              onChange={(e) => setFormData({...formData, uid: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan Personnel ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama depan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama belakang"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jam Kedatangan <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.jam_kedatangan}
              onChange={(e) => setFormData({...formData, jam_kedatangan: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jam Pulang (Opsional)
            </label>
            <input
              type="time"
              value={formData.jam_pulang || ''}
              onChange={(e) => setFormData({...formData, jam_pulang: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input_Absen() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);

  // Toast helper
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
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
            } else {
              const seenNames = new Set();
              const uniqueData = [];
              
              normalizedData.forEach(row => {
                const fullName = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim();
                if (!seenNames.has(fullName) && fullName !== "") {
                  seenNames.add(fullName);
                  uniqueData.push(row);
                }
              });
              
              const grouped = {};
              uniqueData.forEach(row => {
                const dateTime = row["Date And Time"] || "";
                const dateOnly = dateTime.split(' ')[0];
                
                if (dateOnly && dateOnly !== "") {
                  if (!grouped[dateOnly]) {
                    grouped[dateOnly] = [];
                  }
                  grouped[dateOnly].push(row);
                }
              });
              
              setData(uniqueData);
              setGroupedData(grouped);
              setError("");
              showToast(`Berhasil membaca ${uniqueData.length} data`, "success");
            }
          } else {
            setError("File Excel kosong");
            showToast("File Excel kosong", "error");
            setData([]);
            setGroupedData({});
          }
          
          setLoading(false);
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

  const handleManualSave = (manualData) => {
    const newEntry = {
      _id: `manual-${Date.now()}`,
      "Date And Time": `${manualData.tanggal} ${manualData.jam_kedatangan}`,
      "Personnel ID": manualData.uid,
      "First Name": manualData.firstName || "",
      "Last Name": manualData.lastName || "",
      "jam_pulang": manualData.jam_pulang || null,
      "isManual": true
    };

    const dateOnly = manualData.tanggal;
    
    setData(prevData => [...prevData, newEntry]);
    setGroupedData(prevGrouped => {
      const newGrouped = { ...prevGrouped };
      if (!newGrouped[dateOnly]) {
        newGrouped[dateOnly] = [];
      }
      newGrouped[dateOnly] = [...newGrouped[dateOnly], newEntry];
      return newGrouped;
    });

    showToast("Data manual berhasil ditambahkan", "success");
  };



  const handleDeleteRow = (date, index) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const rowToDelete = groupedData[date][index];
      
      // Remove from grouped data
      setGroupedData(prevGrouped => {
        const newGrouped = { ...prevGrouped };
        newGrouped[date] = [...newGrouped[date]];
        newGrouped[date].splice(index, 1);
        
        if (newGrouped[date].length === 0) {
          delete newGrouped[date];
        }
        
        return newGrouped;
      });

      // Remove from main data array
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
      const formattedData = [];
      
      Object.keys(groupedData).forEach(date => {
        groupedData[date].forEach(row => {
          const dateTime = row["Date And Time"] || "";
          const [dateOnly, timeOnly] = dateTime.split(' ');
          
          let formattedDate = dateOnly;
          if (dateOnly && dateOnly.includes('/')) {
            const [day, month, year] = dateOnly.split('/');
            formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          formattedData.push({
            tanggal: formattedDate,
            uid: row["Personnel ID"] || null,
            jam_kedatangan: timeOnly || null,
            jam_pulang: row["jam_pulang"] || null,
            status: 'hadir'
          });
        });
      });

      router.post('/absensi/save', 
        { data: formattedData }, 
        {
          onSuccess: (page) => {
            setSaving(false);
            if (page.props.flash?.success) {
              showToast(page.props.flash.success, "success");
            } else if (page.props.flash?.warning) {
              showToast(page.props.flash.warning, "warning");
            } else {
              showToast(`Berhasil menyimpan ${formattedData.length} data`, "success");
            }
            
            // Reset after successful save
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
            } else if (errors.errorDetails) {
              errorMessage = errors.errorDetails;
            } else if (typeof errors === 'object') {
              const errorList = Object.values(errors).flat();
              errorMessage = errorList.join(', ');
            }
            
            showToast(errorMessage, "error");
            setError(errorMessage);
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
      
      <ManualInputModal 
        isOpen={showManualInput} 
        onClose={() => setShowManualInput(false)} 
        onSave={handleManualSave}
      />

      <div className="">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Upload Data Absensi</h1>
            <button
              onClick={() => setShowManualInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Tambah Manual
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="fileUpload"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {!file ? (
                <label htmlFor="fileUpload" className="cursor-pointer">
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
                  <button
                    onClick={handleRemoveFile}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Memproses file...</span>
              </div>
            )}

            {saving && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <Loader className="animate-spin h-5 w-5" />
                <span>Menyimpan data...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {data.length > 0 && !error && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700">
                  Total {data.length} data siap untuk disimpan
                </p>
              </div>
            )}

            {data.length > 0 && !error && (
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
              {Object.keys(groupedData).sort().map((date) => (
                <div key={date} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-600 text-white px-6 py-3">
                    <h2 className="text-lg font-semibold">Tanggal: {date}</h2>
                    <p className="text-sm text-blue-100">{groupedData[date].length} orang</p>
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
                            Personnel ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            First Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jam Pulang
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
                          
                          return (
                            <tr key={row._id || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {time}
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row["jam_pulang"] || "-"}
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