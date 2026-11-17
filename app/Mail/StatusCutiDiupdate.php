<?php

namespace App\Mail;

use App\Models\PemakaianCuti;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusCutiDiupdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $status;
    public string $tanggalMulai;
    public string $tanggalSelesai;
    public string $jumlahHari;
    public string $alasan;
    public ?string $catatan;
    public ?string $penerimaTugas;

    public function __construct(PemakaianCuti $pemakaianCuti)
    {
        $pemakaianCuti->loadMissing(['user', 'penerimaTugas']);

        $this->namaPegawai = $pemakaianCuti->user->name ?? 'Pegawai';
        $this->status = ucfirst($pemakaianCuti->status_final ?? 'Diproses'); // Disetujui atau Ditolak
        $this->tanggalMulai = $pemakaianCuti->tanggal_mulai ? Carbon::parse($pemakaianCuti->tanggal_mulai)->format('d-m-Y') : '-';
        $this->tanggalSelesai = $pemakaianCuti->tanggal_selesai ? Carbon::parse($pemakaianCuti->tanggal_selesai)->format('d-m-Y') : '-';
        $this->jumlahHari = (string) floatval($pemakaianCuti->jumlah_hari ?? 0) . ($pemakaianCuti->cuti_setengah_hari ? ' hari (Setengah Hari)' : ' hari');
        $this->alasan = $pemakaianCuti->alasan ?? '-';
        $this->catatan = $pemakaianCuti->catatan;
        $this->penerimaTugas = $pemakaianCuti->penerimaTugas->name ?? null;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pengajuan Cuti Anda Telah {$this->status}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-cuti-diupdate',
        );
    }
}
