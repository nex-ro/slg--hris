<?php

namespace App\Services;

use App\Models\Kehadiran;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ZkAccessService
{
    protected string $scriptPath;
    protected string $dbPath;

    public function __construct()
    {
        $this->scriptPath = app_path('Services/zkaccess_reader.ps1');
        $this->dbPath = 'C:\\Program Files (x86)\\ZKTeco\\ZKAccess3.5\\access.mdb';
    }

    /**
     * Jalankan powershell script dengan parameter
     */
    protected function runScript(array $params = []): array
    {
        $powershellBin = 'C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe';
        if (!file_exists($powershellBin)) {
            $powershellBin = 'powershell';
        }

        $argList = [
            escapeshellcmd($powershellBin),
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            escapeshellarg($this->scriptPath),
        ];

        foreach ($params as $key => $val) {
            $argList[] = '-' . $key;
            $argList[] = escapeshellarg((string)$val);
        }

        $command = implode(' ', $argList);
        $output = shell_exec($command);

        if (!$output) {
            return [
                'status' => 'error',
                'message' => 'Tidak ada respon dari pembaca database ZKAccess.',
                'data' => []
            ];
        }

        $raw = trim($output);
        $jsonStart = strpos($raw, '{');
        $jsonEnd = strrpos($raw, '}');
        if ($jsonStart !== false && $jsonEnd !== false && $jsonEnd >= $jsonStart) {
            $raw = substr($raw, $jsonStart, ($jsonEnd - $jsonStart) + 1);
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return [
                'status' => 'error',
                'message' => 'Gagal membaca output ZKAccess: ' . substr($output, 0, 200),
                'data' => []
            ];
        }

        return $decoded;
    }

    /**
     * Uji koneksi ke database ZKAccess dan info mesin
     */
    public function testConnection(): array
    {
        return $this->runScript([
            'Action' => 'test_connection',
            'DbPath' => $this->dbPath,
        ]);
    }

    /**
     * Ambil data log absensi berdasarkan tanggal atau rentang tanggal
     */
    public function getLogs(?string $date = null, int $limit = 500, ?string $startDate = null, ?string $endDate = null): array
    {
        $params = [
            'Action' => 'get_logs',
            'Limit' => $limit,
            'DbPath' => $this->dbPath,
        ];

        if ($startDate && $endDate) {
            $params['StartDate'] = $startDate;
            $params['EndDate'] = $endDate;
            $displayDate = "$startDate s/d $endDate";
        } else {
            $targetDate = $date ?: Carbon::now()->format('Y-m-d');
            $params['Date'] = $targetDate;
            $displayDate = $targetDate;
        }

        $result = $this->runScript($params);

        if (($result['status'] ?? '') !== 'success') {
            return [
                'status' => 'error',
                'message' => $result['message'] ?? 'Gagal mengambil data log.',
                'date' => $displayDate,
                'count' => 0,
                'data' => []
            ];
        }

        // Lengkapi dengan info user dari sistem HRIS (apakah UID ada di tabel users)
        $logs = $result['data'] ?? [];
        $uniquePins = array_unique(array_column($logs, 'pin'));
        $users = User::whereIn('id', $uniquePins)->get()->keyBy('id');

        $enrichedLogs = array_map(function ($item) use ($users) {
            $pin = $item['pin'] ?? null;
            $user = $pin ? ($users[$pin] ?? null) : null;
            $item['user_exists'] = $user !== null;
            $item['system_name'] = $user ? $user->name : null;
            $item['divisi'] = $user ? $user->divisi : null;
            $item['tower'] = $user ? $user->tower : null;

            // Klasifikasi otomatis jenis scan:
            // Scan <= 10:00:00 -> Masuk (Check-In)
            // Scan >= 15:00:00 -> Pulang (Check-Out)
            // 10:00 - 15:00 -> Antara / Istirahat
            if (!empty($item['checktime'])) {
                $time = substr($item['checktime'], 11, 8);
                if ($time <= '10:00:00') {
                    $item['checktype'] = 'I';
                } elseif ($time >= '15:00:00') {
                    $item['checktype'] = 'O';
                } else {
                    $item['checktype'] = 'M';
                }
            }

            return $item;
        }, $logs);

        return [
            'status' => 'success',
            'date' => $targetDate,
            'count' => count($enrichedLogs),
            'data' => $enrichedLogs,
        ];
    }

    /**
     * Sinkronkan log ZKAccess ke tabel kehadiran HRIS
     */
    public function syncToKehadiran(?string $date = null): array
    {
        $targetDate = $date ?: Carbon::now()->format('Y-m-d');
        $logsResult = $this->getLogs($targetDate, 2000);

        if ($logsResult['status'] !== 'success') {
            return [
                'status' => 'error',
                'message' => $logsResult['message'],
                'saved' => 0,
                'updated' => 0,
            ];
        }

        $logs = $logsResult['data'];
        if (empty($logs)) {
            return [
                'status' => 'success',
                'message' => "Tidak ada log pada tanggal $targetDate untuk disinkronkan.",
                'saved' => 0,
                'updated' => 0,
            ];
        }

        // Kelompokkan scan berdasarkan pin (UID)
        $userScans = [];
        foreach ($logs as $log) {
            $pin = (int)$log['pin'];
            if (!$pin) continue;
            if (!isset($userScans[$pin])) {
                $userScans[$pin] = [];
            }
            $userScans[$pin][] = Carbon::parse($log['checktime']);
        }

        $savedCount = 0;
        $updatedCount = 0;
        $ignoredCount = 0;
        $batasWaktu = Carbon::parse('08:01:00');
        $statusKhusus = ['Cuti', 'Sakit', 'Izin', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'Dinas Luar'];

        foreach ($userScans as $uid => $times) {
            // Cek apakah user ada di sistem
            $user = User::find($uid);
            if (!$user) {
                $ignoredCount++;
                continue;
            }

            // Urutkan waktu scan dari paling awal ke paling akhir
            usort($times, function ($a, $b) {
                return $a->timestamp <=> $b->timestamp;
            });

            // Pisahkan scan:
            // 1. Scan Masuk/Kedatangan: pagi hari sampai jam 10:00 (<= 10:00:00)
            // 2. Scan Pulang/Checkout: sore hari setelah jam 15:00 (>= 15:00:00)
            // Scan antara jam 10:00:01 s/d 14:59:59 diabaikan
            $morningScans = [];
            $afternoonScans = [];

            foreach ($times as $t) {
                $timeStr = $t->format('H:i:s');
                if ($timeStr <= '10:00:00') {
                    $morningScans[] = $t;
                } elseif ($timeStr >= '15:00:00') {
                    $afternoonScans[] = $t;
                }
            }

            // 1. JAM KEDATANGAN:
            // Hanya diambil dari scan pagi hari sampai maksimal jam 10:00 (<= 10:00:00).
            $jamKedatangan = null;
            $earliestMorning = null;
            if (!empty($morningScans)) {
                $earliestMorning = $morningScans[0];
                $jamKedatangan = $earliestMorning->format('H:i:s');
            }

            // 2. JAM PULANG (CHECKOUT):
            // Diambil dari scan sore hari setelah jam 3 sore (>= 15:00:00) yang paling akhir.
            $jamPulang = null;
            if (!empty($afternoonScans)) {
                $latestAfternoon = end($afternoonScans);
                $jamPulang = $latestAfternoon->format('H:i:s');
            }

            // Jika tidak ada scan yang memenuhi (misal kosong), skip
            if (!$jamKedatangan && !$jamPulang) {
                continue;
            }

            $kehadiran = Kehadiran::where('tanggal', $targetDate)
                ->where('uid', $uid)
                ->first();

            if ($kehadiran) {
                $isUpdated = false;
                $isSpecialStatus = in_array($kehadiran->status, $statusKhusus);

                // Update jam kedatangan jika di DB belum ada dan ada scan pagi
                if (!$kehadiran->jam_kedatangan && $jamKedatangan) {
                    $kehadiran->jam_kedatangan = $jamKedatangan;
                    if (!$isSpecialStatus) {
                        $kehadiran->status = $earliestMorning->lte(Carbon::parse($targetDate . ' 08:01:00')) ? 'On Time' : 'Terlambat';
                    }
                    $isUpdated = true;
                }

                // Update jam pulang jika ada scan siang/sore dari mesin
                if ($jamPulang) {
                    if (!$kehadiran->jam_pulang || Carbon::parse($jamPulang)->gt(Carbon::parse($kehadiran->jam_pulang))) {
                        $kehadiran->jam_pulang = $jamPulang;
                        $isUpdated = true;
                    }
                }

                if ($isUpdated) {
                    $kehadiran->save();
                    $updatedCount++;
                }
            } else {
                // Buat data kehadiran baru
                $status = null;
                if ($jamKedatangan && $earliestMorning) {
                    $status = $earliestMorning->lte(Carbon::parse($targetDate . ' 08:01:00')) ? 'On Time' : 'Terlambat';
                }

                Kehadiran::create([
                    'uid' => $uid,
                    'tanggal' => $targetDate,
                    'jam_kedatangan' => $jamKedatangan,
                    'jam_pulang' => $jamPulang,
                    'status' => $status,
                    'tower' => $user->tower ?? 'Liberty',
                    'keterangan' => 'Auto-sync ZKAccess (Liberty Lt. 1)',
                ]);

                $savedCount++;
            }
        }

        return [
            'status' => 'success',
            'message' => "Sinkronisasi selesai: $savedCount data baru disimpan, $updatedCount data diperbarui.",
            'saved' => $savedCount,
            'updated' => $updatedCount,
            'ignored' => $ignoredCount,
            'date' => $targetDate,
        ];
    }

    /**
     * Sinkronkan 2 hari sekaligus: Pulang Kemarin & Kedatangan Hari Ini (1-Klik)
     */
    public function syncYesterdayAndToday(): array
    {
        $yesterday = Carbon::yesterday()->format('Y-m-d');
        $today = Carbon::today()->format('Y-m-d');

        $resYesterday = $this->syncToKehadiran($yesterday);
        $resToday = $this->syncToKehadiran($today);

        $totalSaved = ($resYesterday['saved'] ?? 0) + ($resToday['saved'] ?? 0);
        $totalUpdated = ($resYesterday['updated'] ?? 0) + ($resToday['updated'] ?? 0);

        return [
            'status' => 'success',
            'message' => "Berhasil sinkronisasi 2 hari! Kemarin ($yesterday): {$resYesterday['saved']} baru, {$resYesterday['updated']} jam pulang diperbarui. Hari Ini ($today): {$resToday['saved']} masuk baru, {$resToday['updated']} diperbarui.",
            'total_saved' => $totalSaved,
            'total_updated' => $totalUpdated,
            'yesterday' => $resYesterday,
            'today' => $resToday,
        ];
    }
}

