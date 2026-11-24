<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Perjalanan Dinas - {{ $surat->nomor_surat }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @page {
            size: A4 portrait;
            margin: 10mm 0 18mm 0; /* kiri-kanan diatur di .page-container */
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.25;
            background: #fff;
        }

        .page-container {
            width: auto;
            position: relative;
            margin-left: 15mm;
            margin-right: 15mm;
        }

        /* ---------- Header ---------- */
        .header-logo {
            text-align: center;
            margin-bottom: 8px;
        }
        .header-logo img {
            height: 48px;
            width: auto;
        }
        .header-logo .slg-text {
            font-size: 15pt;
            font-weight: bold;
            letter-spacing: 4px;
            color: #1b7a42;
            margin-top: 2px;
        }

        /* ---------- Title ---------- */
        .title-container {
            text-align: center;
            margin-bottom: 16px;
        }
        .title-container h1 {
            font-size: 11pt;
            font-weight: bold;
            text-decoration: underline;
        }
        .title-container .subtitle {
            font-size: 11pt;
            font-style: normal;
        }
        .title-container .doc-number {
            font-size: 10pt;
            margin-top: 1px;
        }

        /* ---------- Form atribut ---------- */
        .form-table {
            width: 176mm;
            margin-left: 4mm;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .form-table td {
            vertical-align: top;
            padding: 0 0 9px 0;
            font-size: 10pt;
        }
        .form-table .label-col {
            width: 40mm;
        }
        .form-table .label-main {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
        }
        .form-table .label-sub {
            font-style: italic;
            padding-top: 2px;
        }
        .form-table .colon-col {
            width: 7mm;
            text-align: center;
            font-weight: bold;
        }
        .form-table .value-col {
            padding-left: 2mm;
        }

        /* ---------- Tabel utama (keberangkatan + tanda tangan) ---------- */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
        }
        .main-table td {
            border: 1px solid #000;
            vertical-align: top;
            font-size: 9pt;
            padding: 4px 6px;
        }
        .main-table .section-cell {
            height: 20mm;
        }
        .main-table .line {
            margin-bottom: 8px;
        }
        .main-table .sig-head {
            text-align: center;
            padding: 3px 6px;
        }
        .main-table .sig-name {
            height: 26mm;
            vertical-align: bottom;
            text-align: center;
            text-decoration: underline;
        }
        .main-table .sig-role {
            text-align: center;
            font-size: 9pt;
            line-height: 1.15;
        }

        /* ---------- Catatan ---------- */
        .note-text {
            font-size: 7.5pt;
            margin-top: 4px;
            margin-bottom: 8px;
        }

        /* ---------- Tabel transfer ---------- */
        .transfer-table {
            border-collapse: collapse;
            border: 1px solid #000;
            width: 86mm;
            margin-left: 4mm;
        }
        .transfer-table th,
        .transfer-table td {
            border: 1px solid #000;
            padding: 1px 5px;
            font-size: 8.5pt;
            font-weight: normal;
            text-align: left;
            color: #333;
        }

        /* ---------- Footer ---------- */
        .footer-address {
            position: fixed;
            bottom: -5mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: #1b7a42;
        }
        .doc-code-right {
            position: absolute;
            right: 0;
            bottom: 0;
            font-size: 7.5pt;
            color: #555;
            text-align: right;
        }
    </style>
</head>
<body>

    @php
        $isHead = strtolower(trim($surat->jabatan ?? '')) === 'head';
        $tanggalBerangkatFormatted = $surat->tanggal_berangkat ? \Carbon\Carbon::parse($surat->tanggal_berangkat)->translatedFormat('d F Y') : '-';

        if ($surat->keterangan_kembali === 'Selesai' || !$surat->tanggal_kembali) {
            $tanggalKembaliFormatted = 'Selesai';
        } else {
            $tanggalKembaliFormatted = \Carbon\Carbon::parse($surat->tanggal_kembali)->translatedFormat('d F Y');
        }

        $panjarDinasFormatted = ($surat->ajukan_advance && $surat->panjar_nominal && $surat->panjar_nominal !== '-')
            ? 'Rp ' . $surat->panjar_nominal . ' (' . $surat->panjar_terbilang . ')'
            : '-';

        $logoPath = public_path('asset/logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }
    @endphp

    <div class="page-container">

        {{-- Header Logo --}}
        <div class="header-logo">
            @if($logoBase64)
                <img src="{{ $logoBase64 }}" alt="Logo SLG"><br>
            @endif
            <div class="slg-text">S . L . G</div>
        </div>

        {{-- Title & Number --}}
        <div class="title-container">
            <h1>Surat Perjalanan Dinas</h1>
            <div class="subtitle">Official Travel Letter</div>
            <div class="doc-number">No. {{ $surat->nomor_surat ?: '__/SPD-HRD/HO/__/2025' }}</div>
        </div>

        {{-- Form atribut --}}
        <table class="form-table">
            <tr>
                <td class="label-col">
                    <div class="label-main">Diberikan Kepada</div>
                    <div class="label-sub">Given to</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col"></td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Nama</div>
                    <div class="label-sub">Name</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col"><strong>{{ $surat->nama_lengkap }}</strong></td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Jabatan</div>
                    <div class="label-sub">Position</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">{{ $surat->jabatan ?: 'Staff' }}</td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Tanggal Berangkat</div>
                    <div class="label-sub">Departure Date</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">{{ $tanggalBerangkatFormatted }}</td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Tanggal Kembali</div>
                    <div class="label-sub">Return Date</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">{{ $tanggalKembaliFormatted }}</td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Keperluan</div>
                    <div class="label-sub">Duty Purposes</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">
                    {{ $surat->keperluan }}
                    @if($surat->tujuan)
                        <br><span style="font-size: 8.5pt; color: #333;">(Tujuan: {{ $surat->tujuan }})</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Transportasi</div>
                    <div class="label-sub">Transportation</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">{{ $surat->transportasi }}</td>
            </tr>
            <tr>
                <td class="label-col">
                    <div class="label-main">Panjar Dinas</div>
                    <div class="label-sub">Cash Advance</div>
                </td>
                <td class="colon-col">:</td>
                <td class="value-col">{{ $panjarDinasFormatted }}</td>
            </tr>
        </table>

        {{-- Tabel utama: Berangkat/Tiba + Mengetahui + Catatan + Tanda Tangan --}}
        <table class="main-table">
            {{-- Keberangkatan --}}
            <tr>
                <td class="section-cell" style="width: 25%;">
                    <div class="line">Tanggal Berangkat</div>
                    <div class="line">Jam berangkat</div>
                </td>
                <td class="section-cell" style="width: 25%;">
                    <div class="line">: ..............................</div>
                    <div class="line">: ..............................</div>
                </td>
                <td rowspan="2" style="width: 25%;">
                    <div>Mengetahui:</div>
                    <div style="margin-top: 14mm; text-align: center;">( ........................ )</div>
                </td>
                <td rowspan="2" style="width: 25%;">
                    <div>Catatan :</div>
                </td>
            </tr>
            {{-- Kedatangan --}}
            <tr>
                <td class="section-cell">
                    <div class="line">Tanggal Tiba</div>
                    <div class="line">Jam tiba</div>
                </td>
                <td class="section-cell">
                    <div class="line">: ..............................</div>
                    <div class="line">: ..............................</div>
                </td>
            </tr>

            @if(!$isHead)
                {{-- ======== FORMAT 1 : STAFF & MANAGER ======== --}}
                <tr>
                    <td class="sig-head">Diajukan oleh,</td>
                    <td class="sig-head">Disetujui oleh,</td>
                    <td class="sig-head" colspan="2">Diperiksa/ Diketahui oleh,</td>
                </tr>
                <tr>
                    <td class="sig-name">{{ $surat->nama_lengkap }}</td>
                    <td class="sig-name">{{ $surat->pemberi_tugas ?: '( .................... )' }}</td>
                    <td class="sig-name">{{ $surat->disetujui_oleh_nama ?: 'Jupiter' }}</td>
                    <td class="sig-name">Wagimin</td>
                </tr>
                <tr>
                    <td class="sig-role">User</td>
                    <td class="sig-role">Head Divisi</td>
                    <td class="sig-role">{{ $surat->disetujui_oleh_jabatan ?: 'Head Of IAD & HRD' }}</td>
                    <td class="sig-role">Head Of Finance,<br>Accounting &amp; Tax</td>
                </tr>
            @else
                {{-- ======== FORMAT 2 : HEAD ======== --}}
                <tr>
                    <td class="sig-head">Diajukan oleh,</td>
                    <td class="sig-head" colspan="2">Diperiksa/ Diketahui oleh,</td>
                    <td class="sig-head">Disetujui oleh,</td>
                </tr>
                <tr>
                    <td class="sig-name">{{ $surat->nama_lengkap }}</td>
                    <td class="sig-name">{{ $surat->disetujui_oleh_nama ?: 'Jupiter' }}</td>
                    <td class="sig-name">Wagimin</td>
                    <td class="sig-name">Holy</td>
                </tr>
                <tr>
                    <td class="sig-role">User/Head Divisi</td>
                    <td class="sig-role">{{ $surat->disetujui_oleh_jabatan ?: 'Head Of IAD & HRD' }}</td>
                    <td class="sig-role">Head Of Finance,<br>Accounting &amp; Tax</td>
                    <td class="sig-role">Direksi</td>
                </tr>
            @endif
        </table>

        <div class="note-text">*coret yang tidak perlu</div>

        {{-- Tabel Transfer Cash Advance --}}
        <table class="transfer-table">
            <tr>
                <th colspan="3">Mohon di transfer ke :</th>
            </tr>
            <tr>
                <td style="width: 22mm;">Nama</td>
                <td style="width: 4mm; text-align: center;">:</td>
                <td>{{ ($surat->ajukan_advance && $surat->nama_rekening !== '-') ? $surat->nama_rekening : ($surat->nama_lengkap ?: '<<Nama Rekening>>') }}</td>
            </tr>
            <tr>
                <td>Nama Bank</td>
                <td style="text-align: center;">:</td>
                <td>{{ ($surat->ajukan_advance && $surat->nama_bank !== '-') ? $surat->nama_bank : '-' }}</td>
            </tr>
            <tr>
                <td>No Rekening</td>
                <td style="text-align: center;">:</td>
                <td>{{ ($surat->ajukan_advance && $surat->nomor_rekening !== '-') ? $surat->nomor_rekening : '-' }}</td>
            </tr>
        </table>

        {{-- Footer Address --}}
        <div class="footer-address">
            Gold Coast Office Tower Eiffel Lantai 19 MNP
        </div>
    </div>

</body>
</html>