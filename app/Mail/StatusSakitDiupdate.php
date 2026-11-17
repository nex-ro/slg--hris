<?php

namespace App\Mail;

use App\Models\Sakit;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusSakitDiupdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $status;
    public string $tanggalMulai;
    public string $tanggalSelesai;
    public string $keterangan;

    public function __construct(Sakit $sakit)
    {
        $sakit->loadMissing('user');

        $this->namaPegawai = $sakit->user->name ?? 'Pegawai';
        $this->status = $sakit->status; // Disetujui atau Ditolak
        $this->tanggalMulai = Carbon::parse($sakit->tanggal_mulai)->format('d-m-Y');
        $this->tanggalSelesai = Carbon::parse($sakit->tanggal_selesai)->format('d-m-Y');
        $this->keterangan = $sakit->keterangan ?? '-';
    }

    public function envelope(): Envelope
    {
        $statusText = $this->status === 'Disetujui' ? 'Disetujui' : 'Ditolak';

        return new Envelope(
            subject: "Pengajuan Izin Sakit Anda Telah {$statusText}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-sakit-diupdate',
        );
    }
}
