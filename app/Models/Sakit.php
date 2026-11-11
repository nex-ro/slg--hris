<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sakit extends Model
{
    use HasFactory;

    protected $table = 'sakits';

    protected $fillable = [
        'uid',
        'tanggal_mulai',
        'tanggal_selesai',
        'keterangan',
        'bukti',
        'status',
    ];

    /**
     * Relasi ke tabel users (pegawai yang mengajukan sakit)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'uid');
    }

    /**
     * Accessor untuk status badge
     */
    public function getStatusBadgeAttribute()
    {
        $badges = [
            'Diproses' => ['color' => 'yellow', 'text' => 'Diproses'],
            'Disetujui' => ['color' => 'green', 'text' => 'Disetujui'],
            'Ditolak' => ['color' => 'red', 'text' => 'Ditolak'],
        ];

        return $badges[$this->status] ?? $badges['Diproses'];
    }

    /**
     * Scope untuk filter berdasarkan status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk filter berdasarkan user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('uid', $userId);
    }
}