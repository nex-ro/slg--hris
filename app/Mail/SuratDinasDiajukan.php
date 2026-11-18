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

class SuratDinasDiajukan extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $nomorSurat;
    public string $namaPegawai;
    public string $emailPegawai;
    public string $jabatan;
    public string $pemberiTugas;
    public string $tanggalBerangkat;
    public string $tanggalKembali;
    public string $tujuan;
    public string $keperluan;
    public string $transportasi;
    public bool $ajukanAdvance;
    public string $panjarNominal;
    public string $panjarTerbilang;
    public string $namaRekening;
    public string $nomorRekening;
    public string $namaBank;

    public function __construct(SuratDinas $suratDinas)
    {
        $this->nomorSurat = $suratDinas->nomor_surat;
        $this->namaPegawai = $suratDinas->nama_lengkap;
        $this->emailPegawai = $suratDinas->email;
        $this->jabatan = $suratDinas->jabatan ?: 'Staff';
        $this->pemberiTugas = $suratDinas->pemberi_tugas ?: '-';
        $this->tanggalBerangkat = $suratDinas->tanggal_berangkat 
            ? Carbon::parse($suratDinas->tanggal_berangkat)->translatedFormat('d F Y') 
            : '-';
        
        if ($suratDinas->keterangan_kembali === 'Selesai' || !$suratDinas->tanggal_kembali) {
            $this->tanggalKembali = 'Selesai';
        } else {
            $this->tanggalKembali = Carbon::parse($suratDinas->tanggal_kembali)->translatedFormat('d F Y');
        }

        $this->tujuan = $suratDinas->tujuan ?: '-';
        $this->keperluan = $suratDinas->keperluan ?: '-';
        $this->transportasi = $suratDinas->transportasi ?: '-';
        
        $this->ajukanAdvance = (bool) $suratDinas->ajukan_advance;
        $this->panjarNominal = $suratDinas->panjar_nominal ?: '-';
        $this->panjarTerbilang = $suratDinas->panjar_terbilang ?: '-';
        $this->namaRekening = $suratDinas->nama_rekening ?: '-';
        $this->nomorRekening = $suratDinas->nomor_rekening ?: '-';
        $this->namaBank = $suratDinas->nama_bank ?: '-';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pengajuan Surat Perjalanan Dinas (SPD) Baru - ' . $this->namaPegawai,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.surat-dinas-diajukan',
        );
    }
}
