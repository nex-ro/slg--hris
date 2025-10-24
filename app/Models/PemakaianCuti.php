<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PemakaianCuti extends Model
{
    use HasFactory;

    protected $table = 'pemakaian_cuti';

    protected $fillable = [
        'uid',
        'jatah_cuti_id',
        'tanggal_mulai',
        'tanggal_selesai',
        'cuti_setengah_hari',
        'jumlah_hari',
        'alasan',
        'status',
        'disetujui_oleh',
        'diketahui_oleh',
        'diterima',
        'status_disetujui_oleh',
        'status_diketahui_oleh',
        'status_diterima',
        'tanggal_pengajuan',
        'catatan',
        'id_penerima_tugas',
        'tugas'
    ];

    // Tambahkan casting untuk tanggal
    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'tanggal_pengajuan' => 'date',
        'cuti_setengah_hari' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    public function jatahCuti()
    {
        return $this->belongsTo(JatahCuti::class, 'jatah_cuti_id');
    }
// Di class PemakaianCuti, tambahkan method relasi berikut:

public function disetujuiOlehUser()
{
    return $this->belongsTo(User::class, 'disetujui_oleh', 'id');
}

public function diketahuiOlehUser()
{
    return $this->belongsTo(User::class, 'diketahui_oleh', 'id');
}

public function diterimaOlehUser()
{
    return $this->belongsTo(User::class, 'diterima', 'id');
}

    // Relasi untuk penerima tugas
    public function penerimaTugas()
    {
        return $this->belongsTo(User::class, 'id_penerima_tugas');
    }
}