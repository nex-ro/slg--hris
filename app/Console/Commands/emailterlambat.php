<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Kehadiran;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class emailterlambat extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:emailterlambat';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim email notifikasi untuk karyawan yang terlambat hari ini';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai proses pengecekan keterlambatan...');
        
        // Ambil tanggal hari ini
        $today = Carbon::today()->format('Y-m-d');
        
        // Tentukan jam masuk standar (misalnya 08:00:00)
        $jamMasukStandar = '08:00:00';
        
        // Ambil data kehadiran hari ini yang terlambat
        $kehadiranTerlambat = Kehadiran::whereDate('tanggal', $today)
            ->whereNotNull('jam_kedatangan')
            ->where('jam_kedatangan', '>', $jamMasukStandar)
            ->with('user')
            ->get();
        
        if ($kehadiranTerlambat->isEmpty()) {
            $this->info('Tidak ada karyawan yang terlambat hari ini.');
            return 0;
        }
        
        $this->info("Ditemukan {$kehadiranTerlambat->count()} karyawan yang terlambat.");
        
        foreach ($kehadiranTerlambat as $kehadiran) {
            $user = $kehadiran->user;
            
            if (!$user || !$user->email) {
                $this->warn("User tidak ditemukan atau tidak memiliki email untuk kehadiran ID: {$kehadiran->id}");
                continue;
            }
            
            // Hitung total keterlambatan bulan ini
            $firstDayOfMonth = Carbon::now()->startOfMonth()->format('Y-m-d');
            $lastDayOfMonth = Carbon::now()->endOfMonth()->format('Y-m-d');
            
            $jumlahTerlambatBulanIni = Kehadiran::where('uid', $user->id)
                ->whereBetween('tanggal', [$firstDayOfMonth, $lastDayOfMonth])
                ->whereNotNull('jam_kedatangan')
                ->where('jam_kedatangan', '>', $jamMasukStandar)
                ->count();
            $jamKedatangan = Carbon::parse($kehadiran->jam_kedatangan);
            $jamStandar = Carbon::parse($jamMasukStandar);
            $durasiTerlambat = $jamStandar->diff($jamKedatangan);   
            $menitTerlambat = ($durasiTerlambat->h * 60) + $durasiTerlambat->i;
            try {
                $logo_src = asset('asset/LogoEtica.png'); // atau URL lengkap
                $logo_etica_src = asset('asset/LogoEtica.png');

                Mail::send('pdf.keterlambatan', [
                    'nama' => $user->name,
                    'tanggal' => Carbon::parse($kehadiran->tanggal)->format('d F Y'),
                    'jam_kedatangan' => $kehadiran->jam_kedatangan,
                    'jam_masuk_standar' => $jamMasukStandar,
                    'menit_terlambat' => $menitTerlambat,
                    'jumlah_terlambat_bulan_ini' => $jumlahTerlambatBulanIni,
                    'bulan' => Carbon::now()->format('F Y'),
                    'logo_src' => $logo_src,
                    'logo_etica_src' => $logo_etica_src,

                ], function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Notifikasi Keterlambatan - ' . Carbon::now()->format('d F Y'));
                });
                $this->info("✓ Email berhasil dikirim ke: {$user->name} ({$user->email})");
            } catch (\Exception $e) {
                $this->error("✗ Gagal mengirim email ke {$user->name}: " . $e->getMessage());
            }
        }
        
        $this->info('Proses selesai.');
        return 0;
    }
}