<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratDinas extends Model
{
    use HasFactory;

    protected $table = 'surat_dinas';

    protected $fillable = [
        'uid',
        'email',
        'nama_lengkap',
        'nomor_surat',
        'jabatan',
        'pemberi_tugas',
        'tanggal_berangkat',
        'tanggal_kembali',
        'keterangan_kembali',
        'tujuan',
        'keperluan',
        'transportasi',
        'ajukan_advance',
        'panjar_nominal',
        'panjar_terbilang',
        'nama_rekening',
        'nomor_rekening',
        'nama_bank',
        'status',
        'catatan',
    ];

    protected $casts = [
        'tanggal_berangkat' => 'date',
        'tanggal_kembali' => 'date',
        'ajukan_advance' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }
}
