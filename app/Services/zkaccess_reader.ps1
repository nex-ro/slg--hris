param (
    [string]$Action = "get_logs",
    [string]$Ip = "192.168.87.201",
    [int]$Port = 4370,
    [string]$Date = "",
    [string]$StartDate = "",
    [string]$EndDate = "",
    [int]$Limit = 1000,
    [string]$DbPath = "C:\Program Files (x86)\ZKTeco\ZKAccess3.5\access.mdb",
    [string]$Password = "pwd"
)

$ErrorActionPreference = "SilentlyContinue"

# Helper untuk mengambil nama pegawai dari Access.mdb (sebagai mapping nama)
function Get-UserMapping {
    $userMap = @{}
    try {
        $conn = New-Object -ComObject ADODB.Connection
        $connStr = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$DbPath;Jet OLEDB:Database Password=$Password;"
        $conn.Open($connStr)
        $rs = $conn.Execute("SELECT Badgenumber, Name FROM USERINFO")
        while (-not $rs.EOF) {
            $b = [string]$rs.Fields.Item('Badgenumber').Value
            $n = [string]$rs.Fields.Item('Name').Value
            if ($b) { $userMap[$b] = $n }
            $rs.MoveNext()
        }
        $conn.Close()
    } catch {}
    return $userMap
}

# 1. Action: Test Connection
if ($Action -eq "test_connection") {
    $zkConnected = $false
    try {
        $zk = New-Object -ComObject zkemkeeper.ZKEM.1
        $null = $zk.SetCommPassword(0)
        $zkConnected = $zk.Connect_Net($Ip, $Port)
        if ($zkConnected) {
            $null = $zk.Disconnect()
        }
    } catch {}

    $devices = @(
        @{
            name = "Liberty Lt. 1 Front Office"
            ip = $Ip
            port = $Port
            online = $zkConnected
            mode = if ($zkConnected) { "Langsung ke Mesin (Direct Hardware)" } else { "Database ZKAccess 3.5" }
        }
    )

    @{
        status = "success"
        message = if ($zkConnected) { "Mesin fisik ${Ip}:${Port} ONLINE & terhubung langsung!" } else { "Terhubung melalui database ZKAccess 3.5 lokal" }
        devices = $devices
    } | ConvertTo-Json
    exit 0
}

# 2. Action: Get Logs Langsung dari Mesin Fisik ZKTeco
$machineLogs = @()
$directSuccess = $false

try {
    $zk = New-Object -ComObject zkemkeeper.ZKEM.1
    $null = $zk.SetCommPassword(0)
    if ($zk.Connect_Net($Ip, $Port)) {
        if ($zk.ReadGeneralLogData(1)) {
            $enrollNumber = ""; $verifyMode = 0; $inOutMode = 0
            $year = 0; $month = 0; $day = 0; $hour = 0; $minute = 0; $second = 0; $workCode = 0
            
            $userNames = Get-UserMapping

            while ($zk.SSR_GetGeneralLogData(1, [ref]$enrollNumber, [ref]$verifyMode, [ref]$inOutMode, [ref]$year, [ref]$month, [ref]$day, [ref]$hour, [ref]$minute, [ref]$second, [ref]$workCode)) {
                $logDate = ("{0:D4}-{1:D2}-{2:D2}" -f $year, $month, $day)
                
                # Filter tanggal: rentang StartDate-EndDate ATAU single Date
                $isMatch = $true
                if ($StartDate -ne "" -and $EndDate -ne "") {
                    if ($logDate -lt $StartDate -or $logDate -gt $EndDate) {
                        $isMatch = $false
                    }
                } elseif ($Date -ne "") {
                    if ($logDate -ne $Date) {
                        $isMatch = $false
                    }
                }

                if (-not $isMatch) {
                    continue
                }

                $formattedTime = ("{0:D4}-{1:D2}-{2:D2} {3:D2}:{4:D2}:{5:D2}" -f $year, $month, $day, $hour, $minute, $second)
                $pinStr = [string]$enrollNumber

                $machineLogs += [PSCustomObject]@{
                    pin = $pinStr
                    name = if ($userNames.ContainsKey($pinStr)) { $userNames[$pinStr] } else { "" }
                    checktime = $formattedTime
                    checktype = if ($inOutMode -eq 0) { "I" } else { "O" }
                    verifycode = [string]$verifyMode
                    source = "direct_machine"
                }
            }
            $directSuccess = $true
        }
        $null = $zk.Disconnect()
    }
} catch {
    $directSuccess = $false
}

# Jika penarikan langsung ke mesin berhasil, urutkan dan kembalikan datanya
if ($directSuccess) {
    # Urutkan berdasarkan checktime DESC (data terbaru di atas)
    $sortedLogs = $machineLogs | Sort-Object -Property checktime -Descending
    if ($Limit -gt 0 -and $sortedLogs.Count -gt $Limit) {
        $sortedLogs = $sortedLogs | Select-Object -First $Limit
    }

    @{
        status = "success"
        source = "direct_machine"
        device = "Liberty Lt. 1 Front Office (${Ip}:${Port})"
        count = $sortedLogs.Count
        date = if ($StartDate -ne "") { "$StartDate sd $EndDate" } else { $Date }
        data = @($sortedLogs)
    } | ConvertTo-Json -Depth 4
    exit 0
}

# 3. Fallback: Baca dari Access.mdb jika mesin fisik sedang offline / sibuk
try {
    $conn = New-Object -ComObject ADODB.Connection
    $connStr = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$DbPath;Jet OLEDB:Database Password=$Password;"
    $conn.Open($connStr)

    $sql = "SELECT "
    if ($Limit -gt 0) {
        $sql += "TOP $Limit "
    }
    $sql += "u.Badgenumber as pin, u.Name as name, c.CHECKTIME as checktime, c.CHECKTYPE as checktype, c.VERIFYCODE as verifycode "
    $sql += "FROM CHECKINOUT c "
    $sql += "INNER JOIN USERINFO u ON c.USERID = u.USERID "

    if ($StartDate -ne "" -and $EndDate -ne "") {
        $s = "$StartDate 00:00:00"
        $e = "$EndDate 23:59:59"
        $sql += "WHERE c.CHECKTIME >= #$s# AND c.CHECKTIME <= #$e# "
    } elseif ($Date -ne "") {
        $startDate = "$Date 00:00:00"
        $endDate = "$Date 23:59:59"
        $sql += "WHERE c.CHECKTIME >= #$startDate# AND c.CHECKTIME <= #$endDate# "
    }

    $sql += "ORDER BY c.CHECKTIME DESC"

    $rs = $conn.Execute($sql)
    $dbList = @()
    while (-not $rs.EOF) {
        $checkTimeVal = $rs.Fields.Item('checktime').Value
        $formattedTime = if ($checkTimeVal) { (Get-Date $checkTimeVal).ToString('yyyy-MM-dd HH:mm:ss') } else { "" }
        
        $dbList += @{
            pin = [string]$rs.Fields.Item('pin').Value
            name = [string]$rs.Fields.Item('name').Value
            checktime = $formattedTime
            checktype = [string]$rs.Fields.Item('checktype').Value
            verifycode = [string]$rs.Fields.Item('verifycode').Value
            source = "access_db"
        }
        $rs.MoveNext()
    }
    $conn.Close()

    @{
        status = "success"
        source = "access_db"
        count = $dbList.Count
        date = if ($StartDate -ne "") { "$StartDate sd $EndDate" } else { $Date }
        data = @($dbList)
    } | ConvertTo-Json -Depth 4
    exit 0
} catch {
    @{
        status = "error"
        message = $_.Exception.Message
    } | ConvertTo-Json
    exit 1
}
