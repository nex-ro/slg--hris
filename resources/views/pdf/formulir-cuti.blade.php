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
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
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
            font-size: 16px;
            color: #000;
        }
        .company-address {
            font-size: 9px;
            margin-top: 2px;
        }
        .title { 
            font-weight: bold; 
            font-size: 12px; 
            margin: 15px 0 20px 0; 
            text-align: center;
            text-decoration: underline;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px; 
        }
        .info-table td { 
            padding: 3px 5px; 
            vertical-align: top;
            font-size: 11px;
        }
        .info-table td:first-child { 
            width: 30%; 
        }
        .section-title { 
            font-weight: bold; 
            padding: 3px 0; 
            margin: 12px 0 5px 0;
            font-size: 11px;
            background-color: #f0f0f0;
            padding: 5px 8px;
            border-left: 3px solid #333;
        }
        .cuti-item {
            margin-left: 20px;
            margin-bottom: 3px;
            font-size: 10px;
        }
        .signature-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }
        .signature-row {
            display: table;
            width: 100%;
        }
        .signature-col {
            display: table-cell;
            text-align: center;
            padding: 5px;
            vertical-align: top;
        }
        .signature-title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 5px;
        }
        .signature-box {
            height: 70px;
            margin: 5px 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .signature-box img {
            max-height: 60px;
            max-width: 100px;
        }
        .signature-name {
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 5px;
            display: inline-block;
            min-width: 100px;
        }
        .note { 
            font-style: italic; 
            font-size: 9px; 
            margin-top: 20px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        .reason-box {
            padding: 10px;
            min-height: 50px;
            border: 1px solid #ddd;
            margin-top: 5px;
            background-color: #f9f9f9;
        }
        .catatan-box {
            padding: 10px;
            border: 1px solid #ddd;
            margin-top: 5px;
            background-color: #fffef0;
            min-height: 40px;
        }
        .highlight-box {
            background-color: #e8f4f8;
            border: 2px solid #2196F3;
            padding: 12px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .highlight-box table td {
            padding: 5px;
            font-weight: bold;
            font-size: 11px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }
        .status-disetujui {
            background-color: #4CAF50;
            color: white;
        }
        .status-ditolak {
            background-color: #f44336;
            color: white;
        }
        .status-diproses {
            background-color: #ff9800;
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
            <div class="company-name">PT. Bengkulu Sawit Lestari</div>
            <div class="company-address">Jl. Raya Manna - Bintuhan, Air Sulau, Kedurang ilir, Kab. Bengkulu Selatan, Bengkulu, 38556</div>
        </div>
    </div>

    <div class="title">FORMULIR PERMOHONAN CUTI</div>

    <!-- INFORMASI PERMOHONAN CUTI - HIGHLIGHT -->
    <div class="highlight-box">
        <table>
            <tr>
                <td style="width: 30%;">Tanggal Pengajuan</td>
                <td>: {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_pengajuan)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td>Periode Cuti</td>
                <td>: {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_mulai)->format('d F Y') }} 
                    s/d {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_selesai)->format('d F Y') }}</td>
            </tr>
            <tr>
                <td>Lama Cuti</td>
                <td>: {{ $pemakaianCuti->jumlah_hari }} hari
                    @if($pemakaianCuti->cuti_setengah_hari)
                        <span style="color: #f57c00;">(Setengah Hari)</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td>Status</td>
                <td>: 
                    @if($pemakaianCuti->status_final == 'disetujui')
                        <span class="status-badge status-disetujui">DISETUJUI</span>
                    @elseif($pemakaianCuti->status_final == 'ditolak')
                        <span class="status-badge status-ditolak">DITOLAK</span>
                    @else
                        <span class="status-badge status-diproses">DIPROSES</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="section-title">Data Pemohon</div>
    <table class="info-table">
        <tr>
            <td>Nama</td>
            <td>: {{ $user->name }}</td>
        </tr>
        <tr>
            <td>Golongan/Jabatan</td>
            <td>: {{ $user->jabatan ?? '-' }}</td>
        </tr>
        <tr>
            <td>Bagian/Divisi</td>
            <td>: {{ $user->divisi ?? '-' }}</td>
        </tr>
        <tr>
            <td>TMK (Tanggal Masuk Kerja)</td>
            <td>: {{ $user->tmk ? \Carbon\Carbon::parse($user->tmk)->format('d F Y') : '-' }}</td>
        </tr>
        
    </table>

    @if($pemakaianCuti->id_penerima_tugas)
    <div class="section-title">Pendelegasian Tugas</div>
    <table class="info-table">
        <tr>
            <td>Penerima Tugas</td>
            <td>: {{ $pemakaianCuti->penerimaTugas->name ?? '-' }}</td>
        </tr>
        @if($pemakaianCuti->tugas)
        <tr>
            <td>Deskripsi Tugas</td>
            <td>: {{ $pemakaianCuti->tugas }}</td>
        </tr>
        @endif
    </table>
    @endif

    <div class="section-title">Saldo Cuti (Tahun {{ $jatahCuti->tahun }})</div>
    <table class="info-table">
        <tr>
            <td>Jumlah Hak Cuti</td>
            <td>: {{ $jatahCuti->jumlah_cuti }} hari</td>
        </tr>
        <tr>
            <td>Pinjam Cuti Tahun {{ $jatahCuti->tahun + 1 }}</td>
            <td>: {{ $jatahCuti->pinjam_tahun_next ?? 0 }} hari</td>
        </tr>
        <tr>
            <td>Hak Cuti Digabung dari Tahun {{ $jatahCuti->tahun - 1 }}</td>
            <td>: {{ $jatahCuti->gabung_tahun_lalu ?? 0 }} hari</td>
        </tr>
        <tr>
            <td>Cuti Bersama</td>
            <td>: {{ $jatahCuti->cuti_bersama ?? 0 }} hari</td>
        </tr>
        <tr>
            <td>Cuti Diambil</td>
            <td>: {{ $jatahCuti->cuti_diambil ?? 0 }} hari</td>
        </tr>
    </table>

    @if($riwayatCuti->count() > 0)
    <div style="margin-left: 30px; margin-bottom: 10px;">
        <div style="font-weight: bold; font-size: 10px; margin-bottom: 5px;">Rincian Pengambilan Cuti:</div>
        @foreach($riwayatCuti as $riwayat)
        <div class="cuti-item">
            • {{ $riwayat->jumlah_hari }} hari 
            ({{ \Carbon\Carbon::parse($riwayat->tanggal_mulai)->format('d F Y') }} s/d 
            {{ \Carbon\Carbon::parse($riwayat->tanggal_selesai)->format('d F Y') }})
            @if($riwayat->id == $pemakaianCuti->id)
                <strong style="color: #2196F3;">← Permohonan Ini</strong>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    <table class="info-table">
        <tr>
            <td><strong>Sisa Hak Cuti</strong></td>
            <td>: <strong>{{ $jatahCuti->sisa_cuti }} hari</strong></td>
        </tr>
    </table>

    <div class="section-title">Alasan Pengajuan Cuti</div>
    <div class="reason-box">{{ $pemakaianCuti->alasan ?? '-' }}</div>

    @if($pemakaianCuti->keluarga)
    <div class="section-title">Keterangan Keluarga</div>
    <table class="info-table">
        <tr>
            <td colspan="2">{{ $pemakaianCuti->keluarga }}</td>
        </tr>
    </table>
    @endif

    <div class="signature-section">
        <div class="signature-row">
            <!-- Pemohon - Selalu ada -->
            <div class="signature-col">
                <div class="signature-title">Pemohon</div>
                <div class="signature-box">
                    @if($user->ttd)
                        @if(file_exists(public_path('storage/ttd/' . $user->ttd)))
                            <img src="{{ public_path('storage/ttd/' . $user->ttd) }}" alt="TTD Pemohon">
                        @endif
                    @endif
                </div>
                <div class="signature-name">{{ $user->name }}</div>
                <div style="font-size: 9px; color: #666; margin-top: 3px;">
                    {{ \Carbon\Carbon::parse($pemakaianCuti->tanggal_pengajuan)->format('d/m/Y') }}
                </div>
            </div>

            <!-- Diketahui Atasan -->
            @if($pemakaianCuti->diketahui_atasan)
            <div class="signature-col">
                <div class="signature-title">Diketahui Atasan</div>
                <div class="signature-box">
                    @if($pemakaianCuti->status_diketahui_atasan == 'disetujui')
                        @if($pemakaianCuti->diketahuiAtasanUser && $pemakaianCuti->diketahuiAtasanUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->diketahuiAtasanUser->ttd)))
                            <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->diketahuiAtasanUser->ttd) }}" alt="TTD Atasan">
                        @else
                            <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui" style="max-height: 60px;">
                        @endif
                    @elseif($pemakaianCuti->status_diketahui_atasan == 'ditolak')
                        <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak" style="max-height: 60px;">
                    @endif
                </div>
                <div class="signature-name">
                    {{ $pemakaianCuti->diketahuiAtasanUser->name ?? 'Atasan' }}
                </div>
                @if($pemakaianCuti->status_diketahui_atasan)
                <div style="font-size: 9px; margin-top: 3px;">
                    <span class="status-badge status-{{ $pemakaianCuti->status_diketahui_atasan }}">
                        {{ strtoupper($pemakaianCuti->status_diketahui_atasan) }}
                    </span>
                </div>
                @endif
            </div>
            @endif

            <!-- Diketahui HRD -->
            @if($pemakaianCuti->diketahui_hrd)
            <div class="signature-col">
                <div class="signature-title">Diketahui HRD</div>
                <div class="signature-box">
                    @if($pemakaianCuti->status_diketahui_hrd == 'disetujui')
                        @if($pemakaianCuti->diketahuiHrdUser && $pemakaianCuti->diketahuiHrdUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->diketahuiHrdUser->ttd)))
                            <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->diketahuiHrdUser->ttd) }}" alt="TTD HRD">
                        @else
                            <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui" style="max-height: 60px;">
                        @endif
                    @elseif($pemakaianCuti->status_diketahui_hrd == 'ditolak')
                        <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak" style="max-height: 60px;">
                    @endif
                </div>
                <div class="signature-name">
                    {{ $pemakaianCuti->diketahuiHrdUser->name ?? 'HRD' }}
                </div>
                @if($pemakaianCuti->status_diketahui_hrd)
                <div style="font-size: 9px; margin-top: 3px;">
                    <span class="status-badge status-{{ $pemakaianCuti->status_diketahui_hrd }}">
                        {{ strtoupper($pemakaianCuti->status_diketahui_hrd) }}
                    </span>
                </div>
                @endif
            </div>
            @endif

            <!-- Disetujui Direktur -->
            @if($pemakaianCuti->disetujui)
            <div class="signature-col">
                <div class="signature-title">Disetujui Direktur</div>
                <div class="signature-box">
                    @if($pemakaianCuti->status_disetujui == 'disetujui')
                        @if($pemakaianCuti->disetujuiUser && $pemakaianCuti->disetujuiUser->ttd && file_exists(public_path('storage/ttd/' . $pemakaianCuti->disetujuiUser->ttd)))
                            <img src="{{ public_path('storage/ttd/' . $pemakaianCuti->disetujuiUser->ttd) }}" alt="TTD Direktur">
                        @else
                            <img src="{{ public_path('asset/acc.png') }}" alt="Disetujui" style="max-height: 60px;">
                        @endif
                    @elseif($pemakaianCuti->status_disetujui == 'ditolak')
                        <img src="{{ public_path('asset/rejected.png') }}" alt="Ditolak" style="max-height: 60px;">
                    @endif
                </div>
                <div class="signature-name">
                    {{ $pemakaianCuti->disetujuiUser->name ?? 'Direktur' }}
                </div>
                @if($pemakaianCuti->status_disetujui)
                <div style="font-size: 9px; margin-top: 3px;">
                    <span class="status-badge status-{{ $pemakaianCuti->status_disetujui }}">
                        {{ strtoupper($pemakaianCuti->status_disetujui) }}
                    </span>
                </div>
                @endif
            </div>
            @endif
        </div>
    </div>

    @if($pemakaianCuti->catatan)
    <div class="section-title">Catatan dari Pimpinan</div>
    <div class="catatan-box">
        {{ $pemakaianCuti->catatan }}
    </div>
    @endif

    <div class="note">
        <strong>Catatan:</strong> Permohonan Cuti dianjurkan diajukan minimal 2 (dua) minggu sebelum tanggal cuti dimulai.
    </div>
</body>
</html>