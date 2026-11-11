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
         'is_manual',
        'file_path',
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
    // Tambahkan di class PemakaianCuti

public function canApproveAsAtasan($userId)
{
    return $this->diketahui_atasan == $userId && 
           $this->status_diketahui_atasan === 'diproses' &&
           $this->status_final === 'diproses';
}

public function canApproveAsHRD($userId)
{
    // HRD hanya bisa approve jika:
    // 1. Dia adalah HRD yang ditunjuk
    // 2. Status HRD masih diproses
    // 3. Status final masih diproses
    // 4. Jika ada atasan, atasan harus sudah menyetujui
    
    if ($this->diketahui_hrd != $userId || 
        $this->status_diketahui_hrd !== 'diproses' || 
        $this->status_final !== 'diproses') {
        return false;
    }
    
    // Jika ada atasan, cek apakah sudah disetujui
    if ($this->diketahui_atasan) {
        return $this->status_diketahui_atasan === 'disetujui';
    }
    
    return true;
}

public function canApproveAsPimpinan($userId)
{
    // Pimpinan hanya bisa approve jika:
    // 1. Dia adalah pimpinan yang ditunjuk
    // 2. Status pimpinan masih diproses
    // 3. Status final masih diproses
    // 4. Semua approver sebelumnya (atasan & HRD) sudah menyetujui
    
    if ($this->disetujui != $userId || 
        $this->status_disetujui !== 'diproses' || 
        $this->status_final !== 'diproses') {
        return false;
    }
    
    // Cek atasan (jika ada)
    if ($this->diketahui_atasan && $this->status_diketahui_atasan !== 'disetujui') {
        return false;
    }
    
    // Cek HRD (jika ada)
    if ($this->diketahui_hrd && $this->status_diketahui_hrd !== 'disetujui') {
        return false;
    }
    
    return true;
}

public function getApprovalHierarchyStatus()
{
    $hierarchy = [];
    
    if ($this->diketahui_atasan) {
        $hierarchy[] = [
            'level' => 'Atasan',
            'user_id' => $this->diketahui_atasan,
            'status' => $this->status_diketahui_atasan,
            'can_approve' => $this->status_diketahui_atasan === 'diproses'
        ];
    }
    
    if ($this->diketahui_hrd) {
        $canApprove = $this->status_diketahui_hrd === 'diproses';
        if ($this->diketahui_atasan) {
            $canApprove = $canApprove && $this->status_diketahui_atasan === 'disetujui';
        }
        
        $hierarchy[] = [
            'level' => 'HRD',
            'user_id' => $this->diketahui_hrd,
            'status' => $this->status_diketahui_hrd,
            'can_approve' => $canApprove
        ];
    }
    
    if ($this->disetujui) {
        $canApprove = $this->status_disetujui === 'diproses';
        if ($this->diketahui_atasan) {
            $canApprove = $canApprove && $this->status_diketahui_atasan === 'disetujui';
        }
        if ($this->diketahui_hrd) {
            $canApprove = $canApprove && $this->status_diketahui_hrd === 'disetujui';
        }
        
        $hierarchy[] = [
            'level' => 'Pimpinan',
            'user_id' => $this->disetujui,
            'status' => $this->status_disetujui,
            'can_approve' => $canApprove
        ];
    }
    
    return $hierarchy;
}
}