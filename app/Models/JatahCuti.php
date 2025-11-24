<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JatahCuti extends Model
{
    use HasFactory;

    protected $table = 'jatah_cuti';

    protected $fillable = [
        'uid',
        'tahun_ke',
        'tahun',
        'jumlah_cuti',
        'cuti_dipakai',
        'sisa_cuti',
        'pinjam_tahun_prev',
        'pinjam_tahun_next',
       
        'keterangan',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    public function pemakaian()
    {
        return $this->hasMany(PemakaianCuti::class, 'jatah_cuti_id');
    }
}
