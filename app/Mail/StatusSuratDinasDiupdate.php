<?php

namespace App\Mail;

use App\Models\SuratDinas;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusSuratDinasDiupdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $nomorSurat;
    public string $namaPegawai;
    public string $status;
    public string $tujuan;
    public string $keperluan;
    public string $tanggalBerangkat;
    public string $tanggalKembali;
    public ?string $catatan;

    public function __construct(SuratDinas $suratDinas)
    {
        $this->nomorSurat = $suratDinas->nomor_surat;
        $this->namaPegawai = $suratDinas->nama_lengkap;
        $this->status = $suratDinas->status ?? 'Diproses';
        $this->tujuan = $suratDinas->tujuan ?: '-';
        $this->keperluan = $suratDinas->keperluan ?: '-';
        $this->catatan = $suratDinas->catatan;

        $this->tanggalBerangkat = $suratDinas->tanggal_berangkat
            ? Carbon::parse($suratDinas->tanggal_berangkat)->translatedFormat('d F Y')
            : '-';

        if ($suratDinas->keterangan_kembali === 'Selesai' || !$suratDinas->tanggal_kembali) {
            $this->tanggalKembali = 'Selesai';
        } else {
            $this->tanggalKembali = Carbon::parse($suratDinas->tanggal_kembali)->translatedFormat('d F Y');
        }
    }

    public function envelope(): Envelope
    {
        $statusText = $this->status === 'Disetujui' ? 'Disetujui' : ($this->status === 'Ditolak' ? 'Ditolak' : $this->status);

        return new Envelope(
            subject: "Update Status Pengajuan Surat Perjalanan Dinas ({$this->nomorSurat}) - {$statusText}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-surat-dinas-diupdate',
        );
    }
}
