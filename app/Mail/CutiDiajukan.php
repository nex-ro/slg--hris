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

class CutiDiajukan extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaApprover;
    public string $namaPegawai;
    public string $roleApproverText; // 'Atasan Langsung', 'HRD', 'Pimpinan'
    public string $tanggalMulai;
    public string $tanggalSelesai;
    public string $jumlahHari;
    public string $alasan;
    public ?string $penerimaTugas;
    public ?string $tugas;

    public function __construct(PemakaianCuti $pemakaianCuti, string $namaApprover, string $roleApproverText)
    {
        $pemakaianCuti->loadMissing(['user', 'penerimaTugas']);

        $this->namaApprover = $namaApprover;
        $this->namaPegawai = $pemakaianCuti->user->name ?? 'Pegawai';
        $this->roleApproverText = $roleApproverText;
        $this->tanggalMulai = $pemakaianCuti->tanggal_mulai ? Carbon::parse($pemakaianCuti->tanggal_mulai)->format('d-m-Y') : '-';
        $this->tanggalSelesai = $pemakaianCuti->tanggal_selesai ? Carbon::parse($pemakaianCuti->tanggal_selesai)->format('d-m-Y') : '-';
        $this->jumlahHari = (string) floatval($pemakaianCuti->jumlah_hari ?? 0) . ($pemakaianCuti->cuti_setengah_hari ? ' hari (Setengah Hari)' : ' hari');
        $this->alasan = $pemakaianCuti->alasan ?? '-';
        $this->penerimaTugas = $pemakaianCuti->penerimaTugas->name ?? null;
        $this->tugas = $pemakaianCuti->tugas;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pengajuan Cuti Baru Membutuhkan Persetujuan - {$this->namaPegawai}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cuti-diajukan',
        );
    }
}
