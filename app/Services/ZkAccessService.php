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
        $this->dbPath = config('services.zkaccess.db_path', 'C:\\Program Files (x86)\\ZKTeco\\ZKAccess3.5\\access.mdb');
    }

    /**
     * Jalankan script PowerShell zkaccess_reader.ps1
     */
    protected function runScript(array $params = []): array
    {
        if (!file_exists($this->scriptPath)) {
            return [
                'status' => 'error',
                'message' => 'Script reader ZKAccess tidak ditemukan di: ' . $this->scriptPath,
                'data' => []
            ];
        }

        $argList = [];
        foreach ($params as $key => $val) {
            $escaped = escapeshellarg((string)$val);
            $argList[] = "-{$key} {$escaped}";
        }
        $argsStr = implode(' ', $argList);

        $powershellBin = 'powershell.exe';
        $sysWow64Ps = 'C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe';
        if (file_exists($sysWow64Ps)) {
            $powershellBin = "\"{$sysWow64Ps}\"";
        }

        $powershellCmd = "{$powershellBin} -NoProfile -ExecutionPolicy Bypass -File \"{$this->scriptPath}\" {$argsStr}";

        $output = shell_exec($powershellCmd);

        if (!$output) {
            return [
                'status' => 'error',
                'message' => 'Tidak ada output dari eksekusi PowerShell reader ZKAccess.',
                'data' => []
            ];
        }

        $raw = trim($output);
        $jsonStart = strpos($raw, '{');
        $jsonEnd = strrpos($raw, '}');
        if ($jsonStart !== false && $jsonEnd !== false && $jsonEnd > $jsonStart) {
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
     * Uji koneksi ke perangkat ZKAccess (Online = socket TCP port 4370 terbuka)
     */
    public function testConnection(?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $targetIp = $ip ?: '192.168.87.201';
        $targetPort = $port ?: 4370;

        // Uji socket TCP port 4370 dengan timeout cepat (1.5 detik) agar non-blocking
        $isOnline = false;
        $connection = @fsockopen($targetIp, $targetPort, $errno, $errstr, 1.5);
        if (is_resource($connection)) {
            $isOnline = true;
            fclose($connection);
        }

        return [
            'status' => 'success',
            'online' => $isOnline,
            'ip' => $targetIp,
            'port' => $targetPort,
            'message' => $isOnline 
                ? "Perangkat {$targetIp}:{$targetPort} ONLINE & terhubung."
                : "Perangkat {$targetIp}:{$targetPort} OFFLINE (tidak dapat dihubungi)."
        ];
    }

    /**
     * Bersihkan seluruh log pada memori mesin fisik (ClearGLog)
     */
    public function clearMachineLogs(?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $targetIp = $ip ?: '192.168.87.201';
        $targetPort = $port ?: 4370;

        return $this->runScript([
            'Action' => 'clear_logs',
            'Ip' => $targetIp,
            'Port' => $targetPort,
            'DbPath' => $this->dbPath,
        ]);
    }

    /**
     * Ambil data log absensi berdasarkan tanggal atau rentang tanggal & IP mesin
     */
    public function getLogs(?string $date = null, int $limit = 500, ?string $startDate = null, ?string $endDate = null, ?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $params = [
            'Action' => 'get_logs',
            'Limit' => $limit,
            'DbPath' => $this->dbPath,
            'Ip' => $ip ?: '192.168.87.201',
            'Port' => $port ?: 4370,
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
            // 1. Scan jam 17:00:00 ke atas atau checktype asli 'O' -> Pulang (Check-Out / O)
            // 2. Scan sebelum jam 17:00:00 -> Masuk (Check-In / I)
            if (!empty($item['checktime'])) {
                $time = substr($item['checktime'], 11, 8);
                if (($item['checktype'] ?? '') === 'O' || $time >= '17:00:00') {
                    $item['checktype'] = 'O';
                } else {
                    $item['checktype'] = 'I';
                }
            }

            return $item;
        }, $logs);

        return [
            'status' => 'success',
            'date' => $targetDate ?? $displayDate,
            'count' => count($enrichedLogs),
            'data' => $enrichedLogs,
        ];
    }

    /**
     * Sinkronkan log ZKAccess ke tabel kehadiran HRIS
     * Aturan:
     * - Jam Kedatangan: scan pagi (< 12:00:00). Tepat waktu <= 08:00:59, di atas itu Terlambat.
     * - Jam Pulang: scan sore mulai jam 17:00:00 ke atas (atau checktype 'O'). Diambil scan paling akhir.
     */
    public function syncToKehadiran(?string $date = null, ?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $targetDate = $date ?: Carbon::now()->format('Y-m-d');
        $logsResult = $this->getLogs($targetDate, 2000, null, null, $ip, $port);

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
            $userScans[$pin][] = [
                'time' => Carbon::parse($log['checktime']),
                'type' => $log['checktype'] ?? 'I',
            ];
        }

        $savedCount = 0;
        $updatedCount = 0;
        $ignoredCount = 0;
        $statusKhusus = ['Cuti', 'Sakit', 'Izin', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'Dinas Luar'];

        foreach ($userScans as $uid => $scans) {
            // Cek apakah user ada di sistem
            $user = User::find($uid);
            if (!$user) {
                $ignoredCount++;
                continue;
            }

            // Urutkan waktu scan dari paling awal ke paling akhir
            usort($scans, function ($a, $b) {
                return $a['time']->timestamp <=> $b['time']->timestamp;
            });

            $jamKedatangan = null;
            $jamPulang = null;
            $status = null;

            // 1. JAM KEDATANGAN:
            // Scan pertama jika dilakukan pada pagi hari (< 12:00:00)
            $morningScans = array_filter($scans, function ($s) {
                return $s['time']->format('H:i:s') < '12:00:00';
            });

            if (!empty($morningScans)) {
                $earliestMorning = reset($morningScans);
                $jamKedatangan = $earliestMorning['time']->format('H:i:s');
                // Tepat waktu <= 08:00:59, di atas jam 08:00:59 Terlambat
                $status = ($jamKedatangan <= '08:00:59') ? 'On Time' : 'Terlambat';
            }

            // 2. JAM PULANG (CHECKOUT):
            // Pulang mulai dari jam 17:00:00 ke atas (atau checktype 'O').
            // Diambil scan yang paling akhir.
            $pulangScans = array_filter($scans, function ($s) {
                return $s['time']->format('H:i:s') >= '17:00:00' || $s['type'] === 'O';
            });

            if (!empty($pulangScans)) {
                $latestPulang = end($pulangScans);
                $jamPulang = $latestPulang['time']->format('H:i:s');
            } elseif (count($scans) > 1) {
                // Fallback jika karyawan pulang lebih awal (di atas jam 15:00) dan ada lebih dari 1 scan
                $latestScan = end($scans);
                if ($latestScan['time']->format('H:i:s') >= '15:00:00') {
                    $jamPulang = $latestScan['time']->format('H:i:s');
                }
            }

            // Jika tidak ada scan yang valid, lewati
            if (!$jamKedatangan && !$jamPulang) {
                continue;
            }

            $kehadiran = Kehadiran::where('tanggal', $targetDate)
                ->where('uid', $uid)
                ->first();

            if ($kehadiran) {
                $isUpdated = false;
                $isSpecialStatus = in_array($kehadiran->status, $statusKhusus);

                // Update jam kedatangan jika di DB belum ada atau masih kosong / 00:00:00
                if ((empty($kehadiran->jam_kedatangan) || $kehadiran->jam_kedatangan === '00:00:00') && $jamKedatangan) {
                    $kehadiran->jam_kedatangan = $jamKedatangan;
                    if (!$isSpecialStatus) {
                        $kehadiran->status = $status;
                    }
                    $isUpdated = true;
                }

                // Update jam pulang jika di DB belum ada atau scan pulang baru lebih lambat
                if ($jamPulang) {
                    if (empty($kehadiran->jam_pulang) || $kehadiran->jam_pulang === '00:00:00' || Carbon::parse($jamPulang)->gt(Carbon::parse($kehadiran->jam_pulang))) {
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
                Kehadiran::create([
                    'uid' => $uid,
                    'tanggal' => $targetDate,
                    'jam_kedatangan' => $jamKedatangan,
                    'jam_pulang' => $jamPulang,
                    'status' => $status ?? ($jamPulang ? 'Hadir' : null),
                    'tower' => $user->tower ?? 'Liberty',
                    'keterangan' => 'Auto-sync ZKAccess (' . ($ip ?? 'Liberty') . ')',
                ]);

                $savedCount++;
            }
        }

        return [
            'status' => 'success',
            'message' => "Sinkronisasi selesai: $savedCount data baru disimpan, $updatedCount data diperbarui (Kedatangan & Jam Pulang).",
            'saved' => $savedCount,
            'updated' => $updatedCount,
            'ignored' => $ignoredCount,
            'date' => $targetDate,
        ];
    }

    /**
     * Sinkronkan rentang tanggal secara berurutan
     */
    public function syncDateRange(string $startDate, string $endDate, ?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($start->gt($end)) {
            $tmp = $start;
            $start = $end;
            $end = $tmp;
        }

        $totalSaved = 0;
        $totalUpdated = 0;
        $details = [];

        $current = $start->copy();
        while ($current->lte($end)) {
            $tglStr = $current->format('Y-m-d');
            $res = $this->syncToKehadiran($tglStr, $ip, $port);
            $totalSaved += ($res['saved'] ?? 0);
            $totalUpdated += ($res['updated'] ?? 0);
            $details[$tglStr] = $res;
            $current->addDay();
        }

        return [
            'status' => 'success',
            'message' => "Berhasil sinkronisasi periode $startDate s/d $endDate: $totalSaved baru disimpan, $totalUpdated diperbarui.",
            'total_saved' => $totalSaved,
            'total_updated' => $totalUpdated,
            'details' => $details,
        ];
    }

    /**
     * Sinkronkan 2 hari sekaligus: Pulang Kemarin & Kedatangan Hari Ini (1-Klik)
     */
    public function syncYesterdayAndToday(?string $ip = '192.168.87.201', ?int $port = 4370): array
    {
        $yesterday = Carbon::yesterday()->format('Y-m-d');
        $today = Carbon::today()->format('Y-m-d');

        $resYesterday = $this->syncToKehadiran($yesterday, $ip, $port);
        $resToday = $this->syncToKehadiran($today, $ip, $port);

        $totalSaved = ($resYesterday['saved'] ?? 0) + ($resToday['saved'] ?? 0);
        $totalUpdated = ($resYesterday['updated'] ?? 0) + ($resToday['updated'] ?? 0);

        return [
            'status' => 'success',
            'message' => "Berhasil sinkronisasi 2 hari! Kemarin ($yesterday): {$resYesterday['saved']} baru, {$resYesterday['updated']} jam pulang/datang diperbarui. Hari Ini ($today): {$resToday['saved']} masuk baru, {$resToday['updated']} diperbarui.",
            'total_saved' => $totalSaved,
            'total_updated' => $totalUpdated,
            'yesterday' => $resYesterday,
            'today' => $resToday,
        ];
    }
}
