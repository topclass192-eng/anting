$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
$env:FIREBASE_IGNORE_ENGINES = "1"
cd functions
# build before executing inside emulator just in case
npx tsc
npx tsx ../scripts/testAuthFlow.ts
