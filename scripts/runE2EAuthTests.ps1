$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
$env:FIREBASE_IGNORE_ENGINES = "1"
$env:FUNCTIONS_EMULATOR = "true"
cd functions
npx tsc
npx tsx ../scripts/testE2EAuthFlow.ts
