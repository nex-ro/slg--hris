<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifikasi Keterlambatan</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 650px;
            margin: 20px auto;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
            padding: 30px;
            text-align: center;
            border-radius: 0;
        }
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .logo-box {
            background-color: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .logo-box img {
            height: 50px;
            width: auto;
            display: block;
            margin: 0 auto;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 26px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            color: #ffebee;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .content {
            padding: 40px 35px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 25px;
            color: #555;
        }
        .greeting strong {
            color: #d32f2f;
            font-size: 17px;
        }
        .info-card {
            background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
            border-left: 5px solid #f44336;
            padding: 25px;
            margin: 25px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .info-title {
            font-size: 18px;
            font-weight: 600;
            color: #d32f2f;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f44336;
        }
        .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #ffcdd2;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
            min-width: 200px;
            flex-shrink: 0;
        }
        .info-value {
            color: #212529;
            flex-grow: 1;
        }
        .info-value strong {
            color: #d32f2f;
            font-size: 18px;
        }
        .warning-box {
            background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
            border-left: 5px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
        }
        .warning-box p {
            margin: 0;
            font-size: 15px;
            color: #856404;
        }
        .warning-box .count {
            font-size: 36px;
            font-weight: bold;
            color: #d32f2f;
            margin: 10px 0;
            display: block;
        }
        .danger-box {
            background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            border-left: 5px solid #d32f2f;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .danger-box p {
            margin: 0;
            color: #c62828;
        }
        .danger-box strong {
            font-size: 16px;
        }
        .reminder-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 18px;
            margin: 25px 0;
            border-radius: 5px;
            font-size: 14px;
            color: #0d47a1;
        }
        .reminder-box strong {
            color: #01579b;
            font-size: 15px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 25px;
            text-align: center;
            border-top: 3px solid #f44336;
        }
        .footer p {
            margin: 5px 0;
            font-size: 13px;
            color: #6c757d;
        }
        .footer strong {
            color: #d32f2f;
        }
        .etica-logos {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            width: 100%;
        }
        .etica-logos img {
            width: 100%;
            max-width: 100%;
            height: auto;
            display: block;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 0;
            }
            .content {
                padding: 25px 20px;
            }
            .logo-section {
                flex-direction: column;
                gap: 15px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label {
                min-width: auto;
                margin-bottom: 5px;
            }
            .warning-box .count {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>⚠️ Notifikasi Keterlambatan</h1>
            <p>Sawit Lestari Group</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Kepada Yth,<br>
                <strong>{{ $nama }}</strong>
            </div>
            
            <p style="margin-bottom: 20px; color: #555;">
                Melalui email ini kami informasikan bahwa Anda tercatat terlambat masuk kerja. Berikut adalah detail keterlambatan Anda:
            </p>
            
            <!-- Detail Keterlambatan Card -->
            <div class="info-card">
                <div class="info-title">📋 Detail Keterlambatan</div>
                
                <div class="info-row">
                    <div class="info-label">Tanggal</div>
                    <div class="info-value"><strong>{{ $tanggal }}</strong></div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">Jam Masuk Standar</div>
                    <div class="info-value">{{ $jam_masuk_standar }}</div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">Jam Kedatangan Anda</div>
                    <div class="info-value">{{ $jam_kedatangan }}</div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">Durasi Keterlambatan</div>
                    <div class="info-value"><strong>{{ $menit_terlambat }} menit</strong></div>
                </div>
            </div>
            
            <!-- Total Keterlambatan Box -->
            <div class="warning-box">
                <p><strong>📊 Total Keterlambatan Bulan {{ $bulan }}</strong></p>
                <span class="count">{{ $jumlah_terlambat_bulan_ini }}×</span>
                <p>Anda telah terlambat <strong>{{ $jumlah_terlambat_bulan_ini }} kali</strong> pada bulan ini</p>
            </div>
            
            @if($jumlah_terlambat_bulan_ini >= 3)
            <!-- Danger Box -->
            <div class="danger-box">
                <p style="margin-bottom: 10px;">
                    <strong>⚠️ PERINGATAN SERIUS!</strong>
                </p>
                <p>
                    Keterlambatan Anda sudah mencapai <strong>{{ $jumlah_terlambat_bulan_ini }} kali</strong> bulan ini. Mohon untuk lebih memperhatikan kedisiplinan waktu agar tidak berdampak pada penilaian kinerja dan dapat berakibat pada sanksi sesuai peraturan perusahaan.
                </p>
            </div>
            @elseif($jumlah_terlambat_bulan_ini >= 2)
            <!-- Warning Box for 2 times -->
            <div class="danger-box" style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-left: 5px solid #ff9800;">
                <p style="margin-bottom: 10px; color: #e65100;">
                    <strong>⚠️ PERHATIAN!</strong>
                </p>
                <p style="color: #e65100;">
                    Keterlambatan Anda sudah mencapai <strong>{{ $jumlah_terlambat_bulan_ini }} kali</strong> bulan ini. Harap diperhatikan bahwa <strong>keterlambatan lebih dari 2 kali dalam sebulan akan dikenakan sanksi berupa pemotongan cuti atau pemotongan gaji</strong> sesuai dengan peraturan perusahaan.
                </p>
            </div>
            @endif

            <div class="reminder-box">
                <strong>💡 Catatan Penting:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Kedisiplinan waktu menjadi bagian dari penilaian kinerja karyawan</li>
                    <li>Jika ada kendala atau alasan khusus, segera koordinasikan dengan atasan atau HRD</li>
                    <li><strong>Jika terdapat kesalahan data absensi</strong>, mohon segera menghubungi Tim HRD untuk klarifikasi dan perbaikan</li>
                </ul>
            </div>
            <p style="margin-top: 30px;">
                Hormat kami,<br>
                <strong style="color: #d32f2f;">Tim Human Resources (HR)</strong><br>
                <span style="color: #6c757d; font-size: 14px;">Sawit Lestari Group</span>
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p style="margin-top: 20px;"><strong>⚠️ Email Otomatis</strong></p>
            <p>Email ini dikirim secara otomatis oleh sistem kehadiran.</p>
            <p>Mohon tidak membalas email ini.</p>
            <p style="margin-top: 15px; color: #495057;">
                &copy; {{ date('Y') }} Sawit Lestari Group - My SLG HRIS System
            </p>
        </div>
    </div>
</body>
</html>