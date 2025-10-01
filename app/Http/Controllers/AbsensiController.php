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
        $errors = [];
        
        foreach ($data as $index => $absensi) {
            // Cek apakah UID ada di tabel users
            $userExists = \App\Models\User::where('id', $absensi['uid'])->exists();
            
            if (!$userExists) {
                $errors[] = [
                    'index' => $index,
                    'uid' => $absensi['uid'],
                    'message' => "User dengan UID {$absensi['uid']} tidak ditemukan"
                ];
                continue;
            }
            
            // Parse jam kedatangan
            $jamKedatangan = $absensi['jam_kedatangan'];
            $waktuKedatangan = \Carbon\Carbon::parse($jamKedatangan);
            
            // Cek apakah jam kedatangan sebelum atau sama dengan 08:00:00
            $batasWaktu = \Carbon\Carbon::parse('08:00:00');
            
            // Tentukan status berdasarkan jam kedatangan
            if ($waktuKedatangan->lte($batasWaktu)) {
                $status = 'On Time';
            } else {
                $status = 'Terlambat';
            }
            
            // Simpan atau update data kehadiran
            Kehadiran::updateOrCreate(
                [
                    'tanggal' => $absensi['tanggal'],
                    'uid' => $absensi['uid']
                ],
                [
                    'jam_kedatangan' => $jamKedatangan,
                    'jam_pulang' => $absensi['jam_pulang'],
                    'status' => $status,
                    'tower' => $absensi['tower']
                ]
            );
            
            $savedCount++;
        }
        
        // Response berdasarkan hasil
        if (count($errors) > 0 && $savedCount === 0) {
            return back()->with([
                'error' => 'Semua data gagal disimpan',
                'errorDetails' => 'Periksa kembali UID yang digunakan.'
            ]);
        } elseif (count($errors) > 0) {
            return back()->with([
                'warning' => "Berhasil Gagal menyimpan data",
                'warningDetails' => 'Beberapa UID tidak ditemukan di database.'
            ]);
        } else {
            return back()->with([
                'success' => "Berhasil menyimpan {$savedCount} data absensi!"
            ]);
        }
    } catch (\Exception $e) {
        return back()->with([
            'error' => 'Gagal menyimpan data absensi',
            'errorDetails' => 'Terjadi kesalahan saat memproses data. Silakan coba lagi.'
        ]);
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

public function storeInputTidak(Request $request)
{
    $validated = $request->validate([
        'tanggal' => 'required|date',
        'status' => 'required|string|in:P1,P2,P3,C1,C2,DL,WFH,FP-TR,LK',
        'users' => 'required|array|min:1',
        'users.*' => 'exists:users,id'
    ]);

    try {
        foreach ($validated['users'] as $userId) {
            Kehadiran::updateOrCreate(
                [
                    'tanggal' => $validated['tanggal'],
                    'uid' => $userId,
                ],
                [
                    'status' => $validated['status'],
                    'jam_kedatangan' => '00:00:00',
                    'jam_pulang' => '00:00:00',
                ]
            );
        }

        return redirect()->back()->with('success', 'Data kehadiran berhasil disimpan untuk ' . count($validated['users']) . ' karyawan');
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
        
        // Validasi data
        if (empty($kehadiran) || empty($tower) || empty($tanggal)) {
            return response()->json([
                'error' => 'Data tidak lengkap'
            ], 400);
        }

        try {
            // Generate nama file
            $fileName = "Katering_{$tower}_" . date('Y-m-d', strtotime($tanggal)) . ".xlsx";
            
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




 
    public function dokumen()
    {
        return Inertia::render('Hrd/Absen/Dokumen', []);
    }
}