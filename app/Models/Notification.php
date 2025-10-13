<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'to_uid',
        'title',
        'message',
        'link',
        'is_read',
        'type'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk notifikasi yang belum dibaca
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope untuk notifikasi yang sudah dibaca
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Tandai notifikasi sebagai sudah dibaca
     */
    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Tandai notifikasi sebagai belum dibaca
     */
    public function markAsUnread()
    {
        $this->update(['is_read' => false]);
    }
}