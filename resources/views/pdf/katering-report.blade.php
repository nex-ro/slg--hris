<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Katering</title>
    <style>
        @page {
            margin: 50px 50px;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
        }
        
        .title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .container {
            width: 100%;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .main-table {
            margin-bottom: 0;
        }
        
        .main-table th {
            background-color: #CCCCCC;
            font-weight: bold;
            padding: 5px;
            border: 1px solid #000;
            text-align: center;
        }
        
        .main-table td {
            border: 1px solid #000;
            padding: 3px 5px;
        }
        
        .tower-header {
            background-color: #CCCCCC;
            font-weight: bold;
            text-align: center;
        }
        
        .no-col {
            width: 8%;
            text-align: center;
        }
        
        .nama-col {
            width: 42%;
            text-align: left;
        }
        
        /* Keterangan Table */
        .keterangan-table {
            width: 100%;
            margin-top: 0;
        }
        
        .keterangan-table td {
            padding: 3px 5px;
            border: 1px solid #000;
        }
        
        .keterangan-table td.no-border {
            border: none;
        }
        
        .highlight {
            background-color: #FFFF00;
            font-weight: bold;
        }
        
        .center {
            text-align: center;
        }
        
        .left {
            text-align: left;
        }
        
        .border-top {
            border-top: 2px solid #000 !important;
        }
        
        .border-bottom {
            border-bottom: 2px solid #000 !important;
        }
        
        /* Layout 2 kolom */
        .two-column {
            width: 100%;
        }
        
        .left-column {
            width: 58%;
            float: left;
        }
        
        .right-column {
            width: 40%;
            float: right;
            margin-left: 2%;
        }
        
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="title">Laporan Absen {{ $tanggal }}</div>
    
    <div class="container clearfix">
        <!-- Left Column: Data Hadir -->
        <div class="left-column">
            <table class="main-table">
                <thead>
                    <tr>
                        <th colspan="2" class="tower-header">Eifel</th>
                        <th colspan="2" class="tower-header">Liberty</th>
                    </tr>
                    <tr>
                        <th class="no-col">No</th>
                        <th class="nama-col">Nama</th>
                        <th class="no-col">No</th>
                        <th class="nama-col">Nama</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $maxRows = max(45, $eifelHadir->count(), $libertyHadir->count());
                        $eifelArray = $eifelHadir->values()->all();
                        $libertyArray = $libertyHadir->values()->all();
                    @endphp
                    
                    @for ($i = 0; $i < $maxRows; $i++)
                        <tr>
                            <td class="no-col">{{ $i + 1 }}</td>
                            <td class="nama-col">
                                {{ isset($eifelArray[$i]) ? ($eifelArray[$i]['user']['name'] ?? $eifelArray[$i]['nama'] ?? $eifelArray[$i]['name'] ?? '') : '' }}
                            </td>
                            <td class="no-col">{{ $i + 1 }}</td>
                            <td class="nama-col">
                                {{ isset($libertyArray[$i]) ? ($libertyArray[$i]['user']['name'] ?? $libertyArray[$i]['nama'] ?? $libertyArray[$i]['name'] ?? '') : '' }}
                            </td>
                        </tr>
                    @endfor
                </tbody>
            </table>
        </div>
        
        <!-- Right Column: Keterangan -->
        <div class="right-column">
            <table class="keterangan-table">
                <!-- Keterangan Eifel -->
                <tr>
                    <td colspan="3" class="highlight">Keterangan :</td>
                </tr>
                <tr>
                    <td colspan="3" class="highlight center">tower Eifel</td>
                </tr>
                <tr class="border-bottom">
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                <tr>
                    <td>TOTAL</td>
                    <td class="center">{{ $eifelTotal }}</td>
                    <td>Orang</td>
                </tr>
                <tr>
                    <td>Sakit</td>
                    <td class="center">{{ $eifelSakit->count() }}</td>
                    <td>
                        @foreach($eifelSakit as $item)
                            {{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}
                            @if(!$loop->last), @endif
                        @endforeach
                    </td>
                </tr>
                @if($eifelSakit->count() > 1)
                    @foreach($eifelSakit->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Cuti</td>
                    <td class="center">{{ $eifelCuti->count() }}</td>
                    <td>
                        @if($eifelCuti->count() > 0)
                            {{ $eifelCuti->first()['user']['name'] ?? $eifelCuti->first()['nama'] ?? $eifelCuti->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($eifelCuti->count() > 1)
                    @foreach($eifelCuti->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Dinas Luar</td>
                    <td class="center">{{ $eifelDinasLuar->count() }}</td>
                    <td>
                        @if($eifelDinasLuar->count() > 0)
                            {{ $eifelDinasLuar->first()['user']['name'] ?? $eifelDinasLuar->first()['nama'] ?? $eifelDinasLuar->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($eifelDinasLuar->count() > 1)
                    @foreach($eifelDinasLuar->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Keluar kantor</td>
                    <td class="center">{{ $eifelKeluar->count() }}</td>
                    <td>
                        @if($eifelKeluar->count() > 0)
                            {{ $eifelKeluar->first()['user']['name'] ?? $eifelKeluar->first()['nama'] ?? $eifelKeluar->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($eifelKeluar->count() > 1)
                    @foreach($eifelKeluar->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>WFH</td>
                    <td class="center">{{ $eifelWFH->count() }}</td>
                    <td>
                        @if($eifelWFH->count() > 0)
                            {{ $eifelWFH->first()['user']['name'] ?? $eifelWFH->first()['nama'] ?? $eifelWFH->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($eifelWFH->count() > 1)
                    @foreach($eifelWFH->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr class="border-top">
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3" class="highlight"><strong>Total: {{ $eifelHadirTotal }}</strong></td>
                </tr>
                
                <!-- Spacing -->
                <tr>
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                
                <!-- Keterangan Liberty -->
                <tr>
                    <td colspan="3" class="highlight">Keterangan :</td>
                </tr>
                <tr>
                    <td colspan="3" class="highlight center">tower liberty</td>
                </tr>
                <tr class="border-bottom">
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                <tr>
                    <td>TOTAL</td>
                    <td class="center">{{ $libertyTotal }}</td>
                    <td>Orang</td>
                </tr>
                <tr>
                    <td>Sakit</td>
                    <td class="center">{{ $libertySakit->count() }}</td>
                    <td>
                        @if($libertySakit->count() > 0)
                            {{ $libertySakit->first()['user']['name'] ?? $libertySakit->first()['nama'] ?? $libertySakit->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($libertySakit->count() > 1)
                    @foreach($libertySakit->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Cuti</td>
                    <td class="center">{{ $libertyCuti->count() }}</td>
                    <td>
                        @if($libertyCuti->count() > 0)
                            {{ $libertyCuti->first()['user']['name'] ?? $libertyCuti->first()['nama'] ?? $libertyCuti->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($libertyCuti->count() > 1)
                    @foreach($libertyCuti->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Dinas Luar</td>
                    <td class="center">{{ $libertyDinasLuar->count() }}</td>
                    <td>
                        @if($libertyDinasLuar->count() > 0)
                            {{ $libertyDinasLuar->first()['user']['name'] ?? $libertyDinasLuar->first()['nama'] ?? $libertyDinasLuar->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($libertyDinasLuar->count() > 1)
                    @foreach($libertyDinasLuar->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr>
                    <td>Keluar kantor</td>
                    <td class="center">{{ $libertyKeluar->count() }}</td>
                    <td>
                        @if($libertyKeluar->count() > 0)
                            {{ $libertyKeluar->first()['user']['name'] ?? $libertyKeluar->first()['nama'] ?? $libertyKeluar->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($libertyKeluar->count() > 1)
                    @foreach($libertyKeluar->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                {{-- Untuk Liberty - Setelah bagian Cuti --}}
                <tr>
                    <td>WFH</td>
                    <td class="center">{{ $libertyWFH->count() }}</td>
                    <td>
                        @if($libertyWFH->count() > 0)
                            {{ $libertyWFH->first()['user']['name'] ?? $libertyWFH->first()['nama'] ?? $libertyWFH->first()['name'] ?? '' }}
                        @endif
                    </td>
                </tr>
                @if($libertyWFH->count() > 1)
                    @foreach($libertyWFH->skip(1) as $item)
                        <tr>
                            <td></td>
                            <td></td>
                            <td>{{ $item['user']['name'] ?? $item['nama'] ?? $item['name'] ?? '' }}</td>
                        </tr>
                    @endforeach
                @endif
                <tr class="border-top">
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3" class="highlight"><strong>Total: {{ $libertyHadirTotal }}</strong></td>
                </tr>
                
                <!-- Spacing -->
                <tr>
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3" class="no-border">&nbsp;</td>
                </tr>
                
                <!-- Akumulasi -->
                <tr>
                    <td colspan="3" class="highlight">Akumulasi</td>
                </tr>
                <tr>
                    <td colspan="2">Lantai 19</td>
                    <td class="center">{{ $totalLantai19 }}</td>
                </tr>
                <tr>
                    <td colspan="2">Lantai 1</td>
                    <td class="center">{{ $totalLantai1 }}</td>
                </tr>
                <tr>
                    <td colspan="2">Marein</td>
                    <td class="center">{{ $totalMarein }}</td>
                </tr>
                <tr>
                    <td colspan="2" class="highlight"><strong>Total</strong></td>
                    <td class="center highlight"><strong>{{ $totalAkumulasi }}</strong></td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>