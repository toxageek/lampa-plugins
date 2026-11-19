package io.github.toxageek.lampavoice;

import android.app.SearchManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.util.Log;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Куда отправить распознанную фразу: Lampa, YouTube, Google. */
final class Targets {

    private static final String TAG = "LampaVoice";

    private static final String[] YOUTUBE_PACKAGES = {
            "com.google.android.youtube.tv",
            "com.google.android.youtube.googletv",
            "com.google.android.youtube",
    };

    /** Katniss — Google Assistant/поиск на Android TV и Google TV; второе — Google на телефоне. */
    private static final String[] GOOGLE_PACKAGES = {
            "com.google.android.katniss",
            "com.google.android.googlequicksearchbox",
    };

    private Targets() {
    }

    /** Запускаемое приложение для списка выбора в настройках. */
    static final class App {
        final String packageName;
        final String label;

        App(String packageName, String label) {
            this.packageName = packageName;
            this.label = label;
        }
    }

    /** Все приложения с иконкой в лаунчере (ТВ или обычном), кроме нас, по алфавиту. */
    static List<App> launchableApps(Context context) {
        PackageManager pm = context.getPackageManager();
        Map<String, App> byPackage = new LinkedHashMap<>();

        String[] categories = {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
        for (String category : categories) {
            Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
            List<ResolveInfo> found = pm.queryIntentActivities(query, 0);
            for (ResolveInfo info : found) {
                String pkg = info.activityInfo.packageName;
                if (pkg.equals(context.getPackageName()) || byPackage.containsKey(pkg)) continue;
                CharSequence label = info.loadLabel(pm);
                byPackage.put(pkg, new App(pkg, label == null ? pkg : label.toString()));
            }
        }

        List<App> apps = new ArrayList<>(byPackage.values());
        Collections.sort(apps, new Comparator<App>() {
            @Override
            public int compare(App a, App b) {
                return a.label.compareToIgnoreCase(b.label);
            }
        });
        return apps;
    }

    /**
     * Ищем Lampa по имени, а не по захардкоженному пакету: у официального APK,
     * RuStore-версии и форков пакеты разные, а название везде содержит «lampa».
     * Точное совпадение названия важнее частичного.
     */
    static App detectLampa(Context context) {
        App partial = null;
        for (App app : launchableApps(context)) {
            String label = app.label.trim().toLowerCase(Locale.ROOT);
            if (label.equals("lampa")) return app;
            if (partial == null && (label.contains("lampa") || app.packageName.toLowerCase(Locale.ROOT).contains("lampa"))) {
                partial = app;
            }
        }
        return partial;
    }

    /** Выбранный вручную пакет, если он ещё установлен, иначе — автоопределение. */
    static String lampaPackage(Context context) {
        String chosen = Prefs.of(context).targetPackage();
        if (chosen != null && launchIntent(context, chosen) != null) return chosen;
        App detected = detectLampa(context);
        return detected == null ? null : detected.packageName;
    }

    /**
     * Интент запуска из лаунчера. Без CLEAR_TASK: уже запущенная Lampa
     * просто выйдет на передний план, а не перезапустится.
     */
    static Intent launchIntent(Context context, String pkg) {
        PackageManager pm = context.getPackageManager();
        Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (intent == null) intent = pm.getLaunchIntentForPackage(pkg);
        if (intent != null) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return intent;
    }

    static boolean openLampa(Context context, String pkg) {
        Intent intent = launchIntent(context, pkg);
        return intent != null && start(context, intent);
    }

    static boolean openYouTube(Context context, String query) {
        Uri results = Uri.parse("https://www.youtube.com/results").buildUpon()
                .appendQueryParameter("search_query", query)
                .build();

        for (String pkg : YOUTUBE_PACKAGES) {
            // Сначала «родной» поиск приложения, затем ссылка на страницу результатов.
            Intent search = new Intent(Intent.ACTION_SEARCH)
                    .setPackage(pkg)
                    .putExtra(SearchManager.QUERY, query)
                    .putExtra("query", query);
            if (startIfResolvable(context, search)) return true;

            Intent view = new Intent(Intent.ACTION_VIEW, results).setPackage(pkg);
            if (startIfResolvable(context, view)) return true;
        }
        return false;
    }

    /**
     * Отдаём текст в Google: на Google TV это тот же экран результатов, что и раньше
     * (включая YouTube), только фраза уже распознана и повторять её не нужно.
     * Пакет указываем явно: если ассистент по умолчанию — мы, неявный интент вернулся бы к нам.
     */
    static boolean openGoogle(Context context, String query) {
        for (String pkg : GOOGLE_PACKAGES) {
            Intent web = new Intent(Intent.ACTION_WEB_SEARCH)
                    .setPackage(pkg)
                    .putExtra(SearchManager.QUERY, query);
            if (startIfResolvable(context, web)) return true;

            Intent search = new Intent(Intent.ACTION_SEARCH)
                    .setPackage(pkg)
                    .putExtra(SearchManager.QUERY, query);
            if (startIfResolvable(context, search)) return true;
        }
        for (String pkg : GOOGLE_PACKAGES) {
            Intent assist = new Intent(Intent.ACTION_ASSIST).setPackage(pkg);
            if (startIfResolvable(context, assist)) return true;
        }
        return false;
    }

    private static boolean startIfResolvable(Context context, Intent intent) {
        ComponentName component = intent.resolveActivity(context.getPackageManager());
        if (component == null || component.getPackageName().equals(context.getPackageName())) return false;
        intent.setComponent(component);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return start(context, intent);
    }

    private static boolean start(Context context, Intent intent) {
        try {
            context.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            Log.w(TAG, "start failed: " + intent, e);
            return false;
        }
    }
}
