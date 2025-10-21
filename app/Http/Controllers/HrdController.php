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
use Illuminate\Support\Facades\DB;
use App\Exports\KehadiranExport;

class HrdController extends Controller
{
    public function index(Request $request)
    {
        // Get current date for defaults
        $currentDate = now();
        
        // Get filter parameters with defaults
        $month = $request->input('month', $currentDate->month);
        $year = $request->input('year', $currentDate->year);
        $tower = $request->input('tower', null);
        $divisi = $request->input('divisi', null);
        $userId = $request->input('userId', null); // Fixed parameter name
        $periodType = $request->input('periodType', 'month'); // 'month' or 'period'

        // Get all towers and divisions for filters
        $towers = User::where('active', 1)
            ->whereNotNull('tower')
            ->where('tower', '!=', '')
            ->distinct()
            ->pluck('tower')
            ->filter()
            ->values();

        $divisions = User::where('active', 1)
            ->whereNotNull('divisi')
            ->where('divisi', '!=', '')
            ->distinct()
            ->pluck('divisi')
            ->filter()
            ->values();

        // Get all active users for person filter
        $users = User::where('active', 1)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get data based on period type
        if ($periodType === 'month') {
            $data = $this->getMonthlyData($month, $year, $tower, $divisi, $userId);
        } else {
            $data = $this->getPeriodData($year, $tower, $divisi, $userId);
        }

        return Inertia::render('Hrd/Dashboard', [
            'filters' => [
                'month' => (int)$month,
                'year' => (int)$year,
                'tower' => $tower,
                'divisi' => $divisi,
                'userId' => $userId,
                'periodType' => $periodType,
            ],
            'towers' => $towers,
            'divisions' => $divisions,
            'users' => $users,
            ...$data
        ]);
    }
    private function getMonthlyData($month, $year, $tower, $divisi, $userId)
{
    return [
        'top10PerTower' => $this->getTop10LateEmployees($month, $year, $tower, $divisi),
        'lateByDivision' => $this->getLateCountByDivision($month, $year, $tower),
        'monthlyTable' => $this->getMonthlyTableData($year, $tower, $divisi, $month, 'month'), // Tambah parameter
        'lateTrendData' => $this->getLateTrendDataMonth($month, $year, $tower, $divisi, $userId),
        'pieChartData' => $this->getPieChartData($month, $year, $tower, $divisi),
        'late3TimesData' => $this->getEmployeesLate3Times($month, $year, $tower, $divisi),
        'summaryStats' => $this->getSummaryStatsMonth($month, $year, $tower, $divisi),
    ];
}

private function getPeriodData($year, $tower, $divisi, $userId)
{
    return [
        'top10PerTower' => $this->getTop10LateEmployeesPeriod($year, $tower, $divisi),
        'lateByDivision' => $this->getLateCountByDivisionPeriod($year, $tower),
        'monthlyTable' => $this->getMonthlyTableData($year, $tower, $divisi, null, 'period'), // Tambah parameter
        'lateTrendData' => $this->getLateTrendDataPeriod($year, $tower, $divisi, $userId),
        'pieChartData' => $this->getPieChartDataPeriod($year, $tower, $divisi),
        'late3TimesData' => $this->getEmployeesLate3TimesPeriod($year, $tower, $divisi),
        'summaryStats' => $this->getSummaryStatsPeriod($year, $tower, $divisi),
    ];
}

    // ========== TOP 10 LATE EMPLOYEES ==========
    private function getTop10LateEmployees($month, $year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as late_count'))
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat')
            ->groupBy('uid');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->with('user:id,name')
            ->orderByDesc('late_count')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user->name ?? 'Unknown',
                    'count' => $item->late_count
                ];
            });
    }

    private function getTop10LateEmployeesPeriod($year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as late_count'))
            ->whereYear('tanggal', $year)
            ->where('status', 'Terlambat')
            ->groupBy('uid');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->with('user:id,name')
            ->orderByDesc('late_count')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user->name ?? 'Unknown',
                    'count' => $item->late_count
                ];
            });
    }

    // ========== LATE COUNT BY DIVISION ==========
    private function getLateCountByDivision($month, $year, $tower)
    {
        $query = Kehadiran::select('users.divisi', DB::raw('COUNT(*) as count'))
            ->join('users', 'kehadiran.uid', '=', 'users.id')
            ->whereYear('kehadiran.tanggal', $year)
            ->whereMonth('kehadiran.tanggal', $month)
            ->where('kehadiran.status', 'Terlambat')
            ->where('users.active', 1)
            ->whereNotNull('users.divisi')
            ->where('users.divisi', '!=', '')
            ->groupBy('users.divisi');

        if ($tower) {
            $query->where('users.tower', $tower);
        }

        return $query->orderByDesc('count')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->divisi,
                    'count' => $item->count
                ];
            });
    }

    private function getLateCountByDivisionPeriod($year, $tower)
    {
        $query = Kehadiran::select('users.divisi', DB::raw('COUNT(*) as count'))
            ->join('users', 'kehadiran.uid', '=', 'users.id')
            ->whereYear('kehadiran.tanggal', $year)
            ->where('kehadiran.status', 'Terlambat')
            ->where('users.active', 1)
            ->whereNotNull('users.divisi')
            ->where('users.divisi', '!=', '')
            ->groupBy('users.divisi');

        if ($tower) {
            $query->where('users.tower', $tower);
        }

        return $query->orderByDesc('count')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->divisi,
                    'count' => $item->count
                ];
            });
    }

    // ========== MONTHLY TABLE DATA ==========
    // ========== MONTHLY TABLE DATA ==========
private function getMonthlyTableData($year, $tower, $divisi, $month = null, $periodType = 'month')
{
    if ($periodType === 'month' && $month) {
        // Mode Per Bulan: Tampilkan keterlambatan per hari
        return $this->getDailyTableData($month, $year, $tower, $divisi);
    } else {
        // Mode Per Tahun: Tampilkan keterlambatan per bulan
        return $this->getYearlyTableData($year, $tower, $divisi);
    }
}

// Method baru untuk data per hari (mode bulan)
private function getDailyTableData($month, $year, $tower, $divisi)
{
    $userQuery = User::where('active', 1);
    
    if ($tower) $userQuery->where('tower', $tower);
    if ($divisi) $userQuery->where('divisi', $divisi);

    $users = $userQuery->get();
    
    $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
    $data = [];

    foreach ($users as $user) {
        // Get all late records for the month at once
        $lateRecords = Kehadiran::where('uid', $user->id)
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat')
            ->selectRaw('DAY(tanggal) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');
        
        // Calculate total
        $totalLate = $lateRecords->sum();
        
        // Only include users with at least one late record
        if ($totalLate > 0) {
            $dailyData = ['name' => $user->name];
            
            // Map to days
            for ($day = 1; $day <= $daysInMonth; $day++) {
                $dailyData['day' . $day] = $lateRecords->get($day, 0);
            }
            
            $dailyData['total'] = $totalLate;
            $data[] = $dailyData;
        }
    }

    // Sort by total late count in DESCENDING order
    usort($data, function($a, $b) {
        return $b['total'] <=> $a['total'];
    });

    return $data;
}

// Method untuk data per bulan (mode tahunan) - ini yang sudah ada
private function getYearlyTableData($year, $tower, $divisi)
{
    $userQuery = User::where('active', 1);
    
    if ($tower) $userQuery->where('tower', $tower);
    if ($divisi) $userQuery->where('divisi', $divisi);

    $users = $userQuery->get();
    
    $data = [];

    foreach ($users as $user) {
        // Get all late records for the year at once
        $lateRecords = Kehadiran::where('uid', $user->id)
            ->whereYear('tanggal', $year)
            ->where('status', 'Terlambat')
            ->selectRaw('MONTH(tanggal) as month, COUNT(*) as count')
            ->groupBy('month')
            ->pluck('count', 'month');
        
        // Calculate total
        $totalLate = $lateRecords->sum();
        
        // Only include users with at least one late record
        if ($totalLate > 0) {
            $monthlyData = ['name' => $user->name];
            
            // Map to month names
            $monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            for ($month = 1; $month <= 12; $month++) {
                $monthlyData[$monthNames[$month - 1]] = $lateRecords->get($month, 0);
            }
            
            $monthlyData['total'] = $totalLate;
            $data[] = $monthlyData;
        }
    }

    // Sort by total late count in DESCENDING order
    usort($data, function($a, $b) {
        return $b['total'] <=> $a['total'];
    });

    return $data;
}
    


    // ========== LATE TREND DATA ==========
    private function getLateTrendDataMonth($month, $year, $tower, $divisi, $userId)
    {
        // Get daily trend for the specified month
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $data = [];

        // Get all records at once for better performance
        $query = Kehadiran::selectRaw('DAY(tanggal) as day, COUNT(*) as count')
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat')
            ->groupBy('day');

        if ($tower || $divisi || $userId) {
            $query->whereHas('user', function ($q) use ($tower, $divisi, $userId) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
                if ($userId) $q->where('id', $userId);
            });
        }

        $records = $query->pluck('count', 'day');

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $data[] = [
                'month' => $day,
                'count' => $records->get($day, 0)
            ];
        }

        return $data;
    }

    private function getLateTrendDataPeriod($year, $tower, $divisi, $userId)
    {
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Get all records at once
        $query = Kehadiran::selectRaw('MONTH(tanggal) as month, COUNT(*) as count')
            ->whereYear('tanggal', $year)
            ->where('status', 'Terlambat')
            ->groupBy('month');

        if ($tower || $divisi || $userId) {
            $query->whereHas('user', function ($q) use ($tower, $divisi, $userId) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
                if ($userId) $q->where('id', $userId);
            });
        }

        $records = $query->pluck('count', 'month');
        $data = [];

        for ($month = 1; $month <= 12; $month++) {
            $data[] = [
                'month' => $monthNames[$month - 1],
                'count' => $records->get($month, 0)
            ];
        }

        return $data;
    }

    // ========== PIE CHART DATA ==========
    private function getPieChartData($month, $year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as value'))
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat')
            ->groupBy('uid');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->with('user:id,name')
            ->orderByDesc('value')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user->name ?? 'Unknown',
                    'value' => $item->value
                ];
            });
    }

    private function getPieChartDataPeriod($year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as value'))
            ->whereYear('tanggal', $year)
            ->where('status', 'Terlambat')
            ->groupBy('uid');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->with('user:id,name')
            ->orderByDesc('value')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->user->name ?? 'Unknown',
                    'value' => $item->value
                ];
            });
    }

    // ========== EMPLOYEES LATE 3+ TIMES ==========
    private function getEmployeesLate3Times($month, $year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as late_count'))
            ->whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat')
            ->groupBy('uid')
            ->having('late_count', '>=', 3);

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->count();
    }

    private function getEmployeesLate3TimesPeriod($year, $tower, $divisi)
    {
        $query = Kehadiran::select('uid', DB::raw('COUNT(*) as late_count'))
            ->whereYear('tanggal', $year)
            ->where('status', 'Terlambat')
            ->groupBy('uid')
            ->having('late_count', '>=', 3);

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        return $query->count();
    }

    // ========== SUMMARY STATS ==========
    private function getSummaryStatsMonth($month, $year, $tower, $divisi)
    {
        $query = Kehadiran::whereYear('tanggal', $year)
            ->whereMonth('tanggal', $month)
            ->where('status', 'Terlambat');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        $totalLate = $query->count();
        $uniqueEmployees = (clone $query)->distinct('uid')->count('uid');

        return [
            'totalLate' => $totalLate,
            'uniqueEmployees' => $uniqueEmployees,
            'late3Times' => $this->getEmployeesLate3Times($month, $year, $tower, $divisi)
        ];
    }

    private function getSummaryStatsPeriod($year, $tower, $divisi)
    {
        $query = Kehadiran::whereYear('tanggal', $year)
            ->where('status', 'Terlambat');

        if ($tower || $divisi) {
            $query->whereHas('user', function ($q) use ($tower, $divisi) {
                $q->where('active', 1);
                if ($tower) $q->where('tower', $tower);
                if ($divisi) $q->where('divisi', $divisi);
            });
        }

        $totalLate = $query->count();
        $uniqueEmployees = (clone $query)->distinct('uid')->count('uid');

        return [
            'totalLate' => $totalLate,
            'uniqueEmployees' => $uniqueEmployees,
            'late3Times' => $this->getEmployeesLate3TimesPeriod($year, $tower, $divisi)
        ];
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
         
        // Ambil semua users yang aktif dengan filter TMK dan tanggal keluar
        $users = User::where('active', true) 
            ->where('role', '!=', 'eksekutif') 
            ->where(function ($query) use ($tanggal) {
                // TMK harus <= tanggal yang dipilih ATAU TMK null
                $query->where('tmk', '<=', $tanggal)
                      ->orWhereNull('tmk');
            })
            ->where(function ($query) use ($tanggal) {
                // tanggal_keluar harus >= tanggal yang dipilih ATAU tanggal_keluar null
                $query->where('tanggal_keluar', '>=', $tanggal)
                      ->orWhereNull('tanggal_keluar');
            })
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk', 'tanggal_keluar') 
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
                $keterangan = null;
            } elseif ($attendance) { 
                $status = $attendance->status; 
                $jamKedatangan = $attendance->jam_kedatangan  
                    ? Carbon::parse($attendance->jam_kedatangan)->format('H:i')  
                    : null; 
                $jamPulang = $attendance->jam_pulang  
                    ? Carbon::parse($attendance->jam_pulang)->format('H:i')  
                    : null; 
                $keterangan = $attendance->keterangan ?? null;
            } else { 
                $status = 'N/A'; 
                $jamKedatangan = null; 
                $jamPulang = null; 
                $keterangan = null;
            } 
 
            return [ 
                'id' => $attendance->id ?? null, 
                'tanggal' => $tanggal, 
                'tower' => $user->tower ?? 'Tanpa Tower', 
                'status' => $status, 
                'jam_kedatangan' => $jamKedatangan, 
                'jam_pulang' => $jamPulang, 
                'keterangan' => $keterangan,
                'user' => [ 
                    'id' => $user->id, 
                    'name' => $user->name,   
                    'divisi' => $user->divisi, 
                    'jabatan' => $user->jabatan, 
                    'tmk' => $user->tmk, 
                    'tanggal_keluar' => $user->tanggal_keluar,
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

// Function baru khusus untuk filter divisi
public function getByDateAndDivisi(Request $request): JsonResponse 
{ 
    try { 
        $request->validate([ 
            'tanggal' => 'required|date_format:Y-m-d',
            'divisi' => 'required|string'
        ]); 
     
        $tanggal = $request->query('tanggal');
        $divisi = $request->query('divisi');
 
        // Cek apakah hari Sabtu atau Minggu 
        $carbonDate = Carbon::parse($tanggal); 
        $isSaturdayOrSunday = $carbonDate->isSaturday() || $carbonDate->isSunday(); 
 
        // Cek apakah libur nasional 
        $isNationalHoliday = Holiday::isHoliday($tanggal); 
 
        // Tentukan apakah hari libur 
        $isHoliday = $isSaturdayOrSunday || $isNationalHoliday; 
         
        // Ambil users yang aktif dengan filter divisi, TMK dan tanggal keluar
        $users = User::where('active', true) 
            ->where('role', '!=', 'eksekutif')
            ->where('divisi', $divisi) // Filter berdasarkan divisi
            ->where(function ($query) use ($tanggal) {
                $query->where('tmk', '<=', $tanggal)
                      ->orWhereNull('tmk');
            })
            ->where(function ($query) use ($tanggal) {
                $query->where('tanggal_keluar', '>=', $tanggal)
                      ->orWhereNull('tanggal_keluar');
            })
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk', 'tanggal_keluar') 
            ->orderBy('tower', 'asc') 
            ->orderBy('name', 'asc') 
            ->get(); 
 
             
        $kehadiran = Kehadiran::where('tanggal', $tanggal)->get()->keyBy('uid'); 
     
        // Format response data 
        $formattedData = $users->map(function ($user) use ($kehadiran, $tanggal, $isHoliday) { 
            $attendance = $kehadiran->get($user->id); 
 
            if ($isHoliday) { 
                $status = 'Libur Kerja'; 
                $jamKedatangan = '00:00'; 
                $jamPulang = '00:00'; 
                $keterangan = null;
            } elseif ($attendance) { 
                $status = $attendance->status; 
                $jamKedatangan = $attendance->jam_kedatangan  
                    ? Carbon::parse($attendance->jam_kedatangan)->format('H:i')  
                    : null; 
                $jamPulang = $attendance->jam_pulang  
                    ? Carbon::parse($attendance->jam_pulang)->format('H:i')  
                    : null; 
                $keterangan = $attendance->keterangan ?? null;
            } else { 
                $status = 'N/A'; 
                $jamKedatangan = null; 
                $jamPulang = null; 
                $keterangan = null;
            } 
 
            return [ 
                'id' => $attendance->id ?? null, 
                'tanggal' => $tanggal, 
                'tower' => $user->tower ?? 'Tanpa Tower', 
                'status' => $status, 
                'jam_kedatangan' => $jamKedatangan, 
                'jam_pulang' => $jamPulang, 
                'keterangan' => $keterangan,
                'user' => [ 
                    'id' => $user->id, 
                    'name' => $user->name,   
                    'divisi' => $user->divisi, 
                    'jabatan' => $user->jabatan, 
                    'tmk' => $user->tmk, 
                    'tanggal_keluar' => $user->tanggal_keluar,
                    'tower' => $user->tower ?? 'Tanpa Tower', 
                ] 
            ]; 
        }); 
     
        return response()->json($formattedData, 200); 
     
    } catch (\Illuminate\Validation\ValidationException $e) { 
        return response()->json([ 
            'error' => 'Validasi gagal', 
            'message' => 'Format tanggal harus Y-m-d (contoh: 2024-01-15) dan divisi wajib diisi', 
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
            ->orderBy('id', 'asc')
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
