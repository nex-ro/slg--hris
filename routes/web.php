<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\HrdController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AbsensiController;

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
Route::get('/', function () {
    if (!Auth::check()) {
        return redirect('/login');
    }
    $role = Auth::user()->role;

    if ($role === 'pegawai') {
        return redirect()->route('dashboard');
    } elseif ($role === 'hrd') {
        return redirect()->route('hrd.dashboard');
    } elseif ($role === 'head') {
        return redirect()->route('head.dashboard');
    }

    return redirect('/login');
});




Route::middleware('pegawai')->group(function () {
    Route::get('/dashboard', [UserController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
});

Route::middleware('hrd')->group(function () {
    Route::get('/api/pegawai', [UserController::class, 'getPegawai'])->middleware(['auth', 'verified'])->name('getPegawai');
    Route::get('/HRD/dashboard', [HrdController::class, 'index'])->middleware(['auth', 'verified'])->name('hrd.dashboard');
    Route::get('/pegawai', [UserController::class, 'pegawai'])->middleware(['auth', 'verified'])->name('pegawai');
    Route::post('/pegawai', [UserController::class, 'store'])->name('pegawai.store');
    Route::put('/pegawai/{id}', [UserController::class, 'update'])->name('pegawai.update');
    Route::delete('/pegawai/{id}', [UserController::class, 'destroy'])->name('pegawai.destroy');
    Route::get('/absensi/list', [AbsensiController::class, 'absensi'])->name('absensi');
    Route::post('absensi/save', [AbsensiController::class, 'saveAbsensi'])->name('absensi.save');
    Route::get('/absensi/input-harian', [AbsensiController::class, 'inputHarian'])->name('absensi.harian');

    Route::post('/kehadiran/manual', [AbsensiController::class, 'ManualInput'])->name('kehadiran.manual');
    Route::get('/absensi/input-tidak-hadir', [AbsensiController::class, 'inputTidak'])->name('absensi.tidak');
    Route::post('/hrd/absen/input-tidak', [AbsensiController::class, 'storeInputTidak'])->name('hrd.absen.input-tidak.store');
    Route::post('/hrd/absen/input-tidak', [AbsensiController::class, 'storeInputTidak'])->name('hrd.absen.input-tidak.store');
    Route::get('/absensi/dokumen', [AbsensiController::class, 'dokumen'])->name('hrd.absen.dokument');
    Route::post('/print-absensi', [AbsensiController::class, 'printAbsensi'])->name('print.absensi');
    Route::post('/print-absensi-pdf', [AbsensiController::class, 'printAbsensiPDF'])->name('print.absensiPDF');

    Route::post('/print-katering', [AbsensiController::class, 'printKatering'])->name('print.katering');
    Route::post('/print-katering-pdf', [AbsensiController::class, 'printKateringPDF'])->name('print.kateringPDF');

    Route::get('/kehadiran/by-month', [HrdController::class, 'getByMonth']);

    Route::get('/absensi/export-tower-divisi', [HrdController::class, 'exportByTowerAndDivisi']);

    Route::get('/kehadiran/print-monthly', [AbsensiController::class, 'printAbsensiMonthly'])->name('kehadiran.print-monthly');
    Route::get('/kehadiran/print-monthly-pdf', [AbsensiController::class, 'printAbsensiMonthlyPDF'])->name('kehadiran.print-monthly-pdf');
    Route::get('/kehadiran/print-custom', [AbsensiController::class, 'printAbsensiCustom']);
    Route::get('/kehadiran/print-rekapall', [AbsensiController::class, 'printRekapAll']);
});
Route::middleware('head')->group(function () {
    Route::get('/HEAD/dashboard', [UserController::class, 'head'])->middleware(['auth', 'verified'])->name('head.dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/api/users', [UserController::class, 'getUsers']);
    Route::get('/kehadiran', [HrdController::class, 'getByDate']);
    Route::get('/api/holidays', [UserController::class, 'index']);
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';