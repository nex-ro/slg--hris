<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifikasi Keterlambatan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f44336;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .info-box {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #f44336;
        }
        .warning-box {
            background-color: #fff3cd;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #ffc107;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        strong {
            color: #f44336;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚠️ Notifikasi Keterlambatan</h2>
    </div>
    
    <div class="content">
        <p>Kepada Yth,<br><strong>{{ $nama }}</strong></p>
        
        <p>Melalui email ini kami informasikan bahwa Anda tercatat terlambat pada:</p>
        
        <div class="info-box">
            <table style="width: 100%;">
                <tr>
                    <td><strong>Tanggal</strong></td>
                    <td>: {{ $tanggal }}</td>
                </tr>
                <tr>
                    <td><strong>Jam Masuk Standar</strong></td>
                    <td>: {{ $jam_masuk_standar }}</td>
                </tr>
                <tr>
                    <td><strong>Jam Kedatangan Anda</strong></td>
                    <td>: {{ $jam_kedatangan }}</td>
                </tr>
                <tr>
                    <td><strong>Durasi Keterlambatan</strong></td>
                    <td>: <span style="color: #f44336; font-weight: bold;">{{ $menit_terlambat }} menit</span></td>
                </tr>
            </table>
        </div>
        
        <div class="warning-box">
            <p style="margin: 0;">
                <strong>📊 Total Keterlambatan Bulan {{ $bulan }}:</strong><br>
                Anda telah terlambat sebanyak <strong style="font-size: 18px; color: #d32f2f;">{{ $jumlah_terlambat_bulan_ini }} kali</strong> pada bulan ini.
            </p>
        </div>
        
        @if($jumlah_terlambat_bulan_ini >= 3)
        <div style="background-color: #ffebee; padding: 15px; margin: 15px 0; border-left: 4px solid #d32f2f;">
            <p style="margin: 0; color: #d32f2f;">
                <strong>⚠️ PERINGATAN:</strong><br>
                Keterlambatan Anda sudah mencapai {{ $jumlah_terlambat_bulan_ini }} kali bulan ini. Mohon untuk lebih memperhatikan kedisiplinan waktu agar tidak berdampak pada penilaian kinerja Anda.
            </p>
        </div>
        @endif
        
        <p>Kami menghimbau untuk dapat lebih memperhatikan kedisiplinan waktu kedatangan. Kehadiran tepat waktu merupakan salah satu indikator profesionalisme dan komitmen Anda terhadap perusahaan.</p>
        
        <p>Jika ada kendala atau alasan khusus terkait keterlambatan ini, mohon dapat segera menghubungi atasan atau HRD.</p>
        
        <p>Terima kasih atas perhatian dan kerja sama Anda.</p>
        
        <p style="margin-top: 30px;">
            Hormat kami,<br>
            <strong>Tim HRD</strong>
        </p>
    </div>
    
    <div class="footer">
        <p>Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.</p>
        <p>&copy; {{ date('Y') }} - Sistem Manajemen Kehadiran</p>
    </div>
</body>
</html>