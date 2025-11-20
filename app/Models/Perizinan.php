<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Perizinan extends Model
{
    use HasFactory;

    protected $table = 'perizinans';
    protected $fillable = [
        'uid',
        'uid_diketahui',
        'uid_disetujui',
        'type_perizinan',
        'tanggal',
        'jam_keluar',
        'jam_kembali',
        'keperluan',
        'status',
        'status_disetujui',
        'status_diketahui',
        'catatan',
    ];

    /**
     * Pegawai yang mengajukan izin
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    /**
     * Pegawai yang mengetahui
     */
    public function diketahuiOleh()
    {
        return $this->belongsTo(User::class, 'uid_diketahui');
    }

    /**
     * Pegawai yang menyetujui
     */
    public function disetujuiOleh()
    {
        return $this->belongsTo(User::class, 'uid_disetujui');
    }
}