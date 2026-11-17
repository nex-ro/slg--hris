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

class StatusPerizinanDiupdate extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $status;
    public string $jenisPerizinan;
    public string $tanggal;
    public string $jamKeluar;
    public string $jamKembali;
    public string $keperluan;
    public ?string $catatan;

    public function __construct(Perizinan $perizinan)
    {
        $perizinan->loadMissing(['user', 'diketahuiOleh', 'disetujuiOleh']);

        $this->namaPegawai = $perizinan->user->name ?? 'Pegawai';
        $this->status = $perizinan->status ?? 'Diproses'; // Disetujui atau Ditolak
        $this->jenisPerizinan = $perizinan->jenis_perizinan ?? 'Izin Keluar Kantor';
        $this->tanggal = $perizinan->tanggal ? Carbon::parse($perizinan->tanggal)->format('d-m-Y') : '-';
        $this->jamKeluar = $perizinan->jam_keluar ? Carbon::parse($perizinan->jam_keluar)->format('H:i') : '-';
        $this->jamKembali = $perizinan->jam_kembali ? Carbon::parse($perizinan->jam_kembali)->format('H:i') : '-';
        $this->keperluan = $perizinan->keperluan ?? '-';
        $this->catatan = $perizinan->catatan;
    }

    public function envelope(): Envelope
    {
        $statusText = $this->status === 'Disetujui' ? 'Disetujui' : 'Ditolak';

        return new Envelope(
            subject: "Pengajuan Perizinan Keluar Kantor Anda Telah {$statusText}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-perizinan-diupdate',
        );
    }
}
