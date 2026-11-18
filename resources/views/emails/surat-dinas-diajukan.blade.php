<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pengajuan Surat Perjalanan Dinas (SPD)</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
            background-color: #f7f9fa;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background-color: #1b7a42;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 24px;
        }
        .intro {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 20px;
        }
        table.data-table th, table.data-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #eeeeee;
            vertical-align: top;
        }
        table.data-table th {
            width: 35%;
            color: #555555;
            text-align: left;
            background-color: #fafafa;
        }
        table.data-table td {
            color: #222222;
        }
        .badge {
            display: inline-block;
            background-color: #e8f5e9;
            color: #1b7a42;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .footer {
            background-color: #f1f3f4;
            padding: 15px 20px;
            font-size: 12px;
            color: #70757a;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Pengajuan Surat Perjalanan Dinas (SPD) 2025</h2>
            <p>Sawit Lestari Group &bull; Sistem Informasi HRIS</p>
        </div>

        <div class="content">
            <p class="intro">
                Halo Tim HRD,<br>
                Terdapat pengajuan Surat Perjalanan Dinas (SPD) baru yang telah masuk dan memerlukan tindak lanjut otorisasi:
            </p>

            <table class="data-table">
                <tr>
                    <th>Nomor Surat</th>
                    <td><strong>{{ $nomorSurat }}</strong></td>
                </tr>
                <tr>
                    <th>Nama Pemohon</th>
                    <td><strong>{{ $namaPegawai }}</strong></td>
                </tr>
                <tr>
                    <th>Email Pemohon</th>
                    <td>{{ $emailPegawai }}</td>
                </tr>
                <tr>
                    <th>Jabatan</th>
                    <td><span class="badge">{{ $jabatan }}</span></td>
                </tr>
                <tr>
                    <th>Pemberi Tugas / Atasan</th>
                    <td>{{ $pemberiTugas }}</td>
                </tr>
                <tr>
                    <th>Tanggal Berangkat</th>
                    <td>{{ $tanggalBerangkat }}</td>
                </tr>
                <tr>
                    <th>Tanggal Kembali</th>
                    <td>{{ $tanggalKembali }}</td>
                </tr>
                <tr>
                    <th>Tujuan</th>
                    <td>{{ $tujuan }}</td>
                </tr>
                <tr>
                    <th>Keperluan</th>
                    <td>{{ $keperluan }}</td>
                </tr>
                <tr>
                    <th>Transportasi</th>
                    <td>{{ $transportasi }}</td>
                </tr>
                <tr>
                    <th>Cash Advance</th>
                    <td>
                        @if($ajukanAdvance)
                            <strong style="color: #c62828;">Ya (Rp {{ $panjarNominal }})</strong><br>
                            <span style="font-size: 12px; color: #555;">Terbilang: {{ $panjarTerbilang }}</span><br>
                            <span style="font-size: 12px; color: #555;">Rekening: {{ $namaBank }} - {{ $nomorRekening }} a/n {{ $namaRekening }}</span>
                        @else
                            Tidak Mengajukan
                        @endif
                    </td>
                </tr>
            </table>

            <p style="font-size: 13px; line-height: 1.5; color: #555;">
                Silakan akses menu <strong>Dinas Luar &gt; Pengajuan</strong> di sistem HRIS untuk memverifikasi atau mengunduh cetakan berkas PDF.
            </p>
        </div>

        <div class="footer">
            Email ini dikirim secara otomatis oleh Sistem HRIS Sawit Lestari Group.
        </div>
    </div>
</body>
</html>
