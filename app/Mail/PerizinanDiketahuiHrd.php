<?php

namespace App\Mail;

use App\Models\Perizinan;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PerizinanDiketahuiHrd extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $diketahuiOleh;
    public string $jenisPerizinan;
    public string $tanggal;
    public string $jamKeluar;
    public string $jamKembali;
    public string $keperluan;
    public ?string $catatan;

    public function __construct(Perizinan $perizinan)
    {
        $perizinan->loadMissing(['user', 'diketahuiOleh']);

        $this->namaPegawai = $perizinan->user->name ?? 'Pegawai';
        $this->diketahuiOleh = $perizinan->diketahuiOleh->name ?? 'Atasan';
        $this->jenisPerizinan = match ($perizinan->type_perizinan) {
            'p1' => 'Izin Full Day (P1)',
            'p2' => 'Izin Setengah Hari (P2)',
            'p3' => 'Izin Keluar Kantor Sementara (P3)',
            default => 'Izin Keluar Kantor',
        };
        $this->tanggal = $perizinan->tanggal ? Carbon::parse($perizinan->tanggal)->format('d-m-Y') : '-';
        $this->jamKeluar = $perizinan->jam_keluar ? substr($perizinan->jam_keluar, 0, 5) : '-';
        $this->jamKembali = $perizinan->jam_kembali ? substr($perizinan->jam_kembali, 0, 5) : '-';
        $this->keperluan = $perizinan->keperluan ?? '-';
        $this->catatan = $perizinan->catatan;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pemberitahuan Izin Keluar Kantor Disetujui Atasan - {$this->namaPegawai}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.perizinan-diketahui-hrd',
        );
    }
}
