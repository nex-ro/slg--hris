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
    return redirect('/login');
});

Route::get('/pegawai', [UserController::class, 'pegawai'])->middleware(['auth', 'verified'])->name('pegawai');
Route::post('/pegawai', [UserController::class, 'store'])->name('pegawai.store');
Route::put('/pegawai/{id}', [UserController::class, 'update'])->name('pegawai.update');
Route::delete('/pegawai/{id}', [UserController::class, 'destroy'])->name('pegawai.destroy');
Route::get('/absensi/list', [AbsensiController::class, 'absensi'])->name('absensi');
Route::post('absensi/save', [AbsensiController::class, 'saveAbsensi'])->name('absensi.save');
Route::get('/absensi/input-harian', [AbsensiController::class, 'inputHarian'])->name('absensi.harian');
Route::get('/kehadiran', [HrdController::class, 'getByDate']);
Route::get('/absensi/input-tidak-hadir', [AbsensiController::class, 'inputTidak'])->name('absensi.tidak');
Route::post('/hrd/absen/input-tidak', [AbsensiController::class, 'storeInputTidak'])->name('hrd.absen.input-tidak.store');
Route::post('/hrd/absen/input-tidak', [AbsensiController::class, 'storeInputTidak'])->name('hrd.absen.input-tidak.store');
Route::get('/absensi/dokumen', [AbsensiController::class, 'dokumen'])->name('hrd.absen.dokument');
Route::post('/print-absensi', [AbsensiController::class, 'printAbsensi'])->name('print.absensi');
Route::post('/print-katering', [AbsensiController::class, 'printKatering'])->name('print.katering');

Route::middleware('pegawai')->group(function () {
    Route::get('/dashboard', [UserController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
});

Route::middleware('hrd')->group(function () {
    Route::get('/HRD/dashboard', [HrdController::class, 'index'])->middleware(['auth', 'verified'])->name('hrd.dashboard');
});
Route::middleware('head')->group(function () {
    Route::get('/HEAD/dashboard', [UserController::class, 'head'])->middleware(['auth', 'verified'])->name('head.dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';