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
use App\Exports\KehadiranExport;
use App\Exports\RekapKehadiranSheet;
use App\Exports\SummaryKetepatanSheet;
use Barryvdh\DomPDF\Facade\Pdf;

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
                    $batasWaktu = \Carbon\Carbon::parse('08:00:59');
                    
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
    public function updateKeterangan(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|exists:kehadiran,id',
                'keterangan' => 'required|string|max:500'
            ]);

            $kehadiran = Kehadiran::findOrFail($request->id);
            
            // Pastikan status adalah Terlambat
            if ($kehadiran->status !== 'Terlambat') {
                return response()->json([
                    'success' => false,
                    'message' => 'Keterangan hanya bisa ditambahkan untuk status Terlambat'
                ], 400);
            }

            $kehadiran->keterangan = $request->keterangan;
            $kehadiran->save();

            return response()->json([
                'success' => true,
                'message' => 'Keterangan berhasil disimpan',
                'data' => $kehadiran
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
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
public function printAbsensiPDF(Request $request)
{
    try {
        $data = $request->all();
        $tanggal = $data['tanggal'] ?? null;
        $tower = $data['tower'] ?? null;
        $kehadiran = $data['kehadiran'] ?? [];
        
        // Validasi data
        if (empty($kehadiran) || empty($tanggal) || empty($tower)) {
            return response()->json([
                'error' => 'Data tidak lengkap'
            ], 400);
        }
        
        $dataAbsensi = [];
        foreach ($kehadiran as $item) {
            // Ambil data user dari nested object
            $user = $item['user'] ?? null;
            
            if ($user) {
                $dataAbsensi[] = [
                    'tanggal' => $item['tanggal'] ?? $tanggal,
                    'hari' => $this->getNamaHari($item['tanggal'] ?? $tanggal),
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
        
        // Format tanggal untuk display
        $tanggalFormatted = $this->formatTanggalIndonesia($tanggal);
        
        // Data untuk view
        $pdfData = [
            'tanggal' => $tanggalFormatted,
            'tower' => $tower,
            'dataAbsensi' => $dataAbsensi,
            'totalData' => count($dataAbsensi)
        ];
        
        // Load view untuk PDF
        $pdf = \PDF::loadView('pdf.absensi-report', $pdfData);
        
        // Set paper size dan orientation
        $pdf->setPaper('A4', 'portrait'); // Landscape karena banyak kolom
        
        // Set options PDF
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'sans-serif'
        ]);
        
        // Generate nama file
        $fileName = "Absensi_" . $tower . "_" . date('Y-m-d', strtotime($tanggal)) . ".pdf";
        
        // Download PDF
        return $pdf->download($fileName);
        
    } catch (\Exception $e) {
        \Log::error('Error generating absensi PDF report: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'error' => 'Gagal membuat laporan absensi PDF',
            'message' => $e->getMessage()
        ], 500);
    }
}

// Helper function untuk format tanggal Indonesia
private function formatTanggalIndonesia($tanggal)
{
    $bulanIndo = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    
    $tanggalObj = \DateTime::createFromFormat('Y-m-d', $tanggal);
    if (!$tanggalObj) {
        $tanggalObj = new \DateTime($tanggal);
    }
    
    $hari = $tanggalObj->format('d');
    $bulan = $bulanIndo[(int)$tanggalObj->format('m')];
    $tahun = $tanggalObj->format('Y');
    
    return $hari . ' ' . $bulan . ' ' . $tahun;
}

// Helper function untuk mendapatkan nama hari dalam Bahasa Indonesia
private function getNamaHari($tanggal)
{
    $hariIndo = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu'
    ];
    
    $tanggalObj = \DateTime::createFromFormat('Y-m-d', $tanggal);
    if (!$tanggalObj) {
        $tanggalObj = new \DateTime($tanggal);
    }
    
    $hariEnglish = $tanggalObj->format('l');
    
    return $hariIndo[$hariEnglish] ?? $hariEnglish;
}
    public function printKatering(Request $request)
    {
        $tanggal = $request->tanggal;
        $tower = $request->tower;
        $kehadiran = $request->kehadiran;
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

    // Di Controller
public function printKateringPDF(Request $request)
{
    $tanggal = $request->tanggal;
    $tower = $request->tower;
    $kehadiran = $request->kehadiran;
    
    // Validasi data
    if (empty($kehadiran) || empty($tanggal)) {
        return response()->json([
            'error' => 'Data tidak lengkap'
        ], 400);
    }

    try {
        // Filter data hadir
        $hadirCollection = collect($kehadiran)->filter(function($user) {
            $status = strtolower(trim($user['status'] ?? ''));
            return in_array($status, [
                'ontime', 'on time', 'hadir', 'terlambat',
                'late', 'telat', 'fp-tr', 'FP-TR','c2','p2'
            ]);
        });

        // Group semua data by tower
        $allGrouped = collect($kehadiran)->groupBy('tower')->map(function($group) {
            return $group->sortBy('nama');
        })->sortKeys();
        
        $hadirGrouped = $hadirCollection->groupBy('tower')->map(function($group) {
            return $group->sortBy('nama');
        })->sortKeys();

        // Ambil data untuk Eiffel dan Liberty
        $eifelHadir = $hadirGrouped->get('Eiffel', collect());
        $libertyHadir = $hadirGrouped->get('Liberty', collect());
        
        $eifelAll = $allGrouped->get('Eiffel', collect());
        $libertyAll = $allGrouped->get('Liberty', collect());

        // Fungsi helper untuk filter status
        $getByStatus = function($collection, $statuses) {
            return $collection->filter(function($user) use ($statuses) {
                $status = strtolower(trim($user['status'] ?? ''));
                $statusesLower = array_map('strtolower', $statuses);
                return in_array($status, $statusesLower);
            });
        };

        // Data Eiffel
        $eifelSakit = $getByStatus($eifelAll, ['sakit']);
        $eifelCuti = $getByStatus($eifelAll, ['c1', 'c3', 'cuti']);
        $eifelWFH = $getByStatus($eifelAll, ['wfh']); // TAMBAHKAN INI
        $eifelDinasLuar = $getByStatus($eifelAll, ['dinas_luar', 'dinas luar','dl']);
        $eifelKeluar = $getByStatus($eifelAll, ['p1','p3', 'keluar_kantor', 'keluar kantor']);

        // Data Liberty
        $libertySakit = $getByStatus($libertyAll, ['sakit']);
        $libertyCuti = $getByStatus($libertyAll, ['c1', 'c2', 'c3', 'cuti']);
        $libertyWFH = $getByStatus($libertyAll, ['wfh']); // TAMBAHKAN INI
        $libertyDinasLuar = $getByStatus($libertyAll, ['dinas_luar', 'dinas luar','dl']);
        $libertyKeluar = $getByStatus($libertyAll, ['p1', 'p2', 'p3', 'keluar_kantor', 'keluar kantor']);
        // Hitung total
        $eifelTotal = $eifelAll->count();
        $libertyTotal = $libertyAll->count();
        
        
        $wfhCount = $eifelWFH->count();
        $wfhCountL = $libertyWFH->count();

        $sakitCount = $eifelSakit->count();
        $cutiCount = $eifelCuti->count();
        $dinasCount = $eifelDinasLuar->count();
        $keluarCount = $eifelKeluar->count();
        $eifelHadirTotal = $eifelAll->count() - ($sakitCount + $cutiCount + $dinasCount + $keluarCount + $wfhCount);
        
        $sakitCountL = $libertySakit->count();
        $cutiCountL = $libertyCuti->count();
        $dinasCountL = $libertyDinasLuar->count();
        $keluarCountL = $libertyKeluar->count();
        $libertyHadirTotal = $libertyAll->count() - ($sakitCountL + $cutiCountL + $dinasCountL + $keluarCountL + $wfhCountL);

        // Hitung akumulasi
        $totalLantai19 = $eifelHadirTotal;
        $totalLantai1 = $libertyHadirTotal;
        $totalMarein = 0;
        $totalAkumulasi = $totalLantai19 + $totalLantai1 + $totalMarein;

        // Format tanggal
        $bulanIndo = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        
        $tanggalObj = \DateTime::createFromFormat('Y-m-d', $tanggal);
        if (!$tanggalObj) {
            $tanggalObj = new \DateTime($tanggal);
        }
        
        $hari = $tanggalObj->format('d');
        $bulan = $bulanIndo[(int)$tanggalObj->format('m')];
        $tahun = $tanggalObj->format('Y');
        $tanggalFormatted = $hari . ' ' . $bulan . ' ' . $tahun;


        // Data untuk view
        $data = [
            'tanggal' => $tanggalFormatted,
            'eifelHadir' => $eifelHadir,
            'libertyHadir' => $libertyHadir,
            'eifelTotal' => $eifelTotal,
            'libertyTotal' => $libertyTotal,
            'eifelSakit' => $eifelSakit,
            'eifelCuti' => $eifelCuti,
            'eifelDinasLuar' => $eifelDinasLuar,
            'eifelKeluar' => $eifelKeluar,
            'libertySakit' => $libertySakit,
            'libertyCuti' => $libertyCuti,
            'libertyDinasLuar' => $libertyDinasLuar,
            'libertyKeluar' => $libertyKeluar,
            'eifelHadirTotal' => $eifelHadirTotal,
            'libertyHadirTotal' => $libertyHadirTotal,
            'totalLantai19' => $totalLantai19,
            'totalLantai1' => $totalLantai1,
            'totalMarein' => $totalMarein,
            'totalAkumulasi' => $totalAkumulasi,
            'sakitCount' => $sakitCount,
            'cutiCount' => $cutiCount,
            'dinasCount' => $dinasCount,
            'keluarCount' => $keluarCount,
            'sakitCountL' => $sakitCountL,
            'cutiCountL' => $cutiCountL,
            'dinasCountL' => $dinasCountL,
            'keluarCountL' => $keluarCountL,
            'eifelWFH' => $eifelWFH, // TAMBAHKAN INI
            'libertyWFH' => $libertyWFH, // TAMBAHKAN INI
            'wfhCount' => $wfhCount, // TAMBAHKAN INI
            'wfhCountL' => $wfhCountL, // TAMBAHKAN INI
        ];

        // Load view untuk PDF
        $pdf = \PDF::loadView('pdf.katering-report', $data);
        
        // Set paper size dan orientation
        $pdf->setPaper('A4', 'portrait');
        
        // Set options PDF
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'sans-serif'
        ]);
        
        // Generate nama file
        $fileName = "Katering_" . date('Y-m-d', strtotime($tanggal)) . ".pdf";
        
        // Download PDF dengan header yang benar
        return $pdf->download($fileName);
        
    } catch (\Exception $e) {
        \Log::error('Error generating katering PDF report: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'error' => 'Gagal membuat laporan katering PDF',
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
            ->orderBy('id', 'asc')
            ->get();
        
        $dataPerTanggal = [];

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
        public function printAbsensiMonthlyPDF(Request $request)
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
                ->orderBy('id', 'asc')
                ->get();
            
            $dataPerTanggal = [];

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
                    ];
                }

                // Simpan data per tanggal
                $dataPerTanggal[] = [
                    'tanggal' => $tanggal,
                    'tanggal_formatted' => $carbonDate->locale('id')->translatedFormat('d F Y'),
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

            // Data untuk view
            $data = [
                'dataPerTanggal' => $dataPerTanggal,
                'bulan' => $namaBulan[$bulan],
                'tahun' => $tahun,
                'tower' => $tower,
                'generated_at' => Carbon::now()->locale('id')->translatedFormat('d F Y H:i:s')
            ];

            // Generate PDF
            $pdf = Pdf::loadView('pdf.absensi-monthly', $data)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'defaultFont' => 'sans-serif'
                ]);

            $fileName = 'Absensi_' . $namaBulan[$bulan] . '_' . $tahun . '_' . $tower . '.pdf';

            return $pdf->download($fileName);

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
        try {
            $request->validate([
                'bulan' => 'required|integer|min:1|max:12',
                'tahun' => 'required|integer|min:2000|max:2100'
            ]);

            $bulan = (int) $request->input('bulan');
            $tahun = (int) $request->input('tahun');

            // Hitung jumlah hari dalam bulan tersebut
            $jumlahHari = Carbon::create($tahun, $bulan, 1)->daysInMonth;

            // Ambil semua users yang aktif
            $users = User::where('active', true)
                ->select('id', 'name', 'email', 'tower', 'divisi', 'jabatan', 'tmk')
                ->orderBy('divisi', 'asc')
                ->orderBy('id', 'asc')
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

                $dataPerTanggal[] = [
                    'tanggal' => $tanggal,
                    'hari' => $carbonDate->locale('id')->dayName,
                    'is_holiday' => $isHoliday,
                    'total_users' => $users->count(),
                    'total_hadir' => $kehadiranHariIni->count(),
                    'data' => $formattedData->values()->all()
                ];
            }

            // Generate Excel
            $namaBulan = Carbon::create($tahun, $bulan, 1)->locale('id')->monthName;
            $filename = "Monitoring_Kehadiran_{$namaBulan}_{$tahun}.xlsx";

            return Excel::download(new KehadiranExport($dataPerTanggal, $users, $bulan, $tahun, $jumlahHari), $filename);

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


public function updateStatus(Request $request)
{
    try {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'status' => 'required|string',
            'jam_kedatangan' => 'nullable|string',
            'jam_pulang' => 'nullable|string',
            'tanggal' => 'required_if:id,null|date',
            'uid' => 'required_if:id,null|integer|exists:users,id',
        ]);

        // Jika ID ada, update data yang sudah ada
        if (!empty($validated['id'])) {
            $kehadiran = Kehadiran::find($validated['id']);
            
            if (!$kehadiran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data kehadiran tidak ditemukan'
                ], 404);
            }

            $kehadiran->update([
                'status' => $validated['status'],
                'jam_kedatangan' => $validated['jam_kedatangan'] ?? '00:00',
                'jam_pulang' => $validated['jam_pulang'] ?? '00:00',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status berhasil diupdate',
                'data' => $kehadiran->fresh()->load('user')
            ]);
        } 
        // Jika ID null, buat data baru
        else {
            // Cek apakah sudah ada data untuk user dan tanggal yang sama
            $existingKehadiran = Kehadiran::where('uid', $validated['uid'])
                ->where('tanggal', $validated['tanggal'])
                ->first();

            if ($existingKehadiran) {
                // Jika sudah ada, update saja
                $existingKehadiran->update([
                    'status' => $validated['status'],
                    'jam_kedatangan' => $validated['jam_kedatangan'] ?? '00:00',
                    'jam_pulang' => $validated['jam_pulang'] ?? '00:00',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Status berhasil diupdate (data sudah ada)',
                    'data' => $existingKehadiran->fresh()->load('user')
                ]);
            }

            // Buat data baru
            $kehadiran = Kehadiran::create([
                'tanggal' => $validated['tanggal'],
                'uid' => $validated['uid'],
                'status' => $validated['status'],
                'jam_kedatangan' => $validated['jam_kedatangan'] ?? '00:00',
                'jam_pulang' => $validated['jam_pulang'] ?? '00:00',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data kehadiran berhasil dibuat',
                'data' => $kehadiran->fresh()->load('user')
            ], 201);
        }
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
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