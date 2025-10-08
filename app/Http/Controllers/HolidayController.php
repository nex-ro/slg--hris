<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class HolidayController extends Controller
{
    /**
     * Tampilkan kalender dengan hari libur
     */
   public function index(Request $request)
{
    $year = $request->get('year', date('Y'));
    $month = $request->get('month', date('m'));
    
    // Ambil SEMUA libur dalam tahun ini dan tahun depan (untuk kalender)
    $monthlyHolidays = Holiday::whereBetween('date', [
            now()->startOfYear(), 
            now()->addYear()->endOfYear()
        ])
        ->get()
        ->map(function ($holiday) {
            return [
                'date' => $holiday->date->format('Y-m-d'),
                'name' => $holiday->name
            ];
        })
        ->pluck('name', 'date')
        ->toArray();
    
    // Ambil semua libur yang belum lewat (dari hari ini ke depan)
    $allHolidays = Holiday::whereDate('date', '>=', now()->startOfDay())
        ->orderBy('date', 'asc')
        ->get()
        ->map(function ($holiday) {
            return [
                'id' => $holiday->id,
                'date' => $holiday->date->format('Y-m-d'),
                'name' => $holiday->name,
                'year' => $holiday->year
            ];
        });
    
    return Inertia::render('Hrd/Liburan', [
        'year' => (int) $year,
        'month' => (int) $month,
        'holidays' => $monthlyHolidays,
        'allHolidays' => $allHolidays
    ]);
}
    /**
     * Simpan libur baru (range tanggal)
     */
    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'name' => 'required|string|max:255',
        ]);
        
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        
        // Loop dari tanggal awal ke akhir
        $created = 0;
        while ($startDate->lte($endDate)) {
            Holiday::firstOrCreate(
                ['date' => $startDate->format('Y-m-d')],
                [
                    'name' => $request->name,
                    'year' => $startDate->year
                ]
            );
            $startDate->addDay();
            $created++;
        }
        
        return back()->with('success', "Berhasil menambahkan {$created} hari libur");
    }
    
    /**
     * Update nama libur
     */
    public function update(Request $request, Holiday $holiday)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
        
        $holiday->update([
            'name' => $request->name
        ]);
        
        return back()->with('success', 'Libur berhasil diupdate');
    }
    
    /**
     * Hapus libur
     */
    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        
        return back()->with('success', 'Libur berhasil dihapus');
    }
    
    /**
     * Hapus multiple libur berdasarkan tanggal
     */
    public function destroyByDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date'
        ]);
        
        Holiday::where('date', $request->date)->delete();
        
        return back()->with('success', 'Libur berhasil dihapus');
    }
}