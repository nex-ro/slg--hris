<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class Hrd
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect('/');
        }

        $role = strtolower(Auth::user()->role ?? '');
        if (!in_array($role, ['hrd', 'head', 'eksekutif', 'it'], true)) {
            return redirect('/');
        }
        return $next($request);
    }
    
}
