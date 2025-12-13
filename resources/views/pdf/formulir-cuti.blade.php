<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Formulir Permohonan Cuti</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            margin: 20px;
            line-height: 1.4;
        }
        .header { 
            display: table;
            width: 100%;
            margin-bottom: 15px;
            border-bottom: 3px solid #8B4513;
            padding-bottom: 8px;
        }
        .logo {
            display: table-cell;
            width: 80px;
            vertical-align: middle;
        }
        .logo img {
            width: 70px;
            height: auto;
        }
        .company-info {
            display: table-cell;
            vertical-align: middle;
            padding-left: 10px;
        }
        .company-name { 
            font-weight: bold; 
            font-size: 15px;
            color: #000;
        }
        .company-address {
            font-size: 9px;
            margin-top: 2px;
            color: #555;
        }
        .title { 
            font-weight: bold; 
            font-size: 13px; 
            margin: 20px 0; 
            text-align: center;
            text-decoration: underline;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 12px;
        }
        .info-table td { 
            padding: 3px 8px; 
            vertical-align: top;
            font-size: 11px;
        }
        .info-table td:first-child { 
            width: 35%; 
        }
        .highlight {
            background-color: #fff3cd;
            padding: 2px 5px;
            border-radius: 3px;
            font-weight: bold;
        }
        .alasan-box {
            padding: 10px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            margin-top: 5px;
            min-height: 40px;
            line-height: 1.5;
        }
        .catatan-box {
            padding: 10px;
            border: 1px solid #ddd;
            background-color: #fffef0;
            margin-top: 5px;
            min-height: 40px;
            line-height: 1.5;
        }
        
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-row {
            display: table;
            width: 100%;
        }
        .signature-col {
            display: table-cell;
            text-align: center;
            padding: 8px;
            vertical-align: top;
            width: 25%; /* Ubah dari 33.33% menjadi 25% untuk 4 kolom */
        }
        .signature-title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 5px;
        }
        .signature-box {
            height: 60px;
            margin: 5px 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-box img {
            max-height: 55px;
            max-width: 90px;
        }
        .signature-name {
            font-size: 10px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin: 5px auto 0;
            display: inline-block;
            min-width: 100px;
        }
        .signature-date {
            font-size: 9px;
            color: #666;
            margin-top: 3px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            margin-top: 5px;
        }
        .status-disetujui {
            background-color: #4CAF50;
            color: white;
        }
        .status-ditolak {
            background-color: #f44336;
            color: white;
        }

    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="{{ public_path('asset/logo.png') }}" alt="Logo">
        </div>
        <div class="company-info">
            <div class="company-name">Sawit Lestari Group</div>
            <div class="company-address">Pantai Indah Kapuk St, RT.6/RW.2, Kamal Muara, Penjaringan, North Jakarta City, Jakarta 14470</div>
        </div>
    </div>

    <div class="title">FORMULIR PERMOHONAN CUTI</div>

    <table class="info-table" style="margin-bottom: 0px;">
        <tr>
            <td>Nama</td>
            <td>: {{ $user->name }}</td>
        </tr>
        <tr>
            <td>Golongan/Jabatan</td>
            <td>: {{ $user->jabatan ?? '-' }}</td>
        </tr>
        <tr>
            <td>ID</td>
            <td>: {{ $user->id ?? '-' }}</td>
        </tr>
        <tr>
            <td>Bagian</td>
            <td>: {{ $user->divisi ?? '-' }}</td>
        </tr>
        <tr>
            <td>TMK</td>
            <td>: {{ $user->tmk ? \Carbon\Carbon::parse($user->tmk)->format('d-m-Y') : '-' }}</td>
        </tr>
        <tr>
            <td>Tahun Ke</td>
            <td>: {{ $jatahCuti->tahun_ke ?? '-' }}</td>
        </tr>
    </table>

    <table class="info-table" style="margin-bottom: 0px;">
        <tr>
            <td style="width: 35%;">Keterangan Cuti</td>
            <td>
                <table style="margin: 0; width: 100%;">
                    <tr>
                        <td style="padding: 2px 10px 2px 0; width: 200px;">Periode Cuti</td>
                        <td style="padding: 2px;">: Tahun {{ $jatahCuti->tahun }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 10px 2px 0;">Jumlah Hak Cuti</td>
                        <td style="padding: 2px;">: {{ $jatahCuti->jumlah_cuti + ($jatahCuti->pinjam_tahun_next ?? 0) + ($jatahCuti->gabung_tahun_lalu ?? 0) }} hari</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 10px 2px 0;">Cuti Diambil</td>
                        <td style="padding: 2px;">: {{ number_format($jatahCuti->cuti_dipakai ?? 0, 2) }} hari</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 10px 2px 0;">Sisa Hak Cuti</td>
                        <td style="padding: 2px;">: <strong>{{ number_format($jatahCuti->sisa_cuti ?? 0, 2) }} hari</strong></td>
                    </tr>
                </table>
            </td>
        </tr>
        @if($riwayatCuti->count() > 0)
        <tr>
            <td style="vertical-align: top;"></td>
            <td>
                <div style="font-weight: bold; font-size: 10px; margin: 12px 0 5px 0;">Rincian Pengambilan Cuti:</div>
                @foreach($riwayatCuti as $riwayat)
                <div style="margin-left: 10px; margin-bottom: 4px; font-size: 10px;">
                    • {{ number_format($riwayat->jumlah_hari, 2) }} hari 
                    ({{ \Carbon\Carbon::parse($riwayat->tanggal_mulai)->format('d F Y') }} s/d 
                    {{ \Carbon\Carbon::parse($riwayat->tanggal_selesai)->format('d F Y') }})
                    @if($riwayat->id == $pemakaianCuti->id)
                        <span class="highlight" style="color: #2196F3;">-- Permohonan Ini</span>
                    @endif
                </div>
                @endforeach
            </td>
        </tr>
        @endif
    </table>

    <table class="info-table" style="margin-top: 20px; margin-bottom: 15px;">
        <tr>
            <td style="width: 35%; vertical-align: top; padding-top: 10px; font-weight: bold; font-size: 11px;">Alasan Pengajuan Cuti</td>
            <td></td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="alasan-box">{{ $pemakaianCuti->alasan ?? '-' }}</div>
            </td>
        </tr>
    </table>

    @if($pemakaianCuti->catatan)
    <table class="info-table" style="margin-top: 15px; margin-bottom: 15px;">
        <tr>
            <td style="width: 35%; vertical-align: top; padding-top: 10px; font-weight: bold; font-size: 11px;">Catatan dari Pimpinan</td>
            <td></td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="catatan-box">{{ $pemakaianCuti->catatan }}</div>
            </td>
        </tr>
    </table>
    @endif

    <div class="signature-section">
    <div class="signature-row">
        <!-- 1. Pemohon -->
        <div class="signature-col">
            <div class="signature-title">Pemohon</div>
            <div class="signature-box">
                @if($user->ttd && file_exists(public_path('storage/ttd/' . $user->ttd)))
                    <img src="{{ public_path('storage/ttd/' . $user->ttd) }}" alt="TTD">
                @endif
            </div>
            <div class="signature-name">{{ $user->name }}</div>
            <div class="signature-date">{{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_pengajuan)->format('d/m/Y') }}</div>
        </div>

        <!-- 2. Diketahui Atasan -->
        @if($pemakaianCuti->diketahui_atasan)
        <div class="signature-col">
            <div class="signature-title">Diketahui Atasan</div>
            <div class="signature-box">
                @if($pemakaianCuti->status_diketahui_atasan == 'disetujui')
                    @if($pemakaianCuti->diketahuiAtasanUser && $pemakaianCuti->diketahuiAtasanUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->diketahuiAtasanUser->ttd)))
                        <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->diketahuiAtasanUser->ttd) }}" alt="TTD">
                    @else
                        <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui">
                    @endif
                @elseif($pemakaianCuti->status_diketahui_atasan == 'ditolak')
                    <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak">
                @endif
            </div>
            <div class="signature-name">{{ $pemakaianCuti->diketahuiAtasanUser->name ?? 'Atasan' }}</div>
            <div class="signature-date">
                @if($pemakaianCuti->tanggal_diketahui_atasan)
                    {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_diketahui_atasan)->format('d/m/Y') }}
                @endif
            </div>
            @if($pemakaianCuti->status_diketahui_atasan)
                <div class="status-badge status-{{ $pemakaianCuti->status_diketahui_atasan }}">
                    {{ strtoupper($pemakaianCuti->status_diketahui_atasan) }}
                </div>
            @endif
        </div>
        @endif

        <!-- 3. Diketahui HRD (YANG HILANG INI) -->
        @if($pemakaianCuti->diketahui_hrd)
        <div class="signature-col">
            <div class="signature-title">Diketahui HRD</div>
            <div class="signature-box">
                @if($pemakaianCuti->status_diketahui_hrd == 'disetujui')
                    @if($pemakaianCuti->diketahuiHrdUser && $pemakaianCuti->diketahuiHrdUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->diketahuiHrdUser->ttd)))
                        <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->diketahuiHrdUser->ttd) }}" alt="TTD">
                    @else
                        <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui">
                    @endif
                @elseif($pemakaianCuti->status_diketahui_hrd == 'ditolak')
                    <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak">
                @endif
            </div>
            <div class="signature-name">{{ $pemakaianCuti->diketahuiHrdUser->name ?? 'HRD' }}</div>
            <div class="signature-date">
                @if($pemakaianCuti->tanggal_diketahui_hrd)
                    {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_diketahui_hrd)->format('d/m/Y') }}
                @endif
            </div>
            @if($pemakaianCuti->status_diketahui_hrd)
                <div class="status-badge status-{{ $pemakaianCuti->status_diketahui_hrd }}">
                    {{ strtoupper($pemakaianCuti->status_diketahui_hrd) }}
                </div>
            @endif
        </div>
        @endif

        <!-- 4. Disetujui Pimpinan -->
        @if($pemakaianCuti->disetujui)
        <div class="signature-col">
            <div class="signature-title">Disetujui Oleh</div>
            <div class="signature-box">
                @if($pemakaianCuti->status_disetujui == 'disetujui')
                    @if($pemakaianCuti->disetujuiUser && $pemakaianCuti->disetujuiUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->disetujuiUser->ttd)))
                        <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->disetujuiUser->ttd) }}" alt="TTD">
                    @else
                        <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui">
                    @endif
                @elseif($pemakaianCuti->status_disetujui == 'ditolak')
                    <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak">
                @endif
            </div>
            <div class="signature-name">{{ $pemakaianCuti->disetujuiUser->name ?? 'Direktur' }}</div>
            <div class="signature-date">
                @if($pemakaianCuti->tanggal_disetujui)
                    {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_disetujui)->format('d/m/Y') }}
                @endif
            </div>
            @if($pemakaianCuti->status_disetujui)
                <div class="status-badge status-{{ $pemakaianCuti->status_disetujui }}">
                    {{ strtoupper($pemakaianCuti->status_disetujui) }}
                </div>
            @endif
        </div>
        @endif
    </div>
</div>

</body>
</html>