<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Kehadiran;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Holiday;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AbsensiPerDivisiExport;

class HrdController extends Controller
{
      public function index()
    {
        return Inertia::render('Hrd/Dashboard', []);
    }
    public function absensi()
    {
        return Inertia::render('Hrd/Absensi', []);
    }

    public function getByDate(Request $request): JsonResponse
{
    try {
        $request->validate([
            'tanggal' => 'required|date_format:Y-m-d'
        ]);
    
        $tanggal = $request->query('tanggal');

        // Cek apakah hari Sabtu atau Minggu
        $carbonDate = Carbon::parse($tanggal);
        $isSaturdayOrSunday = $carbonDate->isSaturday() || $carbonDate->isSunday();

        // Cek apakah libur nasional
        $isNationalHoliday = Holiday::isHoliday($tanggal);

        // Tentukan apakah hari libur
        $isHoliday = $isSaturdayOrSunday || $isNationalHoliday;
    
        // Ambil semua users yang aktif
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower','divisi','jabatan','tmk')
            ->orderBy('tower', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        $kehadiran = Kehadiran::where('tanggal', $tanggal)->get()->keyBy('uid');
    
        // Format response data
        $formattedData = $users->map(function ($user) use ($kehadiran, $tanggal, $isHoliday) {
            // Ambil data kehadiran berdasarkan user_id
            $attendance = $kehadiran->get($user->id);

            // Tentukan status, jam kedatangan, dan jam pulang
            if ($isHoliday) {
                $status = 'Libur Kerja';
                $jamKedatangan = '00:00';
                $jamPulang = '00:00';
            } elseif ($attendance) {
                $status = $attendance->status;
                $jamKedatangan = $attendance->jam_kedatangan 
                    ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                    : null;
                $jamPulang = $attendance->jam_pulang 
                    ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                    : null;
            } else {
                $status = 'N/A';
                $jamKedatangan = null;
                $jamPulang = null;
            }

            return [
                'id' => $attendance->id ?? null,
                'tanggal' => $tanggal,
                'tower' => $user->tower ?? 'Tanpa Tower',
                'status' => $status,
                'jam_kedatangan' => $jamKedatangan,
                'jam_pulang' => $jamPulang,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,  
                    'divisi' => $user->divisi,
                    'jabatan' => $user->jabatan,
                    'tmk' => $user->tmk,
                    'tower' => $user->tower ?? 'Tanpa Tower',
                ]
            ];
        });
    
        return response()->json($formattedData, 200);
    
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => 'Validasi gagal',
            'message' => 'Format tanggal harus Y-m-d (contoh: 2024-01-15)',
            'details' => $e->errors()
        ], 422);
    
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Terjadi kesalahan',
            'message' => $e->getMessage()
        ], 500);
    }
}
    public function getByMonth(Request $request): JsonResponse
{
    try {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100'
        ]);
    
        $bulan = (int) $request->query('bulan');
        $tahun = (int) $request->query('tahun');

        // Hitung jumlah hari dalam bulan tersebut
        $jumlahHari = Carbon::create($tahun, $bulan, 1)->daysInMonth;

        // Ambil semua users yang aktif
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk')
            ->orderBy('tower', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        // Array untuk menyimpan data per tanggal
        $dataPerTanggal = [];

        // Loop untuk setiap hari dalam bulan
        for ($hari = 1; $hari <= $jumlahHari; $hari++) {
            $tanggal = Carbon::create($tahun, $bulan, $hari)->format('Y-m-d');
            $carbonDate = Carbon::parse($tanggal);
            
            // Cek apakah hari Sabtu atau Minggu
            $isSaturdayOrSunday = $carbonDate->isSaturday() || $carbonDate->isSunday();

            // Cek apakah libur nasional
            $isNationalHoliday = Holiday::isHoliday($tanggal);

            // Tentukan apakah hari libur
            $isHoliday = $isSaturdayOrSunday || $isNationalHoliday;

            // Ambil kehadiran untuk tanggal ini
            $kehadiranHariIni = Kehadiran::where('tanggal', $tanggal)
                ->get()
                ->keyBy('uid');

            // Format data untuk setiap user di tanggal ini
            $formattedData = $users->map(function ($user) use ($kehadiranHariIni, $tanggal, $isHoliday) {
                // Ambil data kehadiran berdasarkan user_id
                $attendance = $kehadiranHariIni->get($user->id);

                // Tentukan status
                $status = 'N/A';
                if ($isHoliday) {
                    $status = 'LK';
                } elseif ($attendance) {
                    $status = $attendance->status;
                }

                return [
                    'id' => $attendance->id ?? null,
                    'tanggal' => $tanggal,
                    'tower' => $user->tower ?? 'Tanpa Tower',
                    'status' => $status,
                    'jam_kedatangan' => $attendance && $attendance->jam_kedatangan 
                        ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                        : null,
                    'jam_pulang' => $attendance && $attendance->jam_pulang 
                        ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                        : null,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'divisi' => $user->divisi,
                        'jabatan' => $user->jabatan,
                        'tmk' => $user->tmk,
                        'tower' => $user->tower ?? 'Tanpa Tower',
                    ]
                ];
            });

            // Simpan data per tanggal
            $dataPerTanggal[] = [
                'tanggal' => $tanggal,
                'hari' => $carbonDate->locale('id')->dayName,
                'is_holiday' => $isHoliday,
                'total_users' => $users->count(),
                'total_hadir' => $kehadiranHariIni->count(),
                'data' => $formattedData->values()->all()
            ];
        }

        // Debug: dd data
        dd([
            'bulan' => $bulan,
            'tahun' => $tahun,
            'jumlah_hari' => $jumlahHari,
            'total_users' => $users->count(),
            'data_per_tanggal' => $dataPerTanggal
        ]);
    
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => 'Validasi gagal',
            'message' => 'Format bulan (1-12) dan tahun (2000-2100) harus valid',
            'details' => $e->errors()
        ], 422);
    
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Terjadi kesalahan',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function exportByTowerAndDivisi(Request $request)
{
    try {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
        ]);
    
        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');
        
        $jumlahHari = Carbon::create($tahun, $bulan, 1)->daysInMonth;
        
        // Ambil users berdasarkan tower
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk')
            ->orderBy('divisi', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        if ($users->isEmpty()) {
            return response()->json([
                'error' => 'Data tidak ditemukan',
            ], 404);
        }
        
        // Group users by divisi
        $usersByDivisi = $users->groupBy('divisi');
        $dataPerDivisi = [];
        
        foreach ($usersByDivisi as $divisi => $usersInDivisi) {
            $dataPerUser = [];
            
            foreach ($usersInDivisi as $user) {
                $dataKehadiran = [];
                
                // Loop untuk setiap hari dalam bulan
                for ($hari = 1; $hari <= $jumlahHari; $hari++) {
                    $tanggal = Carbon::create($tahun, $bulan, $hari)->format('Y-m-d');
                    $carbonDate = Carbon::parse($tanggal);
                    
                    // Cek hari libur
                    $isSaturdayOrSunday = $carbonDate->isSaturday() || $carbonDate->isSunday();
                    $isNationalHoliday = Holiday::isHoliday($tanggal);
                    $isHoliday = $isSaturdayOrSunday || $isNationalHoliday;
                    
                    // Ambil data kehadiran
                    $attendance = Kehadiran::where('tanggal', $tanggal)
                        ->where('uid', $user->id)
                        ->first();
                    
                    // Tentukan status
                    if ($isHoliday) {
                        $status = 'Libur Kerja';
                        $jamKedatangan = '00:00';
                        $jamPulang = '00:00';
                    } elseif ($attendance) {
                        $status = $attendance->status;
                        $jamKedatangan = $attendance->jam_kedatangan 
                            ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                            : null;
                        $jamPulang = $attendance->jam_pulang 
                            ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                            : null;
                    } else {
                        $status = 'N/A';
                        $jamKedatangan = null;
                        $jamPulang = null;
                    }
                    
                    $dataKehadiran[] = [
                        'id' => $attendance->id ?? null,
                        'tanggal' => $tanggal,
                        'tower' => $user->tower ?? 'Tanpa Tower',
                        'status' => $status,
                        'jam_kedatangan' => $jamKedatangan,
                        'jam_pulang' => $jamPulang,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'divisi' => $user->divisi,
                            'jabatan' => $user->jabatan,
                            'tmk' => $user->tmk,
                            'tower' => $user->tower ?? 'Tanpa Tower',
                        ]
                    ];
                }
                
                $dataPerUser[] = [
                    'nama' => $user->name,
                    'data' => $dataKehadiran
                ];
            }
            
            $dataPerDivisi[] = [
                'divisi' => $divisi ?? 'Tanpa Divisi',
                'karyawan' => $dataPerUser
            ];
        }
        

        // Nama file
        $namaBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        
        $fileName = 'Absensi_perDivisi_'. $namaBulan[$bulan] . '_' . $tahun . '.xlsx';
        
        // Generate Excel
        return Excel::download(
            new AbsensiPerDivisiExport($dataPerDivisi, $bulan, $tahun),
            $fileName
        );
    
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => 'Validasi gagal',
            'message' => $e->getMessage(),
            'details' => $e->errors()
        ], 422);
    
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Terjadi kesalahan',
            'message' => $e->getMessage()
        ], 500);
    }
}


}
