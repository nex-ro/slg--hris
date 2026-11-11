<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Absensi - {{ $tower }}</title>
    <style>
        @page {
            margin: 20mm 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            line-height: 1.3;
            padding: 20px 30px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
        }
        
        .header h1 {
            font-size: 14px;
            margin-bottom: 5px;
            color: #000;
            font-weight: bold;
        }
        
        .header-info {
            font-size: 9px;
            color: #000;
            margin-top: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        th {
            background-color: #d9d9d9;
            color: #000;
            padding: 6px 4px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 8px;
        }
        
        td {
            padding: 5px 4px;
            border: 1px solid #000;
            text-align: center;
            font-size: 8px;
        }
        
        td.nama {
            text-align: left;
            padding-left: 5px;
        }
        
        tr.terlambat {
            background-color: #ffcccc;
        }
        
        tr.warning {
            background-color: #ffffcc;
        }
        
        .footer {
            margin-top: 15px;
            text-align: right;
            font-size: 8px;
        }
        
        .footer-info {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 7px;
        }
        
        @media print {
            body {
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN ABSENSI KARYAWAN</h1>
        <div class="header-info">
            Tower: {{ $tower }} | Tanggal: {{ $tanggal }} | Total: {{ $totalData }} orang
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 9%;">Tanggal</th>
                <th style="width: 8%;">Hari</th>
                <th style="width: 20%;">Nama Karyawan</th>
                <th style="width: 13%;">Department</th>
                <th style="width: 6%;">TMK</th>
                <th style="width: 13%;">Jabatan</th>
                <th style="width: 9%;">Masuk</th>
                <th style="width: 9%;">Pulang</th>
                <th style="width: 9%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dataAbsensi as $index => $item)
                @php
                    $status = strtolower(trim($item['status'] ?? ''));
                    $rowClass = '';
                    
                    if (strpos($status, 'terlambat') !== false) {
                        $rowClass = 'terlambat';
                    } elseif (!in_array($status, ['on time', 'n/a', '-', 'libur kerja', '']) && 
                              strpos($status, 'on time') === false) {
                        $rowClass = 'warning';
                    }
                @endphp
                
                <tr class="{{ $rowClass }}">
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item['tanggal'] }}</td>
                    <td>{{ $item['hari'] }}</td>
                    <td class="nama">{{ $item['nama'] }}</td>
                    <td>{{ $item['divisi'] }}</td>
                    <td>{{ $item['tmk'] }}</td>
                    <td>{{ $item['jabatan'] }}</td>
                    <td>{{ $item['jam_kedatangan'] }}</td>
                    <td>{{ $item['jam_pulang'] }}</td>
                    <td>{{ $item['status'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="footer">
        Dicetak pada: {{ date('d/m/Y H:i:s') }}
    </div>
    
    <div class="footer-info">
        <p>Keterangan: Merah = Terlambat | Kuning = Status Lainnya</p>
        <p>Dokumen ini dicetak secara otomatis oleh sistem</p>
    </div>
</body>
</html>