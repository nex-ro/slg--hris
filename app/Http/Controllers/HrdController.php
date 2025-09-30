<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use App\Models\Kehadiran;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\User;
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
    
        // Ambil semua users yang aktif
        $users = User::where('active', true)
            ->select('id', 'name', 'email', 'tower')
            ->orderBy('tower', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        $kehadiran = Kehadiran::where('tanggal', $tanggal)->get()->keyBy('uid');
    
        // Format response data
        $formattedData = $users->map(function ($user) use ($kehadiran, $tanggal) {
            // Ambil data kehadiran berdasarkan user_id
            $attendance = $kehadiran->get($user->id);
            
            return [
                'id' => $attendance->id ?? null,
                'tanggal' => $tanggal,
                'tower' => $user->tower ?? 'Tanpa Tower', // Mengambil tower dari user
                'status' => $attendance ? $attendance->status : 'N/A',
                'jam_kedatangan' => $attendance && $attendance->jam_kedatangan 
                    ? Carbon::parse($attendance->jam_kedatangan)->format('H:i') 
                    : null,
                'jam_pulang' => $attendance && $attendance->jam_pulang 
                    ? Carbon::parse($attendance->jam_pulang)->format('H:i') 
                    : null,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'tower' => $user->tower ?? 'Tanpa Tower', // Tambahkan tower di user object juga
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
