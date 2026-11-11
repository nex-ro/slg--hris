<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DinasLuarController extends Controller
{
    /**
     * Halaman Pengajuan Dinas Luar
     */
    public function pengajuan(Request $request)
    {
        $user = Auth::user();

        // Sample data for initial setup / preview
        $pengajuanList = [
            [
                'id' => 1,
                'no_surat' => 'DL/2026/02/001',
                'nama' => $user ? $user->name : 'Budi Santoso',
                'divisi' => $user ? ($user->divisi ?? 'IT Support') : 'IT Support',
                'tujuan' => 'PT Mitra Solusi Surabaya',
                'lokasi' => 'Surabaya, Jawa Timur',
                'tanggal_mulai' => '2026-02-15',
                'tanggal_selesai' => '2026-02-17',
                'durasi' => 3,
                'keperluan' => 'Implementasi Sistem HRIS dan Pelatihan User',
                'transportasi' => 'Pesawat Terbang',
                'estimasi_biaya' => 4500000,
                'status' => 'approved', // pending, approved, rejected, completed
                'keterangan' => 'Disetujui oleh Head Divisi',
                'created_at' => '2026-02-05',
            ],
            [
                'id' => 2,
                'no_surat' => 'DL/2026/02/002',
                'nama' => $user ? $user->name : 'Siti Rahma',
                'divisi' => $user ? ($user->divisi ?? 'Operasional') : 'Operasional',
                'tujuan' => 'Kantor Cabang Bandung',
                'lokasi' => 'Bandung, Jawa Barat',
                'tanggal_mulai' => '2026-02-22',
                'tanggal_selesai' => '2026-02-24',
                'durasi' => 3,
                'keperluan' => 'Audit Operasional Lapangan Triwulan I',
                'transportasi' => 'Kereta Api (Whoosh)',
                'estimasi_biaya' => 2800000,
                'status' => 'pending',
                'keterangan' => 'Menunggu verifikasi Head',
                'created_at' => '2026-02-09',
            ],
            [
                'id' => 3,
                'no_surat' => 'DL/2026/01/014',
                'nama' => $user ? $user->name : 'Ahmad Fauzi',
                'divisi' => $user ? ($user->divisi ?? 'Marketing') : 'Marketing',
                'tujuan' => 'Jakarta Convention Center (JCC)',
                'lokasi' => 'Jakarta Pusat',
                'tanggal_mulai' => '2026-01-20',
                'tanggal_selesai' => '2026-01-21',
                'durasi' => 2,
                'keperluan' => 'Menghadiri Expo Franchise Indonesia',
                'transportasi' => 'Kendaraan Operasional Kantor',
                'estimasi_biaya' => 1200000,
                'status' => 'completed',
                'keterangan' => 'Selesai & Biaya telah dilaporkan',
                'created_at' => '2026-01-15',
            ],
        ];

        return Inertia::render('DinasLuar/Pengajuan', [
            'pengajuanList' => $pengajuanList,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Halaman Pencatatan Dinas Luar & Upload Excel Biaya Realisasi
     */
    public function pencatatan(Request $request)
    {
        $user = Auth::user();

        // Sample initial data for realization cost recordings
        $pencatatanList = [
            [
                'id' => 1,
                'no_sppd' => 'DL/2026/01/014',
                'nama_pegawai' => $user ? $user->name : 'Ahmad Fauzi',
                'divisi' => $user ? ($user->divisi ?? 'Marketing') : 'Marketing',
                'tujuan' => 'Jakarta Convention Center (JCC)',
                'tanggal_dinas' => '2026-01-20 s/d 2026-01-21',
                'estimasi_biaya' => 1200000,
                'realisasi_biaya' => 1150000,
                'selisih' => -50000, // surplus / pengembalian dana
                'status_verifikasi' => 'verified', // pending, verified, rejected
                'file_excel' => 'realisasi_biaya_DL_2026_01_014.xlsx',
                'tanggal_upload' => '2026-01-23',
                'rincian' => [
                    ['kategori' => 'Transportasi / Bensin & Tol', 'nominal' => 450000, 'bukti' => 'struk_tol_bensin.pdf'],
                    ['kategori' => 'Akomodasi / Penginapan', 'nominal' => 400000, 'bukti' => 'invoice_hotel.pdf'],
                    ['kategori' => 'Konsumsi & Uang Saku', 'nominal' => 300000, 'bukti' => 'nota_makan.pdf'],
                ],
            ],
            [
                'id' => 2,
                'no_sppd' => 'DL/2026/02/001',
                'nama_pegawai' => $user ? $user->name : 'Budi Santoso',
                'divisi' => $user ? ($user->divisi ?? 'IT Support') : 'IT Support',
                'tujuan' => 'PT Mitra Solusi Surabaya',
                'tanggal_dinas' => '2026-02-15 s/d 2026-02-17',
                'estimasi_biaya' => 4500000,
                'realisasi_biaya' => 4620000,
                'selisih' => 120000, // reimbursement
                'status_verifikasi' => 'pending',
                'file_excel' => 'realisasi_biaya_DL_2026_02_001.xlsx',
                'tanggal_upload' => '2026-02-18',
                'rincian' => [
                    ['kategori' => 'Tiket Pesawat PP', 'nominal' => 2600000, 'bukti' => 'tiket_pesawat.pdf'],
                    ['kategori' => 'Hotel (2 Malam)', 'nominal' => 1200000, 'bukti' => 'invoice_hotel.pdf'],
                    ['kategori' => 'Transport Lokal (Grab/Taxi)', 'nominal' => 370000, 'bukti' => 'e_receipt_grab.pdf'],
                    ['kategori' => 'Uang Harian / Saku', 'nominal' => 450000, 'bukti' => 'lembar_penerimaan.pdf'],
                ],
            ],
        ];

        return Inertia::render('DinasLuar/Pencatatan', [
            'pencatatanList' => $pencatatanList,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }
}

