<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;


class UserController extends Controller
{
    public function pegawai()
    {
        return Inertia::render('Hrd/Pegawai', [
            'flash' => session('flash')
        ]);
    }
        public function getPegawai(Request $request)
    {
        $query = User::query();
    
        // Search
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }
    
        // Filter Divisi
        if ($request->has('divisi') && $request->divisi != '') {
            $query->where('divisi', $request->divisi);
        }
    
        // Filter Jabatan
        if ($request->has('jabatan') && $request->jabatan != '') {
            $query->where('jabatan', $request->jabatan);
        }
    
        // Filter Tower
        if ($request->has('tower') && $request->tower != '') {
            $query->where('tower', $request->tower);
        }
    
        // Paginate dengan 15 item per page
        $users = $query->orderBy('id', 'desc')->paginate(15);
    
        // Get unique values untuk filter dropdowns
        $divisiList = User::select('divisi')
            ->distinct()
            ->whereNotNull('divisi')
            ->where('divisi', '!=', '')
            ->orderBy('divisi')
            ->pluck('divisi');
            
        $jabatanList = User::select('jabatan')
            ->distinct()
            ->whereNotNull('jabatan')
            ->where('jabatan', '!=', '')
            ->orderBy('jabatan')
            ->pluck('jabatan');
    
        // Return JSON response
        return response()->json([
            'users' => [
                'data' => $users->items(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
            'divisiList' => $divisiList,
            'jabatanList' => $jabatanList,
        ], 200);
    }


    public function getUsers()
    {
        $users = User::where('active', 1)
            ->select('id', 'name', 'email', 'divisi', 'jabatan')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($users);
    }

    
   


    public function inputHarian()
    {
        return Inertia::render('Hrd/Absen/Input_Absen', []);
    }

    public function inputTidak()
    {
        $users = User::where('active', 1)
            ->select('id', 'name', 'divisi', 'jabatan')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('Hrd/Absen/Input_tidak', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role' => 'required|string',
            'active' => 'boolean',
            'tmk' => 'required|date',
            'divisi' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'tower' => 'required|string',
            'keterangan' => 'nullable|string',
            'ttd' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        $validated['password'] = Hash::make($validated['password']);

        if ($request->hasFile('ttd')) {
            $file = $request->file('ttd');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            Storage::disk('public')->putFileAs('ttd', $file, $filename);
            $validated['ttd'] = $filename;
        }

        User::create($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:8',
            'role' => 'required|string',
            'active' => 'boolean',
            'tmk' => 'required|date',
            'divisi' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'keterangan' => 'nullable|string',
            'tower' => 'required|string',
            'ttd' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if ($request->hasFile('ttd')) {
            if ($user->ttd) {
                Storage::disk('public')->delete('ttd/' . $user->ttd);
            }
            
            $file = $request->file('ttd');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();            
            Storage::disk('public')->putFileAs('ttd', $file, $filename);
            $validated['ttd'] = $filename;
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'Pegawai berhasil diupdate');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->ttd) {
            Storage::disk('public')->delete('ttd/' . $user->ttd);
        }
        
        $user->delete();

        return redirect()->back()->with('success', 'Pegawai berhasil dihapus');
    }
    public function index()
    {
        return Inertia::render('User/Dashboard', []);
    }
    public function head()
    {
        return Inertia::render('Head/Dashboard', []);
    }
   
    
}
