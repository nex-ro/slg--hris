<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class InventarisAccess
{
    /**
     * Handle an incoming request.
     * Hanya role 'eksekutif' dan 'it' yang berhak mengakses fitur Inventaris.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect('/login');
        }

        $role = strtolower(Auth::user()->role ?? '');
        if (!in_array($role, ['eksekutif', 'it'], true)) {
            abort(403, 'Akses ditolak. Fitur Inventaris hanya dapat diakses oleh Eksekutif dan IT.');
        }

        return $next($request);
    }
}
