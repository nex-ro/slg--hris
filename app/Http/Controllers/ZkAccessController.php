<?php

namespace App\Http\Controllers;

use App\Services\ZkAccessService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ZkAccessController extends Controller
{
    protected ZkAccessService $zkService;

    public function __construct(ZkAccessService $zkService)
    {
        $this->zkService = $zkService;
    }

    /**
     * Tampilkan halaman utama Log Mesin Absensi ZKAccess
     */
    public function index(Request $request): Response
    {
        $today = Carbon::now()->format('Y-m-d');
        $initialDate = $request->query('date', $today);
        $logsData = $this->zkService->getLogs($initialDate, 500);
        $connInfo = $this->zkService->testConnection();

        return Inertia::render('Hrd/ZkAccessLogs', [
            'initialLogs' => $logsData['data'] ?? [],
            'initialDate' => $initialDate,
            'initialCount' => $logsData['count'] ?? 0,
            'connectionInfo' => $connInfo,
        ]);
    }

    /**
     * Endpoint API untuk refresh / ambil data log via AJAX
     */
    public function getLogs(Request $request): JsonResponse
    {
        $date = $request->input('date');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $limit = (int) $request->input('limit', 1000);

        $result = $this->zkService->getLogs($date, $limit, $startDate, $endDate);

        return response()->json($result);
    }

    /**
     * Endpoint API untuk uji koneksi ke database dan perangkat
     */
    public function testConnection(): JsonResponse
    {
        $result = $this->zkService->testConnection();
        return response()->json($result);
    }

    /**
     * Endpoint API untuk sinkronisasi data log ke tabel kehadiran HRIS.
     * Otomatis melengkapi Pulang Kemarin dan Kedatangan Hari Ini jika tanggal adalah hari ini.
     */
    public function sync(Request $request): JsonResponse
    {
        $date = $request->input('date');
        $today = Carbon::now()->format('Y-m-d');

        // Jika sinkronisasi untuk hari ini (default), otomatis sinkronkan 2 hari: Pulang Kemarin & Datang Hari Ini
        if (!$date || $date === $today) {
            $result = $this->zkService->syncYesterdayAndToday();
        } else {
            // Jika memilih tanggal khusus masa lalu, sinkronkan tanggal tersebut
            $result = $this->zkService->syncToKehadiran($date);
        }

        return response()->json($result);
    }

    /**
     * Endpoint API untuk sinkronisasi 2 hari: Pulang Kemarin & Masuk Hari Ini (1-Klik)
     */
    public function syncTwoDays(): JsonResponse
    {
        $result = $this->zkService->syncYesterdayAndToday();
        return response()->json($result);
    }
}

