<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Izin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A5;
            margin: 8mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        /* Header dengan border */
        .header {
            border: 2px solid #000;
            margin-bottom: 15px;
        }
        
        .header-row {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }
        
        .logo-cell {
            display: table-cell;
            width: 90px;
            text-align: center;
            vertical-align: middle;
            border-right: 2px solid #000;
            padding: 12px 8px;
        }
        
        .logo-box {
            text-align: center;
        }
        
        .logo-image {
            max-width: 70px;
            max-height: 70px;
            margin-bottom: 5px;
        }
        
        .logo-text {
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
        }
        
        .header-content {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            padding: 10px;
        }
        
        .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        .document-title {
            font-size: 15px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 10px;
        }
        
        /* Form Fields */
        .form-section {
            margin-bottom: 15px;
            flex-grow: 1;
            padding: 0 5px;
        }
        
        .form-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        
        .form-label {
            display: table-cell;
            width: 140px;
            padding: 4px 0;
            font-size: 12px;
        }
        
        .form-separator {
            display: table-cell;
            width: 15px;
            text-align: center;
        }
        
        .form-value {
            display: table-cell;
            padding: 4px 5px;
            border-bottom: 1px solid #000;
            font-size: 12px;
        }
        .signature-section {
            margin-top: auto;
            display: table;
            width: 100%;
            table-layout: fixed;
            padding-top: 10px;
        }
        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 3px;
        }
        .signature-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-align: center;
        }
        .signature-space {
            height: 85px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .signature-image {
            max-width: 105px;
            max-height: 75px;
            object-fit: contain;
            margin-top: 5px;
        }
        .signature-line {
            position: absolute;
            bottom: 0;
            left: 10%;
            right: 10%;
            border-bottom: 1px solid #000;
        }
        
        .signature-name {
            font-weight: bold;
            font-size: 11px;
            text-align: center;
            line-height: 1.4;
        }
        
        .signature-role {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
            text-align: center;
        }
        /* Catatan Box */
        .catatan-box {
            margin: 10px 5px;
            padding: 8px 10px;
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .catatan-title {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        /* Footer */
        .footer {
            margin-top: 8px;
            text-align: right;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding: 6px 5px 0;
        }
        
        .rejection-text {
            color: #d9534f;
            font-weight: bold;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-row">
                <div class="logo-cell">
                    <div class="logo-box">
                        @if(file_exists(public_path('asset/logo.png')))
                            <img src="{{ public_path('asset/logo.png') }}" alt="Logo" class="logo-image">
                        @endif
                        <div class="logo-text">S.L.G</div>
                    </div>
                </div>
                <div class="header-content">
                    <div class="company-name">SAWIT LESTARI GROUP</div>
                    <div class="document-title">SURAT IZIN / KELUAR KANTOR</div>
                </div>
            </div>
        </div>

        <!-- Form Content -->
        <div class="form-section">
            <div class="form-row">
                <div class="form-label">Nama</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->user->name }}</div>
            </div>
            
            <div class="form-row">
                <div class="form-label">Jabatan</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->user->jabatan ?? '-' }}</div>
            </div>
            
            <div class="form-row">
                <div class="form-label">TMK</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->user->tmk ?? '-' }}</div>
            </div>
            
            <div class="form-row">
                <div class="form-label">Hari / Tanggal</div>
                <div class="form-separator">:</div>
                <div class="form-value">
                    {{ \Carbon\Carbon::parse($perizinan->tanggal)->isoFormat('dddd, D MMMM YYYY') }}
                </div>
            </div>
            
            @if($perizinan->jam_keluar !== '00:00' && $perizinan->jam_kembali !== '00:00')
            <div class="form-row">
                <div class="form-label">Jam Keluar</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->jam_keluar }}</div>
            </div>
            
            <div class="form-row">
                <div class="form-label">Jam Kembali</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->jam_kembali }}</div>
            </div>
            @else
            <div class="form-row">
                <div class="form-label">Jenis Izin</div>
                <div class="form-separator">:</div>
                <div class="form-value">Full Day (Seharian)</div>
            </div>
            @endif
            
            <div class="form-row">
                <div class="form-label">Keperluan</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->keperluan }}</div>
            </div>
            
            <div class="form-row">
                <div class="form-label">Bagian / Divisi</div>
                <div class="form-separator">:</div>
                <div class="form-value">{{ $perizinan->user->divisi ?? '-' }}</div>
            </div>
        </div>

        <!-- Catatan jika ada -->
        @if($perizinan->catatan)
        <div class="catatan-box">
            <div class="catatan-title">Catatan:</div>
            {{ $perizinan->catatan }}
        </div>
        @endif

        <!-- Signature Section -->
        <div class="signature-section">
            <!-- User Yang Mengajukan -->
            <div class="signature-box">
                <div class="signature-title">Diminta oleh :</div>
                <div class="signature-space">
                    @php
                        $userTtdPath = $perizinan->user->ttd ? public_path('storage/ttd/' . basename($perizinan->user->ttd)) : null;
                    @endphp
                    @if($userTtdPath && file_exists($userTtdPath))
                        <img src="{{ $userTtdPath }}" alt="TTD" class="signature-image">
                    @else
                        <img src="{{ public_path('asset/acc.png') }}" alt="TTD" class="signature-image">
                    @endif
                    <div class="signature-line"></div>
                </div>
                <div class="signature-name">
                    ( {{ $perizinan->user->name }} )
                    <div class="signature-role">Yang bersangkutan</div>
                </div>
            </div>
            
            <!-- Head Yang Mengetahui -->
            <div class="signature-box">
                <div class="signature-title">Diketahui oleh :</div>
                <div class="signature-space">
                    @if($perizinan->status_diketahui === 'Disetujui')
                        @php
                            $diketahuiTtdPath = ($perizinan->diketahuiOleh && $perizinan->diketahuiOleh->ttd) 
                                ? public_path('storage/ttd/' . basename($perizinan->diketahuiOleh->ttd)) 
                                : null;
                        @endphp
                        @if($diketahuiTtdPath && file_exists($diketahuiTtdPath))
                            <img src="{{ $diketahuiTtdPath }}" alt="TTD" class="signature-image">
                        @else
                            <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui" class="signature-image">
                        @endif
                    @elseif($perizinan->status_diketahui === 'Ditolak')
                        <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak" class="signature-image">
                    @endif
                    <div class="signature-line"></div>
                </div>
                <div class="signature-name">
                    ( {{ $perizinan->diketahuiOleh->name ?? '________________' }} )
                    <div class="signature-role">{{ $perizinan->diketahuiOleh->jabatan ?? 'Atasan' }}</div>
                </div>
            </div>
            
            <!-- HRD Yang Menyetujui -->
            <div class="signature-box">
                <div class="signature-title">Disetujui oleh :</div>
                <div class="signature-space">
                    @if($perizinan->status_disetujui === 'Disetujui')
                        @php
                            $disetujuiTtdPath = ($perizinan->disetujuiOleh && $perizinan->disetujuiOleh->ttd) 
                                ? public_path('storage/ttd/' . basename($perizinan->disetujuiOleh->ttd)) 
                                : null;
                        @endphp
                        @if($disetujuiTtdPath && file_exists($disetujuiTtdPath))
                            <img src="{{ $disetujuiTtdPath }}" alt="TTD" class="signature-image">
                        @else
                            <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui" class="signature-image">
                        @endif
                    @elseif($perizinan->status_disetujui === 'Ditolak')
                        <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak" class="signature-image">
                    @endif
                    <div class="signature-line"></div>
                </div>
                <div class="signature-name">
                    ( {{ $perizinan->disetujuiOleh->name ?? '________________' }} )
                    <div class="signature-role">HRD</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>Dicetak pada: {{ $tanggal_print }}</div>
        </div>
    </div>
</body>
</html>