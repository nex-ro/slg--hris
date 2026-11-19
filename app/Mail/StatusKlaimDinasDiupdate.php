<?php

namespace App\Mail;

use App\Models\KlaimDinas;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusKlaimDinasDiupdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $nomorKlaim;
    public string $namaPegawai;
    public string $status;
    public string $kegiatan;
    public string $totalRealisasi;
    public string $cashAdvance;
    public string $sisaKurang;
    public ?string $catatanHrd;
    public ?string $diperiksaOleh;

    public function __construct(KlaimDinas $klaim)
    {
        $this->nomorKlaim = $klaim->nomor_klaim;
        $this->namaPegawai = $klaim->nama_lengkap;
        $this->status = $klaim->status ?? 'Diproses';
        $this->kegiatan = $klaim->kegiatan ?: '-';
        $this->totalRealisasi = 'Rp ' . number_format((float)$klaim->total_realisasi, 0, ',', '.');
        $this->cashAdvance = 'Rp ' . number_format((float)$klaim->cash_advance, 0, ',', '.');
        $this->sisaKurang = 'Rp ' . number_format((float)$klaim->sisa_kurang, 0, ',', '.');
        $this->catatanHrd = $klaim->catatan_hrd;
        $this->diperiksaOleh = $klaim->diperiksa_oleh_nama;
    }

    public function envelope(): Envelope
    {
        $statusText = $this->status === 'Disetujui' ? 'Disetujui' : ($this->status === 'Ditolak' ? 'Ditolak' : $this->status);

        return new Envelope(
            subject: "Update Status Realisasi Claim Dinas ({$this->nomorKlaim}) - {$statusText}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-klaim-dinas-diupdate',
        );
    }
}
