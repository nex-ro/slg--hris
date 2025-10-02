<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Kehadiran;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Holiday;

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
}
