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

class CutiDisetujuiPenerimaTugas extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPenerima;
    public string $namaPemohon;
    public string $tanggalMulai;
    public string $tanggalSelesai;
    public string $jumlahHari;
    public ?string $tugas;

    public function __construct(PemakaianCuti $pemakaianCuti)
    {
        $pemakaianCuti->loadMissing(['user', 'penerimaTugas']);

        $this->namaPenerima = $pemakaianCuti->penerimaTugas->name ?? 'Rekan Kerja';
        $this->namaPemohon = $pemakaianCuti->user->name ?? 'Pegawai';
        $this->tanggalMulai = $pemakaianCuti->tanggal_mulai ? Carbon::parse($pemakaianCuti->tanggal_mulai)->format('d-m-Y') : '-';
        $this->tanggalSelesai = $pemakaianCuti->tanggal_selesai ? Carbon::parse($pemakaianCuti->tanggal_selesai)->format('d-m-Y') : '-';
        $this->jumlahHari = (string) floatval($pemakaianCuti->jumlah_hari ?? 0) . ($pemakaianCuti->cuti_setengah_hari ? ' hari (Setengah Hari)' : ' hari');
        $this->tugas = $pemakaianCuti->tugas;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pemberitahuan Pelimpahan Tugas Cuti dari {$this->namaPemohon}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cuti-disetujui-penerima-tugas',
        );
    }
}
