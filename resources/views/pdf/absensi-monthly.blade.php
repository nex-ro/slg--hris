<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Absensi Bulanan - {{ $bulan }} {{ $tahun }}</title>
    <style>
        @page {
            margin: 15mm 10mm;
        }
        body {
            font-family: 'Arial', sans-serif;
            font-size: 7pt;
            line-height: 1.2;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #333;
        }
        
        .header h1 {
            margin: 0;
            font-size: 14pt;
            font-weight: bold;
            color: #333;
        }
        
        .header p {
            margin: 3px 0;
            font-size: 9pt;
            color: #666;
        }
        
        .date-section {
            background-color: #f0f0f0;
            padding: 6px;
            margin-top: 15px;
            margin-bottom: 8px;
            border-left: 3px solid #4CAF50;
            page-break-before: always;
        }
        
        .date-section:first-of-type {
            page-break-before: auto;
        }
        
        .date-section.holiday {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        
        .date-section h2 {
            margin: 0;
            font-size: 9pt;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        table th {
            background-color: #4CAF50;
            color: white;
            padding: 5px 3px;
            text-align: left;
            font-size: 7pt;
            font-weight: bold;
            border: 1px solid #ddd;
        }
        
        table td {
            padding: 4px 3px;
            border: 1px solid #ddd;
            font-size: 6pt;
        }
        
        table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        table tr:hover {
            background-color: #f5f5f5;
        }
        
        /* Status colors */
        .status-terlambat {
            background-color: #ffcdd2 !important;
            font-weight: bold;
        }
        
        .status-izin {
            background-color: #fff9c4 !important;
        }
        
        .status-libur {
            background-color: #e0e0e0 !important;
        }
        
        .status-hadir {
            background-color: #c8e6c9 !important;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 7pt;
            color: #999;
            padding-top: 5px;
            border-top: 1px solid #ddd;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN ABSENSI BULANAN</h1>
        <p>{{ $bulan }} {{ $tahun }} - Tower {{ $tower }}</p>
        <p style="font-size: 8pt;">Dicetak pada: {{ $generated_at }}</p>
    </div>

    @foreach($dataPerTanggal as $index => $daily)
        <div class="no-break">
            <div class="date-section {{ $daily['is_holiday'] ? 'holiday' : '' }}">
                <h2>{{ $daily['tanggal_formatted'] }} ({{ $daily['hari'] }})
                    @if($daily['is_holiday'])
                        <span style="color: #f57c00;"> - HARI LIBUR</span>
                    @endif
                </h2>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 4%;">No</th>
                        <th style="width: 8%;">Tower</th>
                        <th style="width: 8%;">TMK</th>
                        <th style="width: 18%;">Nama</th>
                        <th style="width: 14%;">Divisi</th>
                        <th style="width: 14%;">Jabatan</th>
                        <th style="width: 9%;">Datang</th>
                        <th style="width: 9%;">Pulang</th>
                        <th style="width: 16%;">Ket</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($daily['data'] as $key => $item)
                        <tr class="
                            @if($item['status'] === 'Terlambat') status-terlambat
                            @elseif(in_array($item['status'], ['DL', 'C1', 'C2', 'C3', 'P1', 'P2', 'P3', 'FP-TR'])) status-izin
                            @elseif($item['status'] === 'Libur Kerja') status-libur
                            @elseif($item['status'] === 'Hadir') status-hadir
                            @endif
                        ">
                            <td style="text-align: center;">{{ $key + 1 }}</td>
                            <td>{{ $item['tower'] }}</td>
                            <td>{{ $item['tmk'] }}</td>
                            <td>{{ $item['nama'] }}</td>
                            <td>{{ $item['divisi'] }}</td>
                            <td>{{ $item['jabatan'] }}</td>
                            <td style="text-align: center;">{{ $item['jam_kedatangan'] }}</td>
                            <td style="text-align: center;">{{ $item['jam_pulang'] }}</td>
                            <td style="text-align: center; font-weight: bold;">{{ $item['status'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endforeach

    <div class="footer">
        Laporan Absensi Bulanan - {{ $bulan }} {{ $tahun }} | Tower {{ $tower }} | Halaman {PAGE_NUM} dari {PAGE_COUNT}
    </div>
</body>
</html>