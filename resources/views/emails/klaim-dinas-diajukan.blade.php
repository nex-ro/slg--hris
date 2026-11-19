<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pengajuan Claim Dinas</title>
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
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 20px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 24px;
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
            <h2>Pengajuan Realisasi Claim Dinas</h2>
            <p>Sawit Lestari Group &bull; Sistem Informasi HRIS</p>
        </div>

        <div class="content">
            <p>
                Halo Tim HRD,<br>
                Terdapat pengajuan realisasi klaim biaya perjalanan dinas baru yang memerlukan verifikasi:
            </p>

            <table class="data-table">
                <tr>
                    <th>Nomor Klaim</th>
                    <td><strong>{{ $nomorKlaim }}</strong></td>
                </tr>
                <tr>
                    <th>Nama Pegawai</th>
                    <td>{{ $namaPegawai }} ({{ $emailPegawai }})</td>
                </tr>
                <tr>
                    <th>Kegiatan Dinas</th>
                    <td>{{ $kegiatan }}</td>
                </tr>
                <tr>
                    <th>Periode Dinas</th>
                    <td>{{ $periode }}</td>
                </tr>
                <tr>
                    <th>Total Realisasi</th>
                    <td><strong>{{ $totalRealisasi }}</strong></td>
                </tr>
                <tr>
                    <th>Cash Advance</th>
                    <td>{{ $cashAdvance }}</td>
                </tr>
                <tr>
                    <th>Total Sisa Kurang</th>
                    <td><strong style="color: #2563eb;">{{ $sisaKurang }}</strong></td>
                </tr>
                <tr>
                    <th>Pengiriman Bukti Nota</th>
                    <td>{{ $metodeNota }}</td>
                </tr>
            </table>

            <p style="font-size: 13px; color: #555;">
                Silakan buka menu <strong>Dinas Luar &gt; Claim Dinas</strong> untuk memeriksa, memverifikasi, dan mengunduh Excel/PDF klaim.
            </p>
        </div>

        <div class="footer">
            Email ini dikirim secara otomatis oleh Sistem HRIS Sawit Lestari Group.
        </div>
    </div>
</body>
</html>
