$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
$env:FIREBASE_IGNORE_ENGINES = "1"
cd functions
npx tsc
npx tsx ../scripts/testSocialLogin.ts
