<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Holiday;
use App\Models\JatahCuti;
use App\Models\Kehadiran;
use Carbon\Carbon;
use App\Models\Perizinan;
use App\Models\Sakit;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
        public function holiday(Request $request){
               try {
            $year = $request->query('year', date('Y'));
            
            // Ambil data holiday berdasarkan tahun
            $holidays = Holiday::whereYear('date', $year)
                ->orderBy('date', 'asc')
                ->get(['date', 'name']);
            
            return response()->json($holidays);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error fetching holidays',
                'message' => $e->getMessage()
            ], 500);
        }
        }

    public function pegawai()
    {
        return Inertia::render('Hrd/Pegawai', [
            'flash' => session('flash')
        ]);
    }
        public function getPegawai(Request $request)
    {
        $query = User::query();
    
        // Search
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
    
        // Filter Divisi
        if ($request->has('divisi') && $request->divisi != '') {
            $query->where('divisi', $request->divisi);
        }
    
        // Filter Jabatan
        if ($request->has('jabatan') && $request->jabatan != '') {
            $query->where('jabatan', $request->jabatan);
        }
    
        // Filter Tower
        if ($request->has('tower') && $request->tower != '') {
            $query->where('tower', $request->tower);
        }
    
        // Paginate dengan 15 item per page
        $users = $query->orderBy('id', 'asc')->paginate(15);
    
        // Get unique values untuk filter dropdowns
        $divisiList = User::select('divisi')
            ->distinct()
            ->whereNotNull('divisi')
            ->where('active', 1)
            ->where('divisi', '!=', '')
            ->orderBy('divisi')
            ->pluck('divisi');
            
        $jabatanList = User::select('jabatan')
            ->distinct()
            ->whereNotNull('jabatan')
            
            ->where('jabatan', '!=', '')
            ->orderBy('jabatan')
            ->pluck('jabatan');
    
        // Return JSON response
        return response()->json([
            'users' => [
                'data' => $users->items(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
            'divisiList' => $divisiList,
            'jabatanList' => $jabatanList,
        ], 200);
    }


    public function getUsers()
    {
        $users = User::where('active', 1)
            ->select('id', 'name', 'email', 'divisi', 'jabatan')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($users);
    }
    public function inputHarian()
    {
        return Inertia::render('Hrd/Absen/Input_Absen', []);
    }

    public function inputTidak()
    {
        $users = User::where('active', 1)
            ->select('id', 'name', 'divisi', 'jabatan')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('Hrd/Absen/Input_tidak', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|integer|unique:users,id', 
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => 'required|string',
            'active' => 'boolean',
            'tmk' => 'nullable|date',
            'divisi' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'tower' => 'required|string',
            'keterangan' => 'nullable|string',
            'ttd' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        $validated['password'] = Hash::make($validated['password']);

        if ($request->hasFile('ttd')) {
            $file = $request->file('ttd');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            Storage::disk('public')->putFileAs('ttd', $file, $filename);
            $validated['ttd'] = $filename;
        }

        User::create($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:8',
            'role' => 'required|string',
            'active' => 'boolean',
            'tmk' => 'nullable|date',
            'divisi' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'tower' => 'required|string',
            'ttd' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if ($request->hasFile('ttd')) {
            if ($user->ttd) {
                Storage::disk('public')->delete('ttd/' . $user->ttd);
            }
            
            $file = $request->file('ttd');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();            
            Storage::disk('public')->putFileAs('ttd', $file, $filename);
            $validated['ttd'] = $filename;
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil diupdate');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->ttd) {
            Storage::disk('public')->delete('ttd/' . $user->ttd);
        }
        
        $user->delete();

        return redirect()->back()->with('success', 'Pegawai berhasil dihapus');
    }
        public function index()
    {
        $userId = auth()->id();
        $currentYear = date('Y');
        $currentMonth = date('m');
        $currentDate = Carbon::now();

        // Ambil jatah cuti tahun ini
        $jatahCuti = JatahCuti::where('uid', $userId)
            ->where('tahun', $currentYear)
            ->first();

        // Ambil data kehadiran bulan ini
        $kehadiranBulanIni = Kehadiran::where('uid', $userId)
            ->whereYear('tanggal', $currentYear)
            ->whereMonth('tanggal', $currentMonth)
            ->get();

        // Hitung statistik kehadiran
        $statistik = [
            'hadir' => 0,
            'terlambat' => 0,
            'sakit' => 0,
            'cuti_full' => 0,
            'cuti_half' => 0,
            'izin_full' => 0,
            'izin_half' => 0,
            'izin_keluar' => 0,
            'dinas_luar' => 0,
            'wfh' => 0,
            'fp_tidak_terekam' => 0,
            'libur' => 0,
            'alpa' => 0,
            'na' => 0,
        ];

        foreach ($kehadiranBulanIni as $kehadiran) {
            switch ($kehadiran->status) {
                case 'On Time':
                    $statistik['hadir']++;
                    break;
                case 'Terlambat':
                    $statistik['terlambat']++;
                    break;
                case 'Sakit':
                    $statistik['sakit']++;
                    break;
                case 'C1':
                    $statistik['cuti_full']++;
                    break;
                case 'C2':
                    $statistik['cuti_half']++;
                    break;
                case 'P1':
                    $statistik['izin_full']++;
                    break;
                case 'P2':
                    $statistik['izin_half']++;
                    break;
                case 'P3':
                    $statistik['izin_keluar']++;
                    break;
                case 'DL':
                    $statistik['dinas_luar']++;
                    break;
                case 'WFH':
                    $statistik['wfh']++;
                    break;
                case 'FP-TR':
                    $statistik['fp_tidak_terekam']++;
                    break;
                case 'LK':
                    $statistik['libur']++;
                    break;
                case 'N/A':
                    $statistik['na']++;
                    break;
                default:
                    // Alpa atau status lainnya
                    if (empty($kehadiran->status) || $kehadiran->status == 'Alpa') {
                        $statistik['alpa']++;
                    }
                    break;
            }
        }

        // Total kehadiran efektif (hadir + terlambat)
        $statistik['total_hadir'] = $statistik['hadir'] + $statistik['terlambat'];
        
        // Total izin (semua jenis izin + sakit)
        $statistik['total_izin'] = $statistik['izin_full'] + 
                                    $statistik['izin_half'] + 
                                    $statistik['izin_keluar'] + 
                                    $statistik['sakit'];

        // Pengajuan yang menunggu approval
        $pengajuanMenunggu = [
            'cuti' => 0, // akan diupdate setelah melihat struktur tabel
            'izin' => Perizinan::where('uid', $userId)
                ->where('status', 'Diproses')
                ->count(),
            'sakit' => Sakit::where('uid', $userId)
                ->where('status', 'Diproses')
                ->count(),
        ];

        return Inertia::render('User/Dashboard', [
            'jatahCuti' => $jatahCuti,
            'statistik' => $statistik,
            'pengajuanMenunggu' => $pengajuanMenunggu,
            'bulanTahun' => $currentDate->locale('id')->isoFormat('MMMM YYYY'),
        ]);
    }


    public function head()
    {
        return Inertia::render('Atasan/Dashboard', []);
    }   
}
