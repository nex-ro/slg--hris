<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\HrdController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\HolidayController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\ResignController;
use App\Http\Controllers\PegawaiController;
use App\Models\Resign;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SakitController;
use App\Http\Controllers\IzinController;
use App\Http\Controllers\CutiController;



Route::get('/tes', function () {
    return Inertia::render('tes', []);
});
    Route::post('/dokumen/file-resign/{id}', [PegawaiController::class, 'filestore']);

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
    }elseif($role ==='eksekutif'){
        return redirect()->route('head.dashboard');

    }

    return redirect('/login');
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/{id}/click', [NotificationController::class, 'markAsReadOnClick']); // NEW
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});

Route::middleware('pegawai')->group(function () {
    Route::get('/dashboard', [UserController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
    Route::get('/dokumen/file/resign/{id}', function ($id) {
    $resign = Resign::findOrFail($id);
    return Inertia::render('User/Pengajuan/FileResign', [
        'resign' => $resign
    ]); 
    });
    Route::get('/pegawai/absensi/{id}', [AbsensiController::class, 'absensiUser'])->name('absensi');
    Route::put('/izin/{id}', [IzinController::class, 'update'])->name('izin.update');
    Route::get('/pegawai/sakit', [SakitController::class, 'index'])->middleware(['auth', 'verified'])->name('sakit.index');
    Route::post('/sakit', [SakitController::class, 'store'])->name('sakit.store');
    Route::put('/sakit/{id}', [SakitController::class, 'update'])->name('sakit.update');
    Route::delete('/sakit/{id}', [SakitController::class, 'destroy'])->name('sakit.destroy');
    Route::get('/sakit/{id}/download', [SakitController::class, 'downloadBukti'])->name('sakit.download');

    Route::get('/pegawai/izin', [IzinController::class, 'index'])->name('pegawai.izin');
    Route::post('/izin', [IzinController::class, 'store'])->name('izin.store');
    Route::delete('/izin/{id}', [IzinController::class, 'destroy'])->name('izin.destroy');

    Route::get('/dokumen', [PegawaiController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
    Route::post('/dokumen/resign', [PegawaiController::class, 'store'])->name('pegawai.resign.store');
    Route::put('/dokumen/resign/{id}', [PegawaiController::class, 'update'])->name('pegawai.resign.update');

    Route::get('/pegawai/cuti', [CutiController::class, 'index'])->middleware(['auth', 'verified'])->name('pegawai.izin');
    Route::put('/user/jatah-cuti/{id}', [CutiController::class, 'update'])->name('jatah-cuti.update');
    Route::get('/user/jatah-cuti/{id}', [CutiController::class, 'show'])->name('jatah-cuti.show');
    Route::post('/user/jatah-cuti', [CutiController::class, 'store'])->name('jatah-cuti.store');
    Route::delete('/user/jatah-cuti/{id}', [CutiController::class, 'destroy'])->name('jatah-cuti.destroy');

        Route::get('/hrd/cuti', [CutiController::class, 'Admin'])->name('hrd.cuti.index');

            Route::get('/cuti', [CutiController::class, 'index'])->name('cuti.index');
    Route::get('/cuti/create', [CutiController::class, 'create'])->name('cuti.create');
    Route::post('/cuti/store', [CutiController::class, 'storePengajuan'])->name('cuti.store');
    Route::get('/cuti/rekan-kerja', [CutiController::class, 'getRekanKerja'])->name('cuti.rekan-kerja');

    Route::get('/cuti/approvers', [CutiController::class, 'getApprovers'])->name('cuti.approvers'); // Route baru

});

Route::middleware('hrd')->group(function () {

    Route::get('/api/pegawai', [UserController::class, 'getPegawai'])->middleware(['auth', 'verified'])->name('getPegawai');
    Route::get('/HRD/dashboard', [HrdController::class, 'index'])->middleware(['auth', 'verified'])->name('hrd.dashboard');
    Route::get('/pegawai/list', [UserController::class, 'pegawai'])->middleware(['auth', 'verified'])->name('pegawai');
    Route::post('/pegawai', [UserController::class, 'store'])->name('pegawai.store');
    Route::put('/pegawai/{id}', [UserController::class, 'update'])->name('pegawai.update');
    Route::delete('/pegawai/{id}', [UserController::class, 'destroy'])->name('pegawai.destroy');
    Route::get('/absensi/list', [AbsensiController::class, 'absensi'])->name('absensi');
    Route::post('absensi/save', [AbsensiController::class, 'saveAbsensi'])->name('absensi.save');
    Route::get('/absensi/input-harian', [AbsensiController::class, 'inputHarian'])->name('absensi.harian');
    Route::post('/kehadiran/update-keterangan', [AbsensiController::class, 'updateKeterangan'])->name('kehadiran.update-keterangan');

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

    Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays.index');
    Route::post('/kehadiran/update-status', [AbsensiController::class, 'updateStatus'])->middleware(['auth']);

    Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');
    Route::put('/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
    Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');

    Route::post('/holidays/delete-by-date', [HolidayController::class, 'destroyByDate'])->name('holidays.destroyByDate');

    Route::get('/pegawai/resign', [ResignController::class, 'index'])->name('Resign.index');
    Route::get('/pegawai/resign', [ResignController::class, 'index'])->name('Resign.index');
    Route::post('/resign', [ResignController::class, 'store'])->name('Resign.store');
    Route::put('/resign/{id}/status', [ResignController::class, 'updateStatus'])->name('Resign.updateStatus');
    Route::delete('/resign/{id}', [ResignController::class, 'destroy'])->name('Resign.destroy');

    Route::get('/perizinan/sakit', [SakitController::class, 'admin'])->middleware(['auth', 'verified'])->name('sakit.admin');
    Route::put('/admin/sakit/{id}/status', [SakitController::class, 'updateStatus'])->name('sakit.updateStatus');
    Route::put('/admin/sakit/{id}', [SakitController::class, 'adminUpdate'])->name('sakit.adminUpdate');
    Route::post('/admin/sakit', [SakitController::class, 'adminStore'])->name('sakit.admin.store');
    Route::delete('/admin/sakit/{id}', [SakitController::class, 'adminDestroy'])->name('sakit.adminDestroy');

    Route::get('/perizinan/keluar-kantor', [IzinController::class, 'hrd'])->middleware(['auth', 'verified'])->name('perizinan.keluar');
    Route::post('/perizinan/{id}/approve', [IzinController::class, 'approve'])->name('hrd.perizinan.approve');
    Route::post('/perizinan/{id}/reject', [IzinController::class, 'reject'])->name('hrd.perizinan.reject');
    Route::get('/hrd/perizinan', [IzinController::class, 'hrd']);
    Route::post('/hrd/perizinan/store', [IzinController::class, 'storeByHrd']);

    Route::post('/hrd/perizinan/{id}/approve', [IzinController::class, 'approve']);
    Route::post('/hrd/perizinan/{id}/reject', [IzinController::class, 'reject']);
    
    // Delete perizinan
    Route::delete('/hrd/perizinan/{id}', [IzinController::class, 'destroy']);

    Route::get('/perizinan/cuti', [CutiController::class, 'Admin'])->middleware(['auth', 'verified'])->name('perizinan.cuti');
    Route::get('/cuti', [CutiController::class, 'index'])->name('cuti.index');
    Route::post('/cuti', [CutiController::class, 'store'])->name('hrd.cuti.store');
    Route::put('/cuti/{id}', [CutiController::class, 'update'])->name('hrd.cuti.update');
    Route::delete('/cuti/{id}', [CutiController::class, 'destroy'])->name('hrd.cuti.destroy');
    Route::post('/cuti/calculate', [CutiController::class, 'calculateCuti'])->name('hrd.cuti.calculate');

    Route::post('/hrd/cuti/approval', [CutiController::class, 'approval'])->name('hrd.cuti.approval');

    Route::post('/hrd/cuti/store-pengajuan-admin', [CutiController::class, 'storePengajuanAdmin'])
    ->name('hrd.cuti.storePengajuanAdmin');

    
});
Route::middleware('head')->group(function () {
    Route::get('/HEAD/dashboard', [HrdController::class, 'index'])->middleware(['auth', 'verified'])->name('head.dashboard');
    Route::get('/absensi/list/{divisi}', [AbsensiController::class, 'absensiHead'])->name('absensi.head');
    Route::get('/kehadiran/divisi', [HrdController::class, 'getByDateAndDivisi']);
    Route::get('/pegawai/{divisi}', [UserController::class, 'pegawaiHead'])->name('pegawai.head');
    Route::get('/head/cuti', [CutiController::class, 'indexHead'])->name('cuti.head');


});

Route::middleware('auth')->group(function () {
    Route::get('/api/users', [UserController::class, 'getUsers']);
    Route::get('/kehadiran', [HrdController::class, 'getByDate']);
    Route::get('/api/holidays', [UserController::class, 'holiday']);
    Route::delete('/cuti/pengajuan/{id}', [CutiController::class, 'destroyPengajuan'])->name('cuti.destroyPengajuan');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/api/userss', [IzinController::class, 'getUsers']);
    Route::get('/api/heads', [IzinController::class, 'getHeads']);
    Route::get('/izin/{id}/pdf', [IzinController::class, 'generatePdf'])->name('izin.pdf');
    Route::get('/api/kehadiran/by-user', [HrdController::class, 'getByUser']);
    Route::get('/cuti/download-pdf/{id}', [CutiController::class, 'downloadPdf'])->name('cuti.download-pdf');
});

require __DIR__.'/auth.php';
Route::fallback(function () {
    return Inertia::render('NotFound');
});
