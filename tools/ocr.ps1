param([int]$Offset = 0, [int]$Stride = 1, [int]$Limit = 0, [string]$InputFile = 'ocr-input.json')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await($Operation, [Type]$Type) {
    $task = $asTask.MakeGenericMethod($Type).Invoke($null, @($Operation))
    $task.Wait()
    $task.Result
}
$root = Split-Path -Parent $PSScriptRoot
$items = Get-Content -LiteralPath (Join-Path $root ('.work\'+$InputFile)) -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir=Join-Path $root '.work\ocr'
$null=New-Item -ItemType Directory -Path $outDir -Force
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('zh-Hans-CN'))
$stopwatch=[Diagnostics.Stopwatch]::StartNew()
$done=0
for ($idx=$Offset; $idx -lt $items.Count; $idx+=$Stride) {
    $item=$items[$idx]
    $out=Join-Path $outDir ($item.id+'.json')
    if (Test-Path -LiteralPath $out) { continue }
    try {
        $file=Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($item.path)) ([Windows.Storage.StorageFile])
        $stream=Await ($file.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
        $decoder=Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap=Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $result=Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
        $lines=@($result.Lines | ForEach-Object {
            $words=@($_.Words | ForEach-Object { @{text=$_.Text;x=$_.BoundingRect.X;y=$_.BoundingRect.Y;w=$_.BoundingRect.Width;h=$_.BoundingRect.Height} })
            @{text=$_.Text;words=$words}
        })
        @{id=$item.id;text=$result.Text;lines=$lines} | ConvertTo-Json -Depth 8 -Compress | Set-Content -LiteralPath $out -Encoding UTF8
        $bitmap.Dispose();$stream.Dispose()
    } catch {
        Write-Output "OCR_ERROR $($item.id): $_"
    }
    $done++
    if ($done%50 -eq 0) { Write-Output "OCR worker $Offset completed $done in $([int]$stopwatch.Elapsed.TotalSeconds)s" }
    if ($Limit -gt 0 -and $done -ge $Limit) { break }
}
Write-Output "OCR worker $Offset finished $done in $([int]$stopwatch.Elapsed.TotalSeconds)s"
