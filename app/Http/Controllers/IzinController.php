<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Holiday;

class IzinController extends Controller
{
     public function index()
    {
        return Inertia::render('User/Dashboard', []);
    }
}
