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

        // Uji koneksi kedua mesin secara cepat (non-blocking socket test)
        $testDev1 = $this->zkService->testConnection('192.168.87.201', 4370);
        $testDev2 = $this->zkService->testConnection('192.168.87.202', 4370);

        $devices = [
            [
                'id' => 'dev_1',
                'name' => 'Lokasi 1 (Liberty Lt. 1 Front Office)',
                'ip' => '192.168.87.201',
                'port' => 4370,
                'online' => $testDev1['online'] ?? false,
                'mode' => 'Direct Mesin & Database ZKAccess',
            ],
            [
                'id' => 'dev_2',
                'name' => 'Lokasi 2 (Mesin 2)',
                'ip' => '192.168.87.202',
                'port' => 4370,
                'online' => $testDev2['online'] ?? false,
                'mode' => 'Direct Mesin & Database ZKAccess',
            ],
        ];

        return Inertia::render('Hrd/ZkAccessLogs', [
            'initialLogs' => [],
            'initialDate' => $initialDate,
            'initialCount' => 0,
            'defaultDevices' => $devices,
            'connectionInfo' => [
                'status' => 'success',
                'devices' => $devices,
            ],
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
        $ip = $request->input('ip', '192.168.87.201');
        $port = (int) $request->input('port', 4370);

        $result = $this->zkService->getLogs($date, $limit, $startDate, $endDate, $ip, $port);

        return response()->json($result);
    }

    /**
     * Endpoint API untuk uji koneksi ke database dan perangkat
     */
    public function testConnection(Request $request): JsonResponse
    {
        $ip = $request->input('ip', '192.168.87.201');
        $port = (int) $request->input('port', 4370);
        $result = $this->zkService->testConnection($ip, $port);
        return response()->json($result);
    }

    /**
     * Endpoint API untuk sinkronisasi data log ke tabel kehadiran HRIS.
     * Mendukung single date, date range (startDate s/d endDate), atau default 2 hari.
     */
    public function sync(Request $request): JsonResponse
    {
        $date = $request->input('date');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $ip = $request->input('ip', '192.168.87.201');
        $port = (int) $request->input('port', 4370);
        $today = Carbon::now()->format('Y-m-d');

        // Jika berupa rentang tanggal
        if ($startDate && $endDate) {
            $result = $this->zkService->syncDateRange($startDate, $endDate, $ip, $port);
        } elseif ($date && $date !== $today && $date !== 'ALL') {
            // Jika memilih tanggal spesifik tertentu
            $result = $this->zkService->syncToKehadiran($date, $ip, $port);
        } else {
            // Default: sinkronkan 2 hari (Pulang Kemarin & Kedatangan Hari Ini)
            $result = $this->zkService->syncYesterdayAndToday($ip, $port);
        }

        return response()->json($result);
    }

    /**
     * Endpoint API untuk sinkronisasi 2 hari: Pulang Kemarin & Masuk Hari Ini (1-Klik)
     */
    public function syncTwoDays(Request $request): JsonResponse
    {
        $ip = $request->input('ip', '192.168.87.201');
        $port = (int) $request->input('port', 4370);
        $result = $this->zkService->syncYesterdayAndToday($ip, $port);
        return response()->json($result);
    }
}
