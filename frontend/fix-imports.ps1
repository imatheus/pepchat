
# Script para corrigir importações que ainda referenciam .js para .jsx
param(
    [string]$SourcePath = ".\src",
    [switch]$DryRun = $false
)

Write-Host "Corrigindo importações .js para .jsx..." -ForegroundColor Green
Write-Host "Diretório: $SourcePath" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "MODO DRY RUN - Nenhum arquivo será modificado" -ForegroundColor Cyan
}

# Encontrar todos os arquivos .jsx
$jsxFiles = Get-ChildItem -Path $SourcePath -Filter "*.jsx" -Recurse | Where-Object { 
    -not $_.PSIsContainer 
}

$fixedCount = 0
$errorCount = 0

foreach ($file in $jsxFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Padrões de importação para corrigir
        $patterns = @(
            @{ Pattern = 'from\s+["\''](\.\.?/[^"'']*?)\.js["\''']'; Replacement = 'from "$1.jsx"' },
            @{ Pattern = 'from\s+["\''](\./[^"'']*?)\.js["\''']'; Replacement = 'from "$1.jsx"' }
        )
        
        $hasChanges = $false
        
        foreach ($patternInfo in $patterns) {
            if ($content -match $patternInfo.Pattern) {
                $content = $content -replace $patternInfo.Pattern, $patternInfo.Replacement
                $hasChanges = $true
            }
        }
        
        if ($hasChanges) {
            if ($DryRun) {
                Write-Host "  WOULD FIX: $relativePath" -ForegroundColor Cyan
            } else {
                Set-Content -Path $file.FullName -Value $content -ErrorAction Stop
                Write-Host "  FIXED: $relativePath" -ForegroundColor Green
            }
            $fixedCount++
        }
    }
    catch {
        Write-Error "Erro ao processar $relativePath : $_"
        $errorCount++
    }
}

Write-Host "`nResumo:" -ForegroundColor Yellow
Write-Host "  Arquivos corrigidos: $fixedCount" -ForegroundColor Green
Write-Host "  Erros: $errorCount" -ForegroundColor Red

if ($DryRun) {
    Write-Host "`nPara executar as correções, execute novamente sem o parâmetro -DryRun" -ForegroundColor Cyan
} else {
    Write-Host "`nCorreção de importações concluída!" -ForegroundColor Green
}