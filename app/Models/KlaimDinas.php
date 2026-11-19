<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KlaimDinas extends Model
{
    use HasFactory;

    protected $table = 'klaim_dinas';

    protected $fillable = [
        'uid',
        'nomor_klaim',
        'nomor_surat_dinas',
        'nama_lengkap',
        'email',
        'jabatan',
        'divisi',
        'kegiatan',
        'periode_awal',
        'periode_akhir',
        'kota_penandatangan',
        'tanggal_pengajuan',
        'cash_advance',
        'total_realisasi',
        'sisa_kurang',
        'no_rekening',
        'nama_bank',
        'nama_rekening',
        'metode_nota',
        'file_nota_pdf',
        'catatan_pemohon',
        'status',
        'diperiksa_oleh_id',
        'diperiksa_oleh_nama',
        'diperiksa_oleh_jabatan',
        'diperiksa_pada',
        'catatan_hrd',
    ];

    protected $casts = [
        'periode_awal' => 'date:Y-m-d',
        'periode_akhir' => 'date:Y-m-d',
        'tanggal_pengajuan' => 'date:Y-m-d',
        'diperiksa_pada' => 'datetime',
        'cash_advance' => 'decimal:2',
        'total_realisasi' => 'decimal:2',
        'sisa_kurang' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    public function pemeriksa()
    {
        return $this->belongsTo(User::class, 'diperiksa_oleh_id');
    }

    public function items()
    {
        return $this->hasMany(KlaimDinasItem::class, 'klaim_dinas_id');
    }
}
