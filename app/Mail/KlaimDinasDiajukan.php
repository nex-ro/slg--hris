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

class KlaimDinasDiajukan extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $nomorKlaim;
    public string $namaPegawai;
    public string $emailPegawai;
    public string $kegiatan;
    public string $periode;
    public string $totalRealisasi;
    public string $cashAdvance;
    public string $sisaKurang;
    public string $metodeNota;

    public function __construct(KlaimDinas $klaim)
    {
        $this->nomorKlaim = $klaim->nomor_klaim;
        $this->namaPegawai = $klaim->nama_lengkap;
        $this->emailPegawai = $klaim->email;
        $this->kegiatan = $klaim->kegiatan;

        if ($klaim->periode_awal && $klaim->periode_akhir) {
            $this->periode = Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y') . ' s/d ' . Carbon::parse($klaim->periode_akhir)->translatedFormat('d F Y');
        } elseif ($klaim->periode_awal) {
            $this->periode = Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y');
        } else {
            $this->periode = '-';
        }

        $this->totalRealisasi = 'Rp ' . number_format($klaim->total_realisasi, 0, ',', '.');
        $this->cashAdvance = 'Rp ' . number_format($klaim->cash_advance, 0, ',', '.');
        $this->sisaKurang = 'Rp ' . number_format($klaim->sisa_kurang, 0, ',', '.');
        $this->metodeNota = $klaim->metode_nota === 'pdf' ? 'Unggah PDF Online' : 'Fisik / Offline (Diserahkan ke HRD)';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengajuan Claim Dinas Baru - ' . $this->namaPegawai . ' (' . $this->nomorKlaim . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.klaim-dinas-diajukan',
        );
    }
}
