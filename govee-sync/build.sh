#!/usr/bin/env bash
# Сборка APK без Gradle/Android Studio: aapt -> javac -> d8/dx -> apksigner.
#
# В Android Studio просто откройте папку govee-sync/ — build.sh не нужен.
#
# Инструменты берутся из $ANDROID_HOME (или ~/Library/Android/sdk / ~/Android/Sdk),
# любой можно переопределить переменной окружения:
#   ANDROID_JAR  — android.jar
#   AAPT         — aapt (v1)
#   D8           — d8 из build-tools (или DX_JAR — dx.jar)
#   APKSIGNER    — apksigner (или APKSIGNER_CP)
#   KEYSTORE / KEYSTORE_PASS / KEY_ALIAS — ключ подписи (по умолчанию signing/govee-sync.keystore)
#
# Результат: ../govee-sync.apk (корень репозитория).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/app/src/main"
OUT_APK="${OUT_APK:-$(cd "$HERE/.." && pwd)/govee-sync.apk}"
BUILD="$HERE/build"

PACKAGE="io.github.toxageek.goveesync"
VERSION_CODE="$(sed -n 's/.*versionCode = \([0-9]*\).*/\1/p' "$HERE/app/build.gradle.kts")"
VERSION_NAME="$(sed -n 's/.*versionName = "\([^"]*\)".*/\1/p' "$HERE/app/build.gradle.kts")"
MIN_SDK=21
TARGET_SDK=34

KEYSTORE="${KEYSTORE:-$HERE/signing/govee-sync.keystore}"
KEYSTORE_PASS="${KEYSTORE_PASS:-goveesync}"
KEY_ALIAS="${KEY_ALIAS:-goveesync}"

latest() { ls -1d "$1"/* 2>/dev/null | sort -V | tail -n 1; }

if [[ -z "${ANDROID_HOME:-}" ]]; then
    if [[ -d "$HOME/Library/Android/sdk" ]]; then
        ANDROID_HOME="$HOME/Library/Android/sdk"
    elif [[ -d "$HOME/Android/Sdk" ]]; then
        ANDROID_HOME="$HOME/Android/Sdk"
    fi
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
    for candidate in /opt/homebrew/opt/openjdk@17 /opt/homebrew/opt/openjdk /usr/local/opt/openjdk@17; do
        if [[ -x "$candidate/bin/javac" ]]; then
            export JAVA_HOME="$candidate"
            export PATH="$JAVA_HOME/bin:$PATH"
            break
        fi
    done
elif [[ -x "$JAVA_HOME/bin/javac" ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
    BT="$(latest "$ANDROID_HOME/build-tools")"
    : "${ANDROID_JAR:=$(latest "$ANDROID_HOME/platforms")/android.jar}"
    : "${AAPT:=$BT/aapt}"
    [[ -x "$BT/d8" ]] && : "${D8:=$BT/d8}"
    : "${APKSIGNER:=$BT/apksigner}"
fi

for v in ANDROID_JAR AAPT; do
    [[ -n "${!v:-}" && -e "${!v}" ]] || { echo "Не найден $v (задайте ANDROID_HOME или $v)" >&2; exit 1; }
done
[[ -n "${D8:-}" || -n "${DX_JAR:-}" ]] || { echo "Нужен D8 или DX_JAR" >&2; exit 1; }
[[ -n "${APKSIGNER:-}" || -n "${APKSIGNER_CP:-}" ]] || { echo "Нужен APKSIGNER или APKSIGNER_CP" >&2; exit 1; }
[[ -n "$VERSION_CODE" && -n "$VERSION_NAME" ]] || { echo "Не прочитана версия из app/build.gradle.kts" >&2; exit 1; }

echo "Govee TV Sync $VERSION_NAME ($VERSION_CODE)"
rm -rf "$BUILD"
mkdir -p "$BUILD/gen" "$BUILD/classes"

# 1. Манифест: подставляем package / версии (в Gradle-проекте их задаёт app/build.gradle.kts).
sed -e "s|<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">|<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\"$PACKAGE\" android:versionCode=\"$VERSION_CODE\" android:versionName=\"$VERSION_NAME\">\n    <uses-sdk android:minSdkVersion=\"$MIN_SDK\" android:targetSdkVersion=\"$TARGET_SDK\" />|" \
    "$SRC/AndroidManifest.xml" > "$BUILD/AndroidManifest.xml"
grep -q "package=\"$PACKAGE\"" "$BUILD/AndroidManifest.xml" || { echo "Не удалось подставить package в манифест" >&2; exit 1; }

# 2. Ресурсы + R.java. resources.arsc не сжимаем: Android 11+ требует его несжатым.
"$AAPT" package -f -m \
    -M "$BUILD/AndroidManifest.xml" \
    -S "$SRC/res" \
    -I "$ANDROID_JAR" \
    -J "$BUILD/gen" \
    -0 arsc \
    -F "$BUILD/unsigned.apk"

# 3. Java 8 байткод без лямбд (совместимость со старым dx и новыми d8).
find "$SRC/java" "$BUILD/gen" -name '*.java' > "$BUILD/sources.txt"
javac -nowarn -Xlint:-options -encoding UTF-8 -source 8 -target 8 \
    -bootclasspath "$ANDROID_JAR" \
    -d "$BUILD/classes" @"$BUILD/sources.txt"

# 4. DEX.
if [[ -n "${D8:-}" ]]; then
    "$D8" --release --min-api "$MIN_SDK" --lib "$ANDROID_JAR" --output "$BUILD" $(find "$BUILD/classes" -name '*.class')
else
    java -jar "$DX_JAR" --dex --min-sdk-version="$MIN_SDK" --output="$BUILD/classes.dex" "$BUILD/classes"
fi

# 5. Кладём classes.dex в APK.
(cd "$BUILD" && zip -q -9 unsigned.apk classes.dex)

# 6. Выравнивание несжатых файлов — до подписи.
if [[ -n "${BT:-}" && -x "$BT/zipalign" ]]; then
    "$BT/zipalign" -p -f 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"
else
    python3 "$HERE/tools/zipalign.py" "$BUILD/unsigned.apk" "$BUILD/aligned.apk"
fi

# 7. Подпись v1+v2+v3.
if [[ ! -f "$KEYSTORE" ]]; then
    echo "Создаю ключ подписи $KEYSTORE"
    mkdir -p "$(dirname "$KEYSTORE")"
    keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 \
        -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" -alias "$KEY_ALIAS" \
        -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Govee TV Sync" >/dev/null
fi

sign() {
    if [[ -n "${APKSIGNER:-}" ]]; then "$APKSIGNER" "$@"
    else java -cp "$APKSIGNER_CP" com.android.apksigner.ApkSignerTool "$@"; fi
}

sign sign --ks "$KEYSTORE" --ks-pass "pass:$KEYSTORE_PASS" --ks-key-alias "$KEY_ALIAS" \
    --v4-signing-enabled false \
    --min-sdk-version "$MIN_SDK" --out "$OUT_APK" "$BUILD/aligned.apk"
sign verify --min-sdk-version "$MIN_SDK" "$OUT_APK"
python3 "$HERE/tools/zipalign.py" --check "$OUT_APK"

echo "Готово: $OUT_APK ($(wc -c < "$OUT_APK") байт)"
