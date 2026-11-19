package io.github.toxageek.lampavoice;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.SearchManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.Toast;

import java.util.ArrayList;

/**
 * Точка входа кнопки микрофона: распознать фразу -> спросить, где искать -> отправить.
 *
 * Распознаёт не сама, а через системный {@link RecognizerIntent} (на Google TV это экран Google):
 * так работает микрофон пульта, не нужно разрешение RECORD_AUDIO и качество то же, что у ассистента.
 */
public final class VoiceActivity extends Activity {

    /** Пакет приложения, из которого нажали микрофон (передаёт {@link KeyService}). */
    static final String EXTRA_SOURCE = "io.github.toxageek.lampavoice.SOURCE";

    private static final int REQUEST_SPEECH = 1;
    private static final int MAX_QUERY = 200;
    private static final String STATE_WAITING = "waiting_speech";
    private static final String STATE_SOURCE = "source";

    /** Ждём результат распознавания — после поворота/пересоздания не запускаем его второй раз. */
    private boolean waitingSpeech;
    private String source;
    private AlertDialog dialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) {
            waitingSpeech = savedInstanceState.getBoolean(STATE_WAITING, false);
            source = savedInstanceState.getString(STATE_SOURCE);
            if (!waitingSpeech) finish();
            return;
        }
        handle(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        dismissDialog();
        handle(intent);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean(STATE_WAITING, waitingSpeech);
        outState.putString(STATE_SOURCE, source);
    }

    @Override
    protected void onDestroy() {
        dismissDialog();
        super.onDestroy();
    }

    private void handle(Intent intent) {
        source = intent == null ? null : intent.getStringExtra(EXTRA_SOURCE);
        String query = extractQuery(intent);
        if (query != null) onQuery(query);
        else startRecognition();
    }

    /** Фраза может прийти готовой: от ассистента, adb или другого приложения. */
    private static String extractQuery(Intent intent) {
        if (intent == null) return null;
        String[] keys = {SearchManager.QUERY, SearchManager.USER_QUERY, Intent.EXTRA_TEXT};
        for (String key : keys) {
            String value = clean(intent.getStringExtra(key));
            if (value != null) return value;
        }
        return null;
    }

    /** Схлопываем пробелы, убираем управляющие символы, режем длину. {@code null} — пусто. */
    private static String clean(CharSequence raw) {
        if (raw == null) return null;
        String value = raw.toString().replaceAll("[\\p{Cntrl}\\s]+", " ").trim();
        if (value.length() > MAX_QUERY) value = value.substring(0, MAX_QUERY).trim();
        return value.isEmpty() ? null : value;
    }

    /* ------------------------------------------------------------------ *
     * Распознавание
     * ------------------------------------------------------------------ */

    private void startRecognition() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                // Модель веб-поиска лучше узнаёт названия фильмов, чем свободная речь.
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_WEB_SEARCH)
                .putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.speech_prompt))
                .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        String language = Prefs.of(this).language();
        if (!language.isEmpty()) {
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
        }

        ComponentName recognizer = intent.resolveActivity(getPackageManager());
        if (recognizer == null || recognizer.getPackageName().equals(getPackageName())) {
            askText();
            return;
        }

        try {
            waitingSpeech = true;
            startActivityForResult(intent, REQUEST_SPEECH);
        } catch (ActivityNotFoundException | SecurityException e) {
            waitingSpeech = false;
            askText();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_SPEECH) return;
        waitingSpeech = false;

        String query = null;
        if (resultCode == RESULT_OK && data != null) {
            ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (results != null) {
                for (String result : results) {
                    query = clean(result);
                    if (query != null) break;
                }
            }
        }

        if (query == null) finish();
        else onQuery(query);
    }

    /** Запасной путь, если на устройстве нет распознавателя: ввод с клавиатуры. */
    private void askText() {
        final EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        input.setImeOptions(EditorInfo.IME_ACTION_SEARCH);

        dialog = builder()
                .setTitle(R.string.type_title)
                .setView(input)
                .setPositiveButton(R.string.type_ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int which) {
                        String query = clean(input.getText());
                        if (query == null) finish();
                        else onQuery(query);
                    }
                })
                .setNegativeButton(R.string.cancel, finishOnClick())
                .setOnCancelListener(finishOnCancel())
                .create();
        dialog.show();
    }

    /* ------------------------------------------------------------------ *
     * Выбор и отправка
     * ------------------------------------------------------------------ */

    private void onQuery(String query) {
        // Нажали микрофон в YouTube / Twitch / Lampa — ищем там же, без вопроса.
        if (source != null && source.equals(Targets.lampaPackage(this))) sendToLampa(query);
        else if (source != null && Targets.searchIn(this, source, query)) finish();
        else if (Prefs.of(this).mode() == Prefs.Mode.LAMPA) sendToLampa(query);
        else choose(query);
    }

    private void choose(final String query) {
        String[] items = {
                getString(R.string.choose_lampa),
                getString(R.string.choose_youtube),
                getString(R.string.choose_google),
                getString(R.string.choose_again),
        };

        dialog = builder()
                .setTitle("«" + query + "»")
                .setItems(items, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int which) {
                        switch (which) {
                            case 0:
                                sendToLampa(query);
                                break;
                            case 1:
                                if (!Targets.openYouTube(VoiceActivity.this, query)) toast(getString(R.string.err_no_youtube));
                                finish();
                                break;
                            case 2:
                                if (!Targets.openGoogle(VoiceActivity.this, query)) toast(getString(R.string.err_no_google));
                                finish();
                                break;
                            default:
                                startRecognition();
                                break;
                        }
                    }
                })
                .setOnCancelListener(finishOnCancel())
                .create();
        dialog.show();
    }

    private void sendToLampa(String query) {
        String pkg = Targets.lampaPackage(this);
        if (pkg == null) {
            toast(getString(R.string.err_no_lampa));
            startActivity(new Intent(this, SettingsActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            finish();
            return;
        }

        // Сначала сервер (пока мы на переднем плане — фоновый запуск сервиса запрещён), потом Lampa.
        HandoffService.deliver(this, query);
        if (!Targets.openLampa(this, pkg)) toast(getString(R.string.err_open_failed, pkg));
        finish();
    }

    /* ------------------------------------------------------------------ *
     * Мелочи
     * ------------------------------------------------------------------ */

    @SuppressWarnings("deprecation")
    private AlertDialog.Builder builder() {
        // THEME_DEVICE_DEFAULT_DARK — тёмный системный диалог на всех версиях от Android 5.
        return new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK);
    }

    private DialogInterface.OnClickListener finishOnClick() {
        return new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface d, int which) {
                finish();
            }
        };
    }

    private DialogInterface.OnCancelListener finishOnCancel() {
        return new DialogInterface.OnCancelListener() {
            @Override
            public void onCancel(DialogInterface d) {
                finish();
            }
        };
    }

    private void dismissDialog() {
        if (dialog != null && dialog.isShowing()) dialog.dismiss();
        dialog = null;
    }

    private void toast(String text) {
        Toast.makeText(getApplicationContext(), text, Toast.LENGTH_LONG).show();
    }
}
