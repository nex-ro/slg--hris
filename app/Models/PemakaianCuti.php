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
        'diketahui_atasan',
        'diketahui_hrd',
        'disetujui',
        'status_diketahui_atasan',
        'status_diketahui_hrd',
        'status_disetujui',
        'status_final',
        'tanggal_pengajuan',
        'catatan',
        'id_penerima_tugas',
        'tugas'
    ];

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
    public function updateStatusFinal()
{
    // Cek apakah ada yang ditolak
    if ($this->status_diketahui_atasan === 'ditolak' || 
        $this->status_diketahui_hrd === 'ditolak' || 
        $this->status_disetujui === 'ditolak') {
        $this->status_final = 'ditolak';
        return 'ditolak';
    }
    
    // Cek apakah semua yang diperlukan sudah disetujui
    $allApproved = true;
    
    if ($this->diketahui_atasan && $this->status_diketahui_atasan !== 'disetujui') {
        $allApproved = false;
    }
    if ($this->diketahui_hrd && $this->status_diketahui_hrd !== 'disetujui') {
        $allApproved = false;
    }
    if ($this->disetujui && $this->status_disetujui !== 'disetujui') {
        $allApproved = false;
    }
    
    if ($allApproved) {
        $this->status_final = 'disetujui';
        return 'disetujui';
    }
    
    $this->status_final = 'diproses';
    return 'diproses';
}


    public function jatahCuti()
    {
        return $this->belongsTo(JatahCuti::class, 'jatah_cuti_id');
    }

    public function diketahuiAtasanUser()
    {
        return $this->belongsTo(User::class, 'diketahui_atasan', 'id');
    }

    public function diketahuiHrdUser()
    {
        return $this->belongsTo(User::class, 'diketahui_hrd', 'id');
    }

    public function disetujuiUser()
    {
        return $this->belongsTo(User::class, 'disetujui', 'id');
    }

    public function penerimaTugas()
    {
        return $this->belongsTo(User::class, 'id_penerima_tugas');
    }
}