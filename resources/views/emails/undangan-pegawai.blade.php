<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Undangan Bergabung MY-SLG</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
            background-color: #f7f9fa;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #ffffff;
            padding: 28px 24px;
            text-align: center;
        }
        .header h2 {
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 24px;
            line-height: 1.6;
        }
        .btn-wrapper {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff !important;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            padding: 14px 28px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(37,99,235,0.3);
        }
        .info-box {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 12px 16px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 13px;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 16px 24px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Selamat Datang di MY-SLG</h2>
            <p>Sistem Informasi Human Resource &bull; Sawit Lestari Group</p>
        </div>

        <div class="content">
            <p>Halo <strong>{{ $namaPegawai }}</strong>,</p>
            <p>
                Anda telah didaftarkan ke dalam sistem informasi kepegawaian <strong>MY-SLG (Sawit Lestari Group)</strong>.
            </p>

            <div class="info-box">
                <strong>Detail Akun Anda:</strong><br>
                &bull; Email: <strong>{{ $emailPegawai }}</strong><br>
                &bull; Divisi: <strong>{{ $divisi }}</strong><br>
                &bull; Jabatan: <strong>{{ $jabatan }}</strong>
            </div>

            <p>
                Untuk mulai menggunakan akun Anda (mengakses absensi, perizinan, cuti, dinas luar, dll.), silakan klik tombol di bawah ini untuk <strong>membuat password baru</strong> Anda:
            </p>

            <div class="btn-wrapper">
                <a href="{{ $activationUrl }}" class="btn" target="_blank">
                    Buat Password &amp; Aktivasi Akun
                </a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
                Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke browser Anda:<br>
                <a href="{{ $activationUrl }}" style="color: #2563eb; word-break: break-all;">{{ $activationUrl }}</a>
            </p>

            <p style="font-size: 12px; color: #dc2626; margin-top: 15px;">
                * Link ini bersifat rahasia dan aman. Harap segera lakukan aktivasi pembuatan password.
            </p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} Sawit Lestari Group. Seluruh hak cipta dilindungi undang-undang.
        </div>
    </div>
</body>
</html>
