<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Realisasi Klaim Dinas - {{ $klaim->nomor_klaim }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @page {
            size: A4 portrait;
            margin: 20mm 25mm 20mm 25mm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.3;
            background: #fff;
        }

        .title-block {
            text-align: center;
            margin-bottom: 20px;
        }
        .title-block h1 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .title-block .kegiatan {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .title-block .periode {
            font-size: 10pt;
            color: #222;
        }

        /* Tabel Rincian Biaya */
        .table-klaim {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-bottom: 25px;
        }
        .table-klaim th, .table-klaim td {
            border: 1px solid #000;
            padding: 6px 10px;
            font-size: 9.5pt;
        }
        .table-klaim th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }
        .table-klaim .col-tgl {
            width: 110px;
            text-align: center;
        }
        .table-klaim .col-nominal {
            width: 140px;
            text-align: right;
            font-family: 'Courier New', Courier, monospace;
            font-weight: 600;
        }
        .table-klaim .total-row td {
            font-weight: bold;
        }
        .table-klaim .total-label {
            text-align: left;
            padding-left: 12px;
        }

        /* Tanda Tangan */
        .signature-section {
            width: 100%;
            margin-top: 15px;
            margin-bottom: 20px;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }
        .signature-table td {
            vertical-align: top;
            width: 50%;
            font-size: 10pt;
        }
        .sig-space {
            height: 60px;
        }
        .name-underlined {
            font-weight: bold;
            text-decoration: underline;
        }
        .sig-title {
            font-size: 9pt;
            color: #333;
            margin-top: 2px;
        }

        /* Form Code */
        .form-code {
            font-size: 8pt;
            color: #555;
            margin-top: 20px;
            margin-bottom: 15px;
        }

        /* Info Rekening */
        .bank-info {
            font-size: 9pt;
            line-height: 1.4;
            border-top: 1px dashed #999;
            padding-top: 10px;
        }
        .bank-info table {
            border-collapse: collapse;
        }
        .bank-info td {
            padding: 2px 4px;
        }
    </style>
</head>
<body>

    @php
        $periodeText = 'Periode dinas: ';
        if ($klaim->periode_awal && $klaim->periode_akhir) {
            $periodeText .= \Carbon\Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y') . ' - ' . \Carbon\Carbon::parse($klaim->periode_akhir)->translatedFormat('d F Y');
        } elseif ($klaim->periode_awal) {
            $periodeText .= \Carbon\Carbon::parse($klaim->periode_awal)->translatedFormat('d F Y');
        } else {
            $periodeText .= '-';
        }

        $kotaTgl = ($klaim->kota_penandatangan ?: 'Jakarta') . ', ' . \Carbon\Carbon::parse($klaim->tanggal_pengajuan ?: now())->translatedFormat('d F Y');
        
        $pemeriksaNama = $klaim->diperiksa_oleh_nama ?: (in_array($klaim->status, ['Disetujui', 'Diproses']) ? 'Jupiter' : '( .................... )');
        $pemeriksaJabatan = $klaim->diperiksa_oleh_jabatan ?: 'Head Of HRD';
    @endphp

    <div class="title-block">
        <h1>Realisasi Klaim Dinas</h1>
        <div class="kegiatan">{{ $klaim->kegiatan }}</div>
        <div class="periode">{{ $periodeText }}</div>
    </div>

    {{-- Tabel Rincian --}}
    <table class="table-klaim">
        <thead>
            <tr>
                <th class="col-tgl">Tanggal</th>
                <th>Rincian Biaya</th>
                <th class="col-nominal">Nominal</th>
            </tr>
        </thead>
        <tbody>
            @forelse($klaim->items as $item)
                <tr>
                    <td class="col-tgl">
                        {{ $item->tanggal ? \Carbon\Carbon::parse($item->tanggal)->format('d/m/Y') : '-' }}
                    </td>
                    <td>
                        {{ $item->rincian_biaya }}
                    </td>
                    <td class="col-nominal">
                        Rp {{ number_format($item->nominal, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td class="col-tgl">-</td>
                    <td>Tidak ada rincian biaya</td>
                    <td class="col-nominal">Rp 0</td>
                </tr>
            @endforelse

            <tr class="total-row">
                <td colspan="2" class="total-label">Total Realisasi Biaya</td>
                <td class="col-nominal">Rp {{ number_format($klaim->total_realisasi, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="total-label">Cash Advance</td>
                <td class="col-nominal">Rp {{ number_format($klaim->cash_advance, 0, ',', '.') }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" class="total-label">Total Sisa Kurang</td>
                <td class="col-nominal">Rp {{ number_format($klaim->sisa_kurang, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    {{-- Tanggal dan Tanda Tangan --}}
    <div class="signature-section">
        <table class="signature-table">
            <tr>
                <td>{{ $kotaTgl }}</td>
                <td>&nbsp;</td>
            </tr>
            <tr>
                <td style="padding-top: 6px;">Dibuat oleh,</td>
                <td style="padding-top: 6px;">Diperiksa oleh,</td>
            </tr>
            <tr>
                <td class="sig-space"></td>
                <td class="sig-space"></td>
            </tr>
            <tr>
                <td>
                    <div class="name-underlined">{{ $klaim->nama_lengkap }}</div>
                    <div class="sig-title">{{ $klaim->jabatan ?: ($klaim->divisi ?: 'Pegawai') }}</div>
                </td>
                <td>
                    <div class="name-underlined">{{ $pemeriksaNama }}</div>
                    <div class="sig-title">{{ $pemeriksaJabatan }}</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Form Code --}}
    <div class="form-code">
        FORMHR02/OFL/III/2022
    </div>

    {{-- Info Transfer --}}
    <div class="bank-info">
        <table>
            <tr>
                <td style="font-weight: bold; width: 100px;">Transfer ke :</td>
                <td>No Rek : {{ $klaim->no_rekening ?: '-' }}</td>
            </tr>
            <tr>
                <td></td>
                <td>Bank {{ $klaim->nama_bank ?: '-' }}</td>
            </tr>
            <tr>
                <td></td>
                <td>An. {{ $klaim->nama_rekening ?: $klaim->nama_lengkap }}</td>
            </tr>
        </table>
    </div>

</body>
</html>
