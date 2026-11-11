<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Exit Interview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            margin: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 {
            margin: 5px 0;
            font-size: 14px;
        }
        .form-code {
            text-align: right;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .intro-text {
            text-align: justify;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
        }
        .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 20px;
        }
        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }
        .info-label {
            display: table-cell;
            width: 150px;
            font-weight: bold;
        }
        .info-separator {
            display: table-cell;
            width: 20px;
        }
        .info-value {
            display: table-cell;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid #000;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        .question {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .answer-box {
            border: 1px solid #000;
            padding: 10px;
            min-height: 50px;
            margin-bottom: 20px;
        }
        .signature-section {
            margin-top: 30px;
        }
        .signature-box {
            border: 1px solid #000;
            padding: 10px;
        }
        .signature-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }
        .signature-label {
            display: table-cell;
            width: 150px;
            font-weight: bold;
        }
        .signature-separator {
            display: table-cell;
            width: 20px;
        }
        .signature-value {
            display: table-cell;
            border-bottom: 1px solid #000;
        }
        .page-break {
            page-break-before: always;
        }
        .form-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
        }
        .filled-by {
            font-weight: bold;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <!-- FORM A -->
    <div class="form-code">FM-HRD-00-R00</div>
    
    <div class="header">
        <h2>EXIT INTERVIEW ( FORM A )</h2>
    </div>
    
    <div class="filled-by">DIISI OLEH KARYAWAN</div>
    
    <div class="intro-text">
        Tujuan dari pengisian form ini adalah untuk mendapatkan masukan dari karyawan. 
        Masukan tersebut selanjutnya akan menjadi bahan yang sangat bermanfaat untuk perbaikan 
        di dalam perusahaan. Informasi ini akan diberlakukan secara rahasia oleh Departemen HRD. 
        Ijin dari karyawan akan diminta apabila informasi ini perlu untuk disampaikan ke atasan 
        yang bersangkutan.
    </div>
    
    <div class="info-box">
        <div class="info-row">
            <div class="info-label">Nama Karyawan</div>
            <div class="info-separator">:</div>
            <div class="info-value">{{ $nama }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Divisi / Departemen</div>
            <div class="info-separator">:</div>
            <div class="info-value">{{ $divisi }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tgl. Efektif Berhenti</div>
            <div class="info-separator">:</div>
            <div class="info-value">{{ $tanggal_efektif }}</div>
        </div>
    </div>
    
    <div class="question">
        2. Pendapat saudara tentang berbagai hal berikut (beri tanda V pada kolom yang dipilih):
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 35%;">Pendapat Karyawan</th>
                <th style="width: 10%;">Baik Sekali</th>
                <th style="width: 10%;">Baik</th>
                <th style="width: 10%;">Cukup</th>
                <th style="width: 10%;">Kurang</th>
                <th style="width: 25%;">Saran Perbaikan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Penghargaan perusahaan terhadap prestasi kerja karyawan</td>
                <td style="text-align: center;">{{ $evaluasi['penghargaan'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['penghargaan'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['penghargaan'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['penghargaan'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['penghargaan'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Kompensasi yang diberikan seimbang dengan pekerjaan</td>
                <td style="text-align: center;">{{ $evaluasi['kompensasi'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kompensasi'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kompensasi'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kompensasi'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['kompensasi'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Kesempatan untuk pengembangan karir</td>
                <td style="text-align: center;">{{ $evaluasi['pengembangan'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['pengembangan'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['pengembangan'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['pengembangan'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['pengembangan'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Peran dan tanggung jawab yang diberikan</td>
                <td style="text-align: center;">{{ $evaluasi['peranTanggungJawab'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['peranTanggungJawab'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['peranTanggungJawab'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['peranTanggungJawab'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['peranTanggungJawab'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Kinerja dalam posisi sekarang</td>
                <td style="text-align: center;">{{ $evaluasi['kinerja'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kinerja'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kinerja'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kinerja'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['kinerja'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Kejelasan ruang lingkup pekerjaan</td>
                <td style="text-align: center;">{{ $evaluasi['ruangLingkup'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['ruangLingkup'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['ruangLingkup'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['ruangLingkup'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['ruangLingkup'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Kondisi dan prasarana kerja</td>
                <td style="text-align: center;">{{ $evaluasi['kondisiKerja'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kondisiKerja'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kondisiKerja'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['kondisiKerja'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['kondisiKerja'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Hubungan dengan atasan</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganAtasan'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganAtasan'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganAtasan'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganAtasan'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['hubunganAtasan'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Hubungan dengan rekan kerja, divisi, atau departemen lain</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganRekan'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganRekan'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganRekan'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['hubunganRekan'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['hubunganRekan'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Gaji dibandingkan dengan perusahaan lain</td>
                <td style="text-align: center;">{{ $evaluasi['gaji'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['gaji'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['gaji'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['gaji'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['gaji'] ?? '' }}</td>
            </tr>
            <tr>
                <td>Tunjangan dan fasilitas dibandingkan perusahaan lain</td>
                <td style="text-align: center;">{{ $evaluasi['tunjangan'] == 'Baik sekali' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['tunjangan'] == 'Baik' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['tunjangan'] == 'Cukup' ? 'V' : '' }}</td>
                <td style="text-align: center;">{{ $evaluasi['tunjangan'] == 'Kurang' ? 'V' : '' }}</td>
                <td>{{ $saranPerbaikan['tunjangan'] ?? '' }}</td>
            </tr>
        </tbody>
    </table>
    
    <div class="question">
        3. Informasi tambahan sekiranya terdapat hal-hal yang belum tercantum dalam pertanyaan-pertanyaan di atas:
    </div>
    
    <div class="answer-box">
        {{ $informasiTambahan }}
    </div>
    
    <!-- FORM B - Page Break -->
    <div class="page-break"></div>
    
    <div class="form-code">FM-HRD-00-R00</div>
    
    <div class="header">
        <h2>EXIT INTERVIEW ( FORM B )</h2>
    </div>
    
    <div class="filled-by">DIISI OLEH KARYAWAN</div>
    
    <div class="question">
        1. Apa yang harus perusahaan berikan untuk dapat mempertahankan saudara pada saat ini?
    </div>
    
    <div class="answer-box">
        {{ $untukMempertahankan }}
    </div>
    
    <div class="question">
        2. Bersediakah saudara dipekerjakan kembali oleh perusahaan pada suatu waktu nanti, apabila kondisi yang menyebabkan saudara pindah telah diubah?
    </div>
    
    <div class="answer-box">
        {{ $bersediaDipekerjakan }}
    </div>
    
    <div class="question">
        3. Pada kelompok industri mana saudara akan bekerja? (Jika tidak keberatan, tolong berikan nama perusahaan, jabatan, dan besarnya gaji serta fasilitas yang ditawarkan)
    </div>
    
    <div class="answer-box">
        <strong>Perusahaan:</strong> {{ $perusahaanBaru }}<br>
        <strong>Jabatan:</strong> {{ $jabatanBaru }}<br>
        <strong>Gaji & Fasilitas:</strong> {{ $gajiBaru }}
    </div>
    
    <div class="signature-section">
        <p><strong>Tanda tangan,</strong></p>
        <div class="signature-box">
            <div class="signature-row">
                <div class="signature-label">Nama Karyawan</div>
                <div class="signature-separator">:</div>
                <div class="signature-value">{{ $nama }}</div>
            </div>
            <div class="signature-row">
                <div class="signature-label">Tanggal</div>
                <div class="signature-separator">:</div>
                <div class="signature-value">{{ $tanggal_efektif }}</div>
            </div>
        </div>
    </div>
</body>
</html>