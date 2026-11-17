<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Pemberitahuan Pelimpahan Tugas Cuti</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #1e40af;">Pemberitahuan Pelimpahan Tugas Cuti</h2>
    <p>Halo <strong>{{ $namaPenerima }}</strong>,</p>
    <p>
        Pengajuan cuti dari rekan kerja Anda, <strong>{{ $namaPemohon }}</strong>, telah disetujui. 
        Anda telah ditunjuk sebagai penerima tugas pengganti selama yang bersangkutan menjalani cuti.
    </p>

    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0;">
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="width: 35%;">Pemohon Cuti</th>
            <td><strong>{{ $namaPemohon }}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal Mulai Cuti</th>
            <td>{{ $tanggalMulai }}</td>
        </tr>
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Tanggal Selesai Cuti</th>
            <td>{{ $tanggalSelesai }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <th align="left">Durasi Cuti</th>
            <td>{{ $jumlahHari }}</td>
        </tr>
        @if(!empty($tugas))
        <tr style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
            <th align="left">Rincian Tugas yang Dilimpahkan</th>
            <td>{!! nl2br(e($tugas)) !!}</td>
        </tr>
        @endif
    </table>

    <p style="margin-top: 15px;">
        Mohon koordinasikan hal-hal mendesak atau pekerjaan yang perlu ditindaklanjuti dengan rekan yang bersangkutan sebelum tanggal cuti dimulai.
    </p>

    <p style="margin-top: 20px;">
        Terima kasih atas kerja samanya,<br>
        <strong>Sistem HRIS MY-SLG</strong>
    </p>
</body>
</html>
