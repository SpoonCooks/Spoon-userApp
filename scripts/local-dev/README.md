# Local development against the real backend

Everything needed to run the Spoon API locally and exercise the app against it. This exists
because rediscovering it costs an afternoon — the first two integration sessions both spent one.

**Nothing here edits `D:\spoon-backend`.** That repo's `.env` points `DATABASE_URL` at a hosted
Supabase pooler and carries live credentials. Its own loader uses `dotenv` with `override: false`
and documents that existing environment variables win, so the process environment is the
sanctioned override seam.

## 1. Infrastructure

A native PostgreSQL and Redis already hold 5432/6379 on this machine, so the repo's compose stack
runs on the offset ports its own header documents:

```sh
printf 'POSTGRES_HOST_PORT=5433\nREDIS_HOST_PORT=6380\n' > /tmp/compose.env
cd /d/spoon-backend && docker compose --env-file /tmp/compose.env up -d
```

Pass `--env-file`: `docker compose` otherwise reads the backend's `.env` for substitution and
chokes on its multi-line `FCM_SERVICE_ACCOUNT_JSON`, and it has no business reading that file.

## 2. The API

```sh
cd /d/spoon-backend
. /d/spoon-frontend/scripts/local-dev/backend-env.sh
npm run migrate:up      # idempotent; all 28 migrations are usually already applied
npx tsx src/api/server.ts
```

`/health/live` and `/health/ready` should both answer, with postgres, postgis and redis healthy.

`backend-env.sh` overrides only what has to change. Read its comments before adding to it — in
particular, `RAZORPAY_KEY_ID`/`KEY_SECRET` are deliberately NOT overridden, because the repo's
own values are an `rzp_test` sandbox pair and using them is the only way to prove the payment
order contract.

## 3. A cook on duty

Availability answers `NO_PRESENT_COOK` against a fresh database, because nobody is rostered:

```sh
docker exec -i spoon-postgres psql -U spoon -d spoon < scripts/local-dev/seed-present-cook.sql
```

This is test DATA, not a test double. Every row satisfies the same conditions the real candidate
query checks, and the real matcher then runs against them. See the script's own header.

Note the constraints `cook_shifts` enforces, which are easy to trip over: a shift is **exactly 12
hours**, starts on the hour between **05:00 and 10:00**, and has a **2-hour break inside
11:00–16:00**.

## 4. The live suite

```sh
SPOON_E2E=1 npx jest --config jest.e2e.config.js
```

Deliberately outside `npm test` so the ordinary gates never need a server. Point it elsewhere
with `SPOON_E2E_BASE`.

## 5. The device

`EXPO_PUBLIC_API_BASE_URL` is read by `app.config.ts` and **embedded into the APK at build time**,
so pointing the app somewhere new needs a REBUILD, not just a Metro restart. This is what defect
FE-5 turned on: an installed APK carried a stale `api.spoon.invalid` and every device observation
made before the rebuild was of an app talking to a host that does not exist.

```sh
cd android
JAVA_HOME='C:/Program Files/Android/Android Studio/jbr' \
  EXPO_PUBLIC_API_BASE_URL=http://<host-lan-ip>:3000 ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Gradle needs JVM 17+; the machine's default `JAVA_HOME` is JVM 8 and Android Studio's bundled JBR
(21) works. The debug manifest already allows cleartext traffic.

`android/` is gitignored and generated. After changing a config plugin in `app.config.ts`, run
`npx expo prebuild --platform android --clean` first — and note that `--clean` deletes
`local.properties`, which must then be recreated:

```
sdk.dir=C\:/Users/<you>/AppData/Local/Android/Sdk
```

Forward slashes. Java properties treat a lone backslash as an escape, so the Windows-style path
silently becomes `C:UsersYou...` and Gradle fails with "Invalid file path".
