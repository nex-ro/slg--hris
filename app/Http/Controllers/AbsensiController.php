<?php

namespace App\Http\Controllers;

use App\Models\Kehadiran;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Exports\AbsensiExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\KateringExport;
use App\Exports\AbsensiMonthlyExport;
use App\Models\Holiday;
use App\Exports\AbsensiCustomExport;
class AbsensiController extends Controller
{
    public function absensi()
    {
        return Inertia::render('Hrd/Absensi', []);
    }
public function saveAbsensi(Request $request)
{
    try {
        $data = $request->input('data', []);
        $savedCount = 0;
        $updatedCount = 0;
        $errorMessages = []; // Ubah dari array of objects ke array of strings
        
        foreach ($data as $index => $absensi) {
            // Cek apakah UID ada di tabel users
            $userExists = \App\Models\User::where('id', $absensi['uid'])->exists();
            
            if (!$userExists) {
                $errorMessages[] = "UID {$absensi['uid']} tidak ditemukan"; // Simpan pesan string langsung
                continue;
            }
            
            // Cari data kehadiran yang sudah ada
            $kehadiran = Kehadiran::where('tanggal', $absensi['tanggal'])
                                  ->where('uid', $absensi['uid'])
                                  ->first();
            
            // Jika data sudah ada
            if ($kehadiran) {
                $isUpdated = false;
                
                // Jika hanya ada jam pulang dari data baru, update jam pulang saja
                if (!$absensi['jam_kedatangan'] && $absensi['jam_pulang']) {
                    $kehadiran->jam_pulang = $absensi['jam_pulang'];
                    $isUpdated = true;
                }
                // Jika ada jam kedatangan baru dan belum ada di database
                else if ($absensi['jam_kedatangan'] && !$kehadiran->jam_kedatangan) {
                    $jamKedatangan = $absensi['jam_kedatangan'];
                    $waktuKedatangan = \Carbon\Carbon::parse($jamKedatangan);
                    $batasWaktu = \Carbon\Carbon::parse('08:00:00');
                    
                    $kehadiran->jam_kedatangan = $jamKedatangan;
                    $kehadiran->status = $waktuKedatangan->lte($batasWaktu) ? 'On Time' : 'Terlambat';
                    $isUpdated = true;
                }
                // Jika ada jam pulang baru dan belum ada di database
                else if ($absensi['jam_pulang'] && !$kehadiran->jam_pulang) {
                    $kehadiran->jam_pulang = $absensi['jam_pulang'];
                    $isUpdated = true;
                }
                
                if ($isUpdated) {
                    $kehadiran->save();
                    $updatedCount++;
                }
            } 
            // Jika data belum ada, buat baru
            else {
                $status = null; // PERBAIKAN: Default null, bukan 'hadir'
                
                // Tentukan status HANYA jika ada jam kedatangan
                if ($absensi['jam_kedatangan']) {
                    $jamKedatangan = $absensi['jam_kedatangan'];
                    $waktuKedatangan = \Carbon\Carbon::parse($jamKedatangan);
                    $batasWaktu = \Carbon\Carbon::parse('08:00:00');
                    $status = $waktuKedatangan->lte($batasWaktu) ? 'On Time' : 'Terlambat';
                }
                
                Kehadiran::create([
                    'tanggal' => $absensi['tanggal'],
                    'uid' => $absensi['uid'],
                    'jam_kedatangan' => $absensi['jam_kedatangan'],
                    'jam_pulang' => $absensi['jam_pulang'],
                    'status' => $status, // Bisa null jika jam_kedatangan null
                    'tower' => $absensi['tower'] ?? null
                ]);
                
                $savedCount++;
            }
        }
        
        // Response berdasarkan hasil
        if (count($errorMessages) > 0 && $savedCount === 0 && $updatedCount === 0) {
            // PERBAIKAN: Return error dengan format yang benar untuk Inertia
            return back()->withErrors([
                'error' => 'Semua data gagal disimpan: ' . implode(', ', $errorMessages)
            ]);
        } elseif (count($errorMessages) > 0) {
            return back()->with([
                'warning' => "Berhasil menyimpan {$savedCount} data baru dan update {$updatedCount} data. Gagal: " . implode(', ', $errorMessages)
            ]);
        } else {
            $message = [];
            if ($savedCount > 0) $message[] = "{$savedCount} data baru";
            if ($updatedCount > 0) $message[] = "{$updatedCount} data diupdate";
            
            return back()->with([
                'success' => "Berhasil! " . implode(', ', $message)
            ]);
        }
    } catch (\Exception $e) {
        \Log::error('Error saving absensi: ' . $e->getMessage());
        
        // PERBAIKAN: Return error dengan format yang benar
        return back()->withErrors([
            'error' => 'Gagal menyimpan data: ' . $e->getMessage()
        ]);
    }
}

public function storeInputTidak(Request $request)
{
    $validated = $request->validate([
        'tanggal' => 'required|date',
        'tanggalSelesai' => 'nullable|date|after_or_equal:tanggal',
        'status' => 'required|string|in:P1,P2,P3,C1,C2,DL,WFH,FP-TR,LK',
        'users' => 'required|array|min:1',
        'users.*' => 'exists:users,id'
    ]);

    try {
        // tentukan tanggal mulai dan akhir
        $startDate = \Carbon\Carbon::parse($validated['tanggal']);
        $endDate = $validated['tanggalSelesai'] 
            ? \Carbon\Carbon::parse($validated['tanggalSelesai']) 
            : $startDate;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            foreach ($validated['users'] as $userId) {
                Kehadiran::updateOrCreate(
                    [
                        'tanggal' => $date->format('Y-m-d'),
                        'uid' => $userId,
                    ],
                    [
                        'status' => $validated['status'],
                        'jam_kedatangan' => '00:00:00',
                        'jam_pulang' => '00:00:00',
                    ]
                );
            }
        }

        return redirect()->back()->with(
            'success', 
            'Data kehadiran berhasil disimpan dari ' 
            . $startDate->format('d-m-Y') . ' hingga ' 
            . $endDate->format('d-m-Y') . ' untuk ' . count($validated['users']) . ' karyawan'
        );
    } catch (\Exception $e) {
        return redirect()->back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
    }
}


    public function printAbsensi(Request $request)
{
    try {
        $data = $request->all();
        $tanggal = $data['tanggal'] ?? null;
        $tower = $data['tower'] ?? null;
        $kehadiran = $data['kehadiran'] ?? [];        
        $dataAbsensi = [];
        foreach ($kehadiran as $item) {
            // Ambil data user dari nested object
            $user = $item['user'] ?? null;
            
            if ($user) {
                $dataAbsensi[] = [
                    'tanggal' => $item['tanggal'] ?? $tanggal,
                    'tower' => $item['tower'] ?? $tower,
                    'tmk' => $user['tmk'] ?? '-',
                    'nama' => $user['name'] ?? '-',
                    'divisi' => $user['divisi'] ?? '-',
                    'jabatan' => $user['jabatan'] ?? '-',
                    'status' => $item['status'] ?? 'N/A',
                    'jam_kedatangan' => $item['jam_kedatangan'] ?? '-',
                    'jam_pulang' => $item['jam_pulang'] ?? '-',
                    'keterangan' => $item['keterangan'] ?? '-',
                ];
            }
        }
        
        // Pastikan ada data sebelum export
        if (empty($dataAbsensi)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data untuk diekspor'
            ], 400);
        }
        
        // Generate file Excel
        $fileName = 'Absensi_' . $tower . '_' . $tanggal . '.xlsx';

        return Excel::download(
            new AbsensiExport($dataAbsensi, $tanggal, $tower), 
            $fileName
        );
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}
    public function printKatering(Request $request)
    {
        $tanggal = $request->tanggal;
        $tower = $request->tower;
        $kehadiran = $request->kehadiran;
        Log::info('Generating katering report for tower: ' . $tower . ' on date: ' . $tanggal);
        Log::info('Kehadiran data: ' . json_encode($kehadiran));
        // Validasi data
        if (empty($kehadiran) || empty($tower) || empty($tanggal)) {
            return response()->json([
                'error' => 'Data tidak lengkap'
            ], 400);
        }

        try {
            // Generate nama file
            $fileName = "Katering_" . date('Y-m-d', strtotime($tanggal)) . ".xlsx";
            
            // Export Excel
            return Excel::download(
                new KateringExport($kehadiran, $tower, $tanggal), 
                $fileName
            );
            
        } catch (\Exception $e) {
            \Log::error('Error generating katering report: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Gagal membuat laporan katering',
                'message' => $e->getMessage()
            ], 500);
        }
    }

   public function ManualInput(Request $request)
{
    $validator = Validator::make($request->all(), [
        'tanggal' => 'required|date',
        'user_id' => 'required|exists:users,id',
        'status' => 'required|in:Hadir,Sakit,P1,P2,P3,C1,C2,DL,WFH,FP-TR,LK',
        'jam_kedatangan' => 'nullable|date_format:H:i',
        'jam_pulang' => 'nullable|date_format:H:i',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validasi gagal',
            'errors' => $validator->errors()
        ], 422);
    }

    // Validasi khusus: jika status Hadir, jam_kedatangan wajib
    if ($request->status === 'Hadir' && empty($request->jam_kedatangan)) {
        return response()->json([
            'success' => false,
            'message' => 'Jam kedatangan wajib diisi untuk status Hadir'
        ], 422);
    }

    // Get user info
    $user = User::find($request->user_id);
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User tidak ditemukan'
        ], 404);
    }

    try {
        // Logika untuk menentukan status dan jam
        $finalStatus = $request->status;
        $jamKedatangan = $request->jam_kedatangan;
        $jamPulang = $request->jam_pulang;

        if ($request->status === 'Hadir') {
            // Cek jam kedatangan untuk menentukan On Time atau Terlambat
            $waktuKedatangan = \Carbon\Carbon::createFromFormat('H:i', $request->jam_kedatangan);
            $batasOnTime = \Carbon\Carbon::createFromFormat('H:i', '08:01');
            $batasBawah = \Carbon\Carbon::createFromFormat('H:i', '04:00');
            
            // Jika jam kedatangan antara 04:00 - 08:00
            if ($waktuKedatangan->between($batasBawah, $batasOnTime)) {
                $finalStatus = 'On Time';
            } else {
                $finalStatus = 'Terlambat';
            }
        } else {
            // Jika status selain Hadir, set jam ke 00:00
            $jamKedatangan = '00:00';
            $jamPulang = '00:00';
        }

        // Cek apakah data sudah ada, jika ya maka update (timpa)
        $kehadiran = Kehadiran::where('tanggal', $request->tanggal)
            ->where('uid', $request->user_id)
            ->first();

        if ($kehadiran) {
            // Update data yang sudah ada
            $kehadiran->update([
                'status' => $finalStatus,
                'jam_kedatangan' => $jamKedatangan,
                'jam_pulang' => $jamPulang,
            ]);
            
            $message = 'Data kehadiran berhasil diperbarui';
        } else {
            // Create attendance record baru
            $kehadiran = Kehadiran::create([
                'tanggal' => $request->tanggal,
                'uid' => $request->user_id,
                'status' => $finalStatus,
                'jam_kedatangan' => $jamKedatangan,
                'jam_pulang' => $jamPulang,
            ]);
            
            $message = 'Data kehadiran berhasil disimpan';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'id' => $kehadiran->id,
                'tanggal' => $kehadiran->tanggal,
                'uid' => $kehadiran->uid,
                'user_name' => $user->name,
                'status' => $kehadiran->status,
                'jam_kedatangan' => $kehadiran->jam_kedatangan,
                'jam_pulang' => $kehadiran->jam_pulang,
                'created_at' => $kehadiran->created_at,
                'updated_at' => $kehadiran->updated_at,
            ]
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal menyimpan data: ' . $e->getMessage()
        ], 500);
    }
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
    public function dokumen()
    {
        return Inertia::render('Hrd/Absen/Dokumen', []);
    }
    public function printAbsensiMonthly(Request $request)
{
    try {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000|max:2100',
            'tower' => 'required|string|in:Eiffel,Liberty'
        ]);
    
        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');
        $tower = $request->input('tower');

        // Hitung jumlah hari dalam bulan tersebut
        $jumlahHari = Carbon::create($tahun, $bulan, 1)->daysInMonth;

        // Ambil semua users yang aktif
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk')
            ->where('tower', $tower)
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
            $dataAbsensi = [];
            foreach ($users as $user) {
                $attendance = $kehadiranHariIni->get($user->id);

                // Tentukan status, jam kedatangan, dan jam pulang
                if ($isHoliday) {
                    $status = 'Libur Kerja';
                    $jamKedatangan = '00:00';
                    $jamPulang = '00:00';
                } elseif ($attendance) {
                    $status = $attendance->status;
                    $jamKedatangan = $attendance->jam_kedatangan 
                        ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                        : '-';
                    $jamPulang = $attendance->jam_pulang 
                        ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                        : '-';
                } else {
                    $status = 'N/A';
                    $jamKedatangan = '-';
                    $jamPulang = '-';
                }

                $dataAbsensi[] = [
                    'tanggal' => $tanggal,
                    'tower' => $user->tower ?? 'Tanpa Tower',
                    'tmk' => $user->tmk ?? '-',
                    'nama' => $user->name ?? '-',
                    'divisi' => $user->divisi ?? '-',
                    'jabatan' => $user->jabatan ?? '-',
                    'status' => $status,
                    'jam_kedatangan' => $jamKedatangan,
                    'jam_pulang' => $jamPulang,
                    'keterangan' => '-',
                ];
            }

            // Simpan data per tanggal
            $dataPerTanggal[] = [
                'tanggal' => $tanggal,
                'hari' => $carbonDate->locale('id')->dayName,
                'is_holiday' => $isHoliday,
                'data' => $dataAbsensi
            ];
        }

        // Nama bulan dalam bahasa Indonesia
        $namaBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];

        // Generate file Excel dengan multiple sheets
        $fileName = 'Absensi_' . $namaBulan[$bulan] . '_' . $tahun . '.xlsx';

        return Excel::download(
            new AbsensiMonthlyExport($dataPerTanggal, $bulan, $tahun), 
            $fileName
        );

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
    public function printRekapAll(Request $request)
    {
        dd($request->all());
        $bulan = $request->input('bulan');
        $tahun = $request->input('tahun');

        // Validasi input
        if (!$bulan || !$tahun) {
            return response()->json([
                'error' => 'Data tidak lengkap. Pastikan bulan, tahun, dan tower diisi.'
            ], 400);
        }

        // Redirect ke fungsi printAbsensiMonthly dengan parameter yang sesuai
        // return redirect()->route('kehadiran.print-monthly', [
        //     'bulan' => $bulan,
        //     'tahun' => $tahun,
        // ]);
    }

    public function printAbsensiCustom(Request $request)
    {
    try {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_akhir' => 'required|date|after_or_equal:tanggal_mulai',
            'tower' => 'required|string|in:Eiffel,Liberty'
        ]);
    
        $tanggalMulai = Carbon::parse($request->input('tanggal_mulai'));
        $tanggalAkhir = Carbon::parse($request->input('tanggal_akhir'));
        $tower = $request->input('tower');

        // Hitung jumlah hari
        $jumlahHari = $tanggalMulai->diffInDays($tanggalAkhir) + 1;

        // Ambil semua users yang aktif
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk')
            ->where('tower', $tower)
            ->orderBy('tower', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        // Array untuk menyimpan data per tanggal
        $dataPerTanggal = [];

        // Loop untuk setiap hari dalam rentang tanggal
        $currentDate = $tanggalMulai->copy();
        while ($currentDate->lte($tanggalAkhir)) {
            $tanggal = $currentDate->format('Y-m-d');
            
            // Cek apakah hari Sabtu atau Minggu
            $isSaturdayOrSunday = $currentDate->isSaturday() || $currentDate->isSunday();

            // Cek apakah libur nasional
            $isNationalHoliday = Holiday::isHoliday($tanggal);

            // Tentukan apakah hari libur
            $isHoliday = $isSaturdayOrSunday || $isNationalHoliday;

            // Ambil kehadiran untuk tanggal ini
            $kehadiranHariIni = Kehadiran::where('tanggal', $tanggal)
                ->get()
                ->keyBy('uid');

            // Format data untuk setiap user di tanggal ini
            $dataAbsensi = [];
            foreach ($users as $user) {
                $attendance = $kehadiranHariIni->get($user->id);

                // Tentukan status, jam kedatangan, dan jam pulang
                if ($isHoliday) {
                    $status = 'Libur Kerja';
                    $jamKedatangan = '00:00';
                    $jamPulang = '00:00';
                } elseif ($attendance) {
                    $status = $attendance->status;
                    $jamKedatangan = $attendance->jam_kedatangan 
                        ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                        : '-';
                    $jamPulang = $attendance->jam_pulang 
                        ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                        : '-';
                } else {
                    $status = 'N/A';
                    $jamKedatangan = '-';
                    $jamPulang = '-';
                }

                $dataAbsensi[] = [
                    'tanggal' => $tanggal,
                    'tower' => $user->tower ?? 'Tanpa Tower',
                    'tmk' => $user->tmk ?? '-',
                    'nama' => $user->name ?? '-',
                    'divisi' => $user->divisi ?? '-',
                    'jabatan' => $user->jabatan ?? '-',
                    'status' => $status,
                    'jam_kedatangan' => $jamKedatangan,
                    'jam_pulang' => $jamPulang,
                    'keterangan' => '-',
                ];
            }

            // Simpan data per tanggal
            $dataPerTanggal[] = [
                'tanggal' => $tanggal,
                'hari' => $currentDate->locale('id')->dayName,
                'is_holiday' => $isHoliday,
                'data' => $dataAbsensi
            ];

            // Pindah ke hari berikutnya
            $currentDate->addDay();
        }

        // Generate file Excel dengan multiple sheets
        $fileName = 'Absensi_Custom_' . 
                    $tanggalMulai->format('d-m-Y') . '_sd_' . 
                    $tanggalAkhir->format('d-m-Y') . '.xlsx';
        return Excel::download(
            new AbsensiCustomExport($dataPerTanggal, $tanggalMulai, $tanggalAkhir), 
            $fileName
        );

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'error' => 'Validasi gagal',
            'message' => 'Format tanggal harus valid dan tanggal akhir harus setelah atau sama dengan tanggal mulai',
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