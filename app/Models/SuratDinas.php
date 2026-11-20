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
        'disetujui_oleh_id',
        'disetujui_oleh_nama',
        'disetujui_oleh_jabatan',
        'disetujui_pada',
    ];

    protected $casts = [
        'tanggal_berangkat' => 'date:Y-m-d',
        'tanggal_kembali' => 'date:Y-m-d',
        'disetujui_pada' => 'datetime',
        'ajukan_advance' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'disetujui_oleh_id');
    }
}
