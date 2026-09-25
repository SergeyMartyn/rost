Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot '..\public'
$sourcePath = Join-Path $publicDir 'brand-tree.png'
$source = [System.Drawing.Image]::FromFile($sourcePath)
$pngs = @()

try {
  $mark = [System.Drawing.Bitmap]::new(96, 96)
  $markGraphics = [System.Drawing.Graphics]::FromImage($mark)
  try {
    $markGraphics.Clear([System.Drawing.Color]::Transparent)
    $markGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $markGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $markGraphics.DrawImage($source, 0, 0, 96, 96)
    $mark.Save((Join-Path $publicDir 'brand-tree-96.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $markGraphics.Dispose()
    $mark.Dispose()
  }

  foreach ($size in @(32, 48, 180)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#214C3F'))
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.Clear([System.Drawing.Color]::Transparent)
      if ($size -eq 180) {
        $graphics.FillRectangle($brush, 0, 0, $size, $size)
      } else {
        $graphics.FillEllipse($brush, 0, 0, $size - 1, $size - 1)
      }
      $padding = [Math]::Round($size * 0.1)
      $graphics.DrawImage($source, $padding, $padding, $size - 2 * $padding, $size - 2 * $padding)
      $name = if ($size -eq 180) { 'apple-touch-icon.png' } else { "favicon-$size.png" }
      $path = Join-Path $publicDir $name
      $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
      if ($size -ne 180) { $pngs += [pscustomobject]@{ Size = $size; Path = $path } }
    } finally {
      $brush.Dispose()
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  $source.Dispose()
}

$icoPath = Join-Path $publicDir 'favicon.ico'
$writer = [System.IO.BinaryWriter]::new([System.IO.File]::Create($icoPath))
try {
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]$pngs.Count)
  $offset = 6 + 16 * $pngs.Count
  $entries = foreach ($png in $pngs) {
    $bytes = [System.IO.File]::ReadAllBytes($png.Path)
    $writer.Write([Byte]$png.Size)
    $writer.Write([Byte]$png.Size)
    $writer.Write([Byte]0)
    $writer.Write([Byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$bytes.Length)
    $writer.Write([UInt32]$offset)
    $offset += $bytes.Length
    ,$bytes
  }
  foreach ($bytes in $entries) { $writer.Write([Byte[]]$bytes) }
} finally {
  $writer.Dispose()
}
