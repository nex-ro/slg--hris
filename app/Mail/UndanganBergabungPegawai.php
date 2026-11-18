<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UndanganBergabungPegawai extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $namaPegawai;
    public string $emailPegawai;
    public string $activationUrl;
    public string $divisi;
    public string $jabatan;

    public function __construct(User $user, string $token)
    {
        $this->namaPegawai = $user->name;
        $this->emailPegawai = $user->email;
        $this->divisi = $user->divisi ?: '-';
        $this->jabatan = $user->jabatan ?: '-';

        // URL langsung mengarah ke halaman reset-password untuk pembuatan password baru pertama kali
        $this->activationUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ], false));
        
        // Pastikan memakai domain produksi jika di konfigurasi atau host saat ini
        if (str_contains($this->activationUrl, 'localhost') || str_contains($this->activationUrl, '127.0.0.1')) {
            $path = route('password.reset', ['token' => $token, 'email' => $user->email], false);
            $this->activationUrl = 'https://my.sawitlestarigroup.co.id' . $path;
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Undangan Bergabung & Aktivasi Akun MY-SLG - ' . $this->namaPegawai,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.undangan-pegawai',
        );
    }
}
