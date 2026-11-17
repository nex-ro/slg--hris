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

class SakitDiajukan extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $emailPegawai;
    public string $divisiPegawai;
    public string $tanggalMulai;
    public string $tanggalSelesai;
    public string $keterangan;
    public bool $adaBukti;

    public function __construct(Sakit $sakit)
    {
        $sakit->loadMissing('user');

        $this->namaPegawai = $sakit->user->name ?? 'Pegawai';
        $this->emailPegawai = $sakit->user->email ?? '-';
        $this->divisiPegawai = $sakit->user->divisi ?? '-';
        $this->tanggalMulai = Carbon::parse($sakit->tanggal_mulai)->format('d-m-Y');
        $this->tanggalSelesai = Carbon::parse($sakit->tanggal_selesai)->format('d-m-Y');
        $this->keterangan = $sakit->keterangan ?? '-';
        $this->adaBukti = !empty($sakit->bukti);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengajuan Izin Sakit Baru - ' . $this->namaPegawai,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.sakit-diajukan',
        );
    }
}
