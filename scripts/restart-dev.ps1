# ポート3000を使用しているプロセスを探して終了
$port = 3000
Write-Host "Checking for processes on port $port..."
$tcpConnection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($tcpConnection) {
    # 複数の接続がある場合を考慮してループ処理
    foreach ($connection in $tcpConnection) {
        $processId = $connection.OwningProcess
        # システムアイドルプロセス(0)や自分自身でないことを確認
        if ($processId -gt 0 -and $processId -ne $PID) {
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Killing process on port $port (PID: $processId - $($process.ProcessName))..."
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
    # プロセス終了待ち
    Start-Sleep -Seconds 1
} else {
    Write-Host "No process found on port $port."
}

# ロックファイルの削除
$lockFile = ".next\dev\lock"
if (Test-Path $lockFile) {
    Write-Host "Removing lock file..."
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

# 開発サーバーの起動
Write-Host "Starting development server..."
npm run dev
