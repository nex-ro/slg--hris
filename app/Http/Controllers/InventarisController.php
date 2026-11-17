<?php

namespace App\Http\Controllers;

use App\Models\Inventaris;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class InventarisController extends Controller
{
    /**
     * Halaman Utama Inventaris
     * Hanya bisa diakses oleh role 'eksekutif' dan 'it'
     */
    public function index(Request $request)
    {
        $inventarisList = [];

        try {
            if (Schema::hasTable('inventaris')) {
                $inventarisList = Inventaris::latest()->get();
            }
        } catch (\Exception $e) {
            $inventarisList = [];
        }

        return Inertia::render('Inventaris/Index', [
            'inventarisList' => $inventarisList,
            'flash' => session('flash'),
        ]);
    }

    /**
     * Simpan Aset Baru ke Database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang' => 'required|string|max:100|unique:inventaris,kode_barang',
            'nama_barang' => 'required|string|max:255',
            'kategori' => 'required|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'pengguna' => 'nullable|string|max:255',
            'lokasi' => 'nullable|string|max:255',
            'kondisi' => 'required|string|max:50',
            'status' => 'required|string|max:50',
            'nilai_aset' => 'nullable|numeric|min:0',
            'tanggal_perolehan' => 'nullable|date',
            'keterangan' => 'nullable|string|max:1000',
        ], [
            'kode_barang.unique' => 'Kode barang sudah digunakan, gunakan kode lain.',
            'kode_barang.required' => 'Kode barang wajib diisi.',
            'nama_barang.required' => 'Nama barang wajib diisi.',
        ]);

        $validated['nilai_aset'] = $validated['nilai_aset'] ?? 0;

        try {
            Inventaris::create($validated);
            return redirect()->back()->with('success', 'Aset inventaris berhasil ditambahkan.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menambahkan aset: ' . $e->getMessage());
        }
    }

    /**
     * Update Data Aset di Database
     */
    public function update(Request $request, $id)
    {
        $inventaris = Inventaris::findOrFail($id);

        $validated = $request->validate([
            'kode_barang' => 'required|string|max:100|unique:inventaris,kode_barang,' . $id,
            'nama_barang' => 'required|string|max:255',
            'kategori' => 'required|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'pengguna' => 'nullable|string|max:255',
            'lokasi' => 'nullable|string|max:255',
            'kondisi' => 'required|string|max:50',
            'status' => 'required|string|max:50',
            'nilai_aset' => 'nullable|numeric|min:0',
            'tanggal_perolehan' => 'nullable|date',
            'keterangan' => 'nullable|string|max:1000',
        ], [
            'kode_barang.unique' => 'Kode barang sudah digunakan oleh aset lain.',
            'kode_barang.required' => 'Kode barang wajib diisi.',
            'nama_barang.required' => 'Nama barang wajib diisi.',
        ]);

        $validated['nilai_aset'] = $validated['nilai_aset'] ?? 0;

        try {
            $inventaris->update($validated);
            return redirect()->back()->with('success', 'Data aset inventaris berhasil diperbarui.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memperbarui aset: ' . $e->getMessage());
        }
    }

    /**
     * Hapus Aset dari Database
     */
    public function destroy($id)
    {
        try {
            $inventaris = Inventaris::findOrFail($id);
            $inventaris->delete();

            return redirect()->back()->with('success', 'Aset inventaris berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal menghapus aset: ' . $e->getMessage());
        }
    }
}
