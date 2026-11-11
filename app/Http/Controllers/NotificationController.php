<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Ambil semua notifikasi user yang login berdasarkan role
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $userRole = $user->role; 
        $query = Notification::where(function($q) use ($user, $userRole) {
            $q->where('to_uid', $user->id);
            
            $q->orWhere(function($subQ) use ($userRole) {
                $subQ->whereNull('to_uid')
                     ->where(function($typeQ) use ($userRole) {
                         $typeQ->where('type', 'all'); 
                         if (in_array($userRole, ['hrd', 'head'])) {
                             $typeQ->orWhere('type', 'hrd'); 
                         }
                         if ($userRole === 'head') {
                             $typeQ->orWhere('type', 'atasan'); 
                         }
                     });
            });
        })->latest();
        
        $notifications = $query->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $this->getUnreadCount()
        ]);
    }

    /**
     * Ambil jumlah notifikasi yang belum dibaca berdasarkan role
     */
    public function unreadCount()
    {
        return response()->json([
            'success' => true,
            'count' => $this->getUnreadCount()
        ]);
    }

    /**
     * Helper untuk hitung unread notifications berdasarkan role
     */
    private function getUnreadCount()
    {
        $user = auth()->user();
        $userRole = $user->role;
        
        return Notification::where('is_read', false)
            ->where(function($q) use ($user, $userRole) {
                // Notifikasi yang ditujukan untuk user ini (to_uid)
                $q->where('to_uid', $user->id);
                
                // Atau notifikasi broadcast (to_uid null) berdasarkan type dan role
                $q->orWhere(function($subQ) use ($userRole) {
                    $subQ->whereNull('to_uid')
                         ->where(function($typeQ) use ($userRole) {
                             $typeQ->where('type', 'all');
                             
                             if (in_array($userRole, ['hrd', 'head'])) {
                                 $typeQ->orWhere('type', 'hrd');
                             }
                             
                             if ($userRole === 'head') {
                                 $typeQ->orWhere('type', 'atasan');
                             }
                         });
                });
            })
            ->count();
    }

    /**
     * Tandai notifikasi sebagai sudah dibaca
     */
    public function markAsRead($id)
    {
        $user = auth()->user();
        $userRole = $user->role;
        
        $notification = Notification::where('id', $id)
            ->where(function($q) use ($user, $userRole) {
                // Notifikasi yang ditujukan untuk user ini (to_uid)
                $q->where('to_uid', $user->id);
                
                // Atau notifikasi broadcast (to_uid null) berdasarkan type dan role
                $q->orWhere(function($subQ) use ($userRole) {
                    $subQ->whereNull('to_uid')
                         ->where(function($typeQ) use ($userRole) {
                             $typeQ->where('type', 'all');
                             
                             if (in_array($userRole, ['hrd', 'head'])) {
                                 $typeQ->orWhere('type', 'hrd');
                             }
                             
                             if ($userRole === 'head') {
                                 $typeQ->orWhere('type', 'atasan');
                             }
                         });
                });
            })
            ->firstOrFail();
        
        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sebagai sudah dibaca'
        ]);
    }

    /**
     * Tandai semua notifikasi sebagai sudah dibaca
     */
    public function markAllAsRead()
    {
        $user = auth()->user();
        $userRole = $user->role;
        
        Notification::where('is_read', false)
            ->where(function($q) use ($user, $userRole) {
                // Notifikasi yang ditujukan untuk user ini (to_uid)
                $q->where('to_uid', $user->id);
                
                // Atau notifikasi broadcast (to_uid null) berdasarkan type dan role
                $q->orWhere(function($subQ) use ($userRole) {
                    $subQ->whereNull('to_uid')
                         ->where(function($typeQ) use ($userRole) {
                             $typeQ->where('type', 'all');
                             
                             if (in_array($userRole, ['hrd', 'head'])) {
                                 $typeQ->orWhere('type', 'hrd');
                             }
                             
                             if ($userRole === 'head') {
                                 $typeQ->orWhere('type', 'atasan');
                             }
                         });
                });
            })
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai sebagai sudah dibaca'
        ]);
    }

    /**
     * Hapus notifikasi
     */
   public function markAsReadOnClick($id)
{
    $user = auth()->user();
    $userRole = $user->role;
    
    $notification = Notification::where('id', $id)
        ->where(function($q) use ($user, $userRole) {
            // Notifikasi yang ditujukan untuk user ini (to_uid)
            $q->where('to_uid', $user->id);
            
            // Atau notifikasi broadcast (to_uid null) berdasarkan type dan role
            $q->orWhere(function($subQ) use ($userRole) {
                $subQ->whereNull('to_uid')
                     ->where(function($typeQ) use ($userRole) {
                         $typeQ->where('type', 'all');
                         
                         if (in_array($userRole, ['hrd', 'head'])) {
                             $typeQ->orWhere('type', 'hrd');
                         }
                         
                         if ($userRole === 'head') {
                             $typeQ->orWhere('type', 'atasan');
                         }
                     });
            });
        })
        ->firstOrFail();
    
    // Update is_read menjadi true
    $notification->update(['is_read' => true]);

    return response()->json([
        'success' => true,
        'message' => 'Notifikasi ditandai sebagai sudah dibaca',
        'link' => $notification->link, // Bisa null atau berisi URL
        'has_link' => !empty($notification->link) // Tambahan info
    ]);
}


    public function destroy($id)
    {
        $user = auth()->user();
        $userRole = $user->role;
        
        $notification = Notification::where('id', $id)
            ->where(function($q) use ($user, $userRole) {
                // Notifikasi yang ditujukan untuk user ini (to_uid)
                $q->where('to_uid', $user->id);
                
                // Atau notifikasi broadcast (to_uid null) berdasarkan type dan role
                $q->orWhere(function($subQ) use ($userRole) {
                    $subQ->whereNull('to_uid')
                         ->where(function($typeQ) use ($userRole) {
                             $typeQ->where('type', 'all');
                             
                             if (in_array($userRole, ['hrd', 'head'])) {
                                 $typeQ->orWhere('type', 'hrd');
                             }
                             
                             if ($userRole === 'head') {
                                 $typeQ->orWhere('type', 'atasan');
                             }
                         });
                });
            })
            ->firstOrFail();
        
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi berhasil dihapus'
        ]);
    }
}