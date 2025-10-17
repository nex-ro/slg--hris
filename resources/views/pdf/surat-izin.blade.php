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
        
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.3;
        }
        
        .container {
            width: 100%;
            padding: 12px;
        }
        
        .header {
            border: 2px solid #000;
            padding: 6px;
            margin-bottom: 12px;
        }
        
        .header-top {
            display: table;
            width: 100%;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 5px;
        }
        
        .logo {
            display: table-cell;
            width: 60px;
            vertical-align: middle;
            text-align: center;
            padding: 3px;
            border-right: 1px solid #000;
        }
        
        .logo img {
            max-width: 50px;
            max-height: 50px;
        }
        
        .logo-text {
            font-size: 9px;
            font-weight: bold;
            line-height: 1.2;
        }
        
        .company-info {
            display: table-cell;
            vertical-align: middle;
            padding-left: 10px;
        }
        
        .company-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .document-title {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            padding: 4px 0;
        }
        
        .form-section {
            margin-bottom: 10px;
        }
        
        .form-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }
        
        .form-label {
            display: table-cell;
            width: 90px;
            padding: 3px 0;
            font-weight: bold;
            font-size: 8px;
        }
        
        .form-separator {
            display: table-cell;
            width: 15px;
            text-align: center;
        }
        
        .form-value {
            display: table-cell;
            padding: 3px 0;
            border-bottom: 1px solid #000;
            font-size: 8px;
        }
        
        .signature-section {
            margin-top: 15px;
            display: table;
            width: 100%;
        }
        
        .signature-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            padding: 0 5px;
        }
        
        .signature-title {
            font-weight: bold;
            margin-bottom: 3px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            font-size: 8px;
        }
        
        .signature-space {
            height: 40px;
            margin: 5px 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .signature-image {
            max-width: 60px;
            max-height: 35px;
            margin: 3px auto;
        }
        
        .signature-name {
            font-weight: bold;
            margin-top: 3px;
            border-top: 1px solid #000;
            padding-top: 2px;
            font-size: 7px;
            line-height: 1.3;
        }
        
        .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 7px;
            color: #666;
        }
        
        .status-badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 7px;
            margin-top: 2px;
        }
        
        .status-disetujui {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-ditolak {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .status-diajukan {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .catatan-box {
            margin-top: 10px;
            padding: 5px;
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 3px;
            font-size: 7px;
        }
        
        small {
            font-size: 6px;
        }
        
        .no-signature {
            font-size: 20px;
            font-weight: bold;
            color: #666;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-top">
                <div class="logo">
                    @if(file_exists(public_path('asset/logo.png')))
                        <img src="{{ public_path('asset/logo.png') }}" alt="Logo">
                    @else
                        <div class="logo-text">S.L.G</div>
                    @endif
                </div>
                <div class="company-info">
                    <div class="company-name">SAWIT LESTARI GROUP</div>
                </div>
            </div>
            <div class="document-title">
                SURAT DIN / KELUAR KANTOR
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

        <!-- Signature Section -->
        <div class="signature-section">
            <!-- User Yang Mengajukan -->
            <div class="signature-box">
                <div class="signature-title">Diminta oleh :</div>
                <div class="signature-space">
                    @if($perizinan->status === 'Disetujui')
                        @if($perizinan->user->ttd && file_exists(public_path('storage/' . $perizinan->user->ttd)))
                            <img src="{{ public_path('storage/' . $perizinan->user->ttd) }}" 
                                 alt="TTD User" 
                                 class="signature-image">
                        @else
                            <div class="no-signature">( n )</div>
                        @endif
                    @else
                        <div style="margin-top: 12px; font-style: italic; color: #666; font-size: 7px;">
                            (Menunggu Persetujuan)
                        </div>
                    @endif
                </div>
                <div class="signature-name">
                    {{ $perizinan->user->name }}
                    <br>
                    <small>Yang bersangkutan</small>
                </div>
            </div>
            
            <!-- Head Yang Mengetahui -->
            <div class="signature-box">
                <div class="signature-title">Diketahui oleh :</div>
                <div class="signature-space">
                    @if($perizinan->status_diketahui === 'Disetujui')
                        @if($perizinan->diketahuiOleh && $perizinan->diketahuiOleh->ttd && file_exists(public_path('storage/' . $perizinan->diketahuiOleh->ttd)))
                            <img src="{{ public_path('storage/' . $perizinan->diketahuiOleh->ttd) }}" 
                                 alt="TTD Head" 
                                 class="signature-image">
                        @else
                            <div class="no-signature">( n )</div>
                        @endif
                    @elseif($perizinan->status_diketahui === 'Ditolak')
                        <div style="color: red; margin-top: 10px; font-weight: bold; font-size: 8px;">DITOLAK</div>
                    @else
                        <div style="margin-top: 12px; font-style: italic; color: #666; font-size: 7px;">
                            (Menunggu)
                        </div>
                    @endif
                </div>
                <div class="signature-name">
                    {{ $perizinan->diketahuiOleh->name ?? '-' }}
                    <br>
                    <small>{{ $perizinan->diketahuiOleh->jabatan ?? 'Atasan' }}</small>
                    @if($perizinan->status_diketahui)
                        <br>
                        <span class="status-badge status-{{ strtolower($perizinan->status_diketahui) }}">
                            {{ $perizinan->status_diketahui }}
                        </span>
                    @endif
                </div>
            </div>
            
            <!-- HRD Yang Menyetujui -->
            <div class="signature-box">
                <div class="signature-title">Disetujui oleh :</div>
                <div class="signature-space">
                    @if($perizinan->status_disetujui === 'Disetujui')
                        @if($perizinan->disetujuiOleh && $perizinan->disetujuiOleh->ttd && file_exists(public_path('storage/' . $perizinan->disetujuiOleh->ttd)))
                            <img src="{{ public_path('storage/' . $perizinan->disetujuiOleh->ttd) }}" 
                                 alt="TTD HRD" 
                                 class="signature-image">
                        @else
                            <div class="no-signature">( n )</div>
                        @endif
                    @elseif($perizinan->status_disetujui === 'Ditolak')
                        <div style="color: red; margin-top: 10px; font-weight: bold; font-size: 8px;">DITOLAK</div>
                    @else
                        <div style="margin-top: 12px; font-style: italic; color: #666; font-size: 7px;">
                            (Menunggu)
                        </div>
                    @endif
                </div>
                <div class="signature-name">
                    {{ $perizinan->disetujuiOleh->name ?? '-' }}
                    <br>
                    <small>HRD</small>
                    @if($perizinan->status_disetujui)
                        <br>
                        <span class="status-badge status-{{ strtolower($perizinan->status_disetujui) }}">
                            {{ $perizinan->status_disetujui }}
                        </span>
                    @endif
                </div>
            </div>
        </div>

        @if($perizinan->catatan)
        <div class="">
            <strong>Catatan:</strong><br>
            {{ $perizinan->catatan }}
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Dicetak pada: {{ $tanggal_print }}</p>
            <p>No. {{ str_pad($perizinan->id, 5, '0', STR_PAD_LEFT) }}/SLG/{{ date('Y') }}</p>
        </div>
    </div>
</body>
</html>