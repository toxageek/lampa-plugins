package io.github.toxageek.lampavoice;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import java.lang.reflect.Method;
import java.util.List;

/** Экран настроек: проверка, выбор Lampa, режим, язык и инструкция по назначению ассистента. */
public final class SettingsActivity extends Activity {

    /** jsDelivr, а не raw.githubusercontent: тот отдаёт text/plain, и WebView не исполнит скрипт. */
    static final String PLUGIN_URL = "https://cdn.jsdelivr.net/gh/toxageek/lampa-plugins@master/voice-search.js";

    private Button target;
    private Button mode;
    private Button language;
    private TextView status;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        target = (Button) findViewById(R.id.btn_target);
        mode = (Button) findViewById(R.id.btn_mode);
        language = (Button) findViewById(R.id.btn_language);
        status = (TextView) findViewById(R.id.status);

        ((TextView) findViewById(R.id.setup)).setText(getString(R.string.setup_text, PLUGIN_URL, getPackageName()));

        findViewById(R.id.btn_test).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(SettingsActivity.this, VoiceActivity.class));
            }
        });
        target.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseTarget();
            }
        });
        mode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseMode();
            }
        });
        language.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseLanguage();
            }
        });

        findViewById(R.id.btn_test).requestFocus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private void refresh() {
        Prefs prefs = Prefs.of(this);

        String chosen = prefs.targetPackage();
        String targetText;
        if (chosen != null) {
            targetText = labelOf(chosen);
        } else {
            Targets.App detected = Targets.detectLampa(this);
            targetText = detected == null
                    ? getString(R.string.target_auto) + " — " + getString(R.string.target_none)
                    : getString(R.string.target_auto_found, detected.label);
        }
        target.setText(getString(R.string.btn_target, targetText));

        mode.setText(getString(R.string.btn_mode, getString(
                prefs.mode() == Prefs.Mode.LAMPA ? R.string.mode_lampa : R.string.mode_ask)));

        language.setText(getString(R.string.btn_language, languageName(prefs.language())));

        Boolean assistant = isAssistant();
        status.setText(getString(assistant == null ? R.string.status_assistant_unknown
                : assistant ? R.string.status_assistant_yes : R.string.status_assistant_no)
                + "\n" + getString(KeyService.isEnabled(this) ? R.string.status_key_yes : R.string.status_key_no));
    }

    private void chooseTarget() {
        final List<Targets.App> apps = Targets.launchableApps(this);
        String chosen = Prefs.of(this).targetPackage();

        String[] items = new String[apps.size() + 1];
        items[0] = getString(R.string.target_auto);
        int checked = 0;
        for (int i = 0; i < apps.size(); i++) {
            Targets.App app = apps.get(i);
            items[i + 1] = app.label + "  (" + app.packageName + ")";
            if (app.packageName.equals(chosen)) checked = i + 1;
        }

        builder().setTitle(R.string.target_title)
                .setSingleChoiceItems(items, checked, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int which) {
                        Prefs.of(SettingsActivity.this).setTargetPackage(which == 0 ? null : apps.get(which - 1).packageName);
                        d.dismiss();
                        refresh();
                    }
                })
                .show();
    }

    private void chooseMode() {
        String[] items = {getString(R.string.mode_ask), getString(R.string.mode_lampa)};
        int checked = Prefs.of(this).mode() == Prefs.Mode.LAMPA ? 1 : 0;

        builder().setSingleChoiceItems(items, checked, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface d, int which) {
                Prefs.of(SettingsActivity.this).setMode(which == 1 ? Prefs.Mode.LAMPA : Prefs.Mode.ASK);
                d.dismiss();
                refresh();
            }
        }).show();
    }

    private void chooseLanguage() {
        String current = Prefs.of(this).language();
        String[] items = new String[Prefs.LANGUAGES.length];
        int checked = 0;
        for (int i = 0; i < items.length; i++) {
            items[i] = languageName(Prefs.LANGUAGES[i]);
            if (Prefs.LANGUAGES[i].equals(current)) checked = i;
        }

        builder().setSingleChoiceItems(items, checked, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface d, int which) {
                Prefs.of(SettingsActivity.this).setLanguage(Prefs.LANGUAGES[which]);
                d.dismiss();
                refresh();
            }
        }).show();
    }

    private String languageName(String code) {
        for (int i = 0; i < Prefs.LANGUAGES.length; i++) {
            if (Prefs.LANGUAGES[i].equals(code) && Prefs.LANGUAGE_NAMES[i] != null) return Prefs.LANGUAGE_NAMES[i];
        }
        return getString(R.string.lang_system);
    }

    private String labelOf(String pkg) {
        for (Targets.App app : Targets.launchableApps(this)) {
            if (app.packageName.equals(pkg)) return app.label;
        }
        return pkg + " — " + getString(R.string.target_none);
    }

    /**
     * RoleManager появился в Android 10 (API 29), а компилируем под API 23 —
     * поэтому рефлексия. {@code null} — проверить нельзя.
     */
    private Boolean isAssistant() {
        if (Build.VERSION.SDK_INT < 29) return null;
        try {
            Object roleManager = getSystemService("role");
            if (roleManager == null) return null;
            Method isRoleHeld = roleManager.getClass().getMethod("isRoleHeld", String.class);
            return (Boolean) isRoleHeld.invoke(roleManager, "android.app.role.ASSISTANT");
        } catch (ReflectiveOperationException | RuntimeException e) {
            return null;
        }
    }

    @SuppressWarnings("deprecation")
    private AlertDialog.Builder builder() {
        return new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK);
    }
}
