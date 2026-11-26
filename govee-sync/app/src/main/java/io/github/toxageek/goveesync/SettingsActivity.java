package io.github.toxageek.goveesync;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.util.List;

/**
 * Экран настроек Govee TV Sync.
 * Поддерживает управление пультом ТВ, быструю настройку через локальную веб-страницу
 * с телефона/ПК и передачу параметров через adb (extras: api_key, sku, device, device_name).
 */
public final class SettingsActivity extends Activity {

    private static final String TAG = "GoveeSync";

    private Button btnSync;
    private Button btnApiKey;
    private Button btnDevice;
    private Button btnDream;
    private Button btnBoot;
    private TextView webInfo;
    private TextView statusView;

    private WebConfigServer webServer;
    private boolean statusReceiverRegistered = false;

    private final BroadcastReceiver statusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            refresh();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        btnSync = (Button) findViewById(R.id.btn_sync);
        btnApiKey = (Button) findViewById(R.id.btn_api_key);
        btnDevice = (Button) findViewById(R.id.btn_device);
        btnDream = (Button) findViewById(R.id.btn_dream);
        btnBoot = (Button) findViewById(R.id.btn_boot);
        webInfo = (TextView) findViewById(R.id.web_info);
        statusView = (TextView) findViewById(R.id.status);

        ((TextView) findViewById(R.id.setup)).setText(getString(R.string.setup_text, getPackageName()));

        btnSync.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Prefs prefs = Prefs.of(SettingsActivity.this);
                prefs.setEnabled(!prefs.isEnabled());
                MonitorService.syncState(SettingsActivity.this);
                refresh();
            }
        });

        btnApiKey.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                promptApiKey();
            }
        });

        btnDevice.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadAndPickDevice(false);
            }
        });

        btnDream.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Prefs prefs = Prefs.of(SettingsActivity.this);
                prefs.setOffOnDream(!prefs.isOffOnDream());
                refresh();
            }
        });

        btnBoot.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Prefs prefs = Prefs.of(SettingsActivity.this);
                prefs.setOnOnBoot(!prefs.isOnOnBoot());
                refresh();
            }
        });

        findViewById(R.id.btn_test_on).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                runTestPower(true);
            }
        });

        findViewById(R.id.btn_test_off).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                runTestPower(false);
            }
        });

        applyLaunchExtras(getIntent());
        MonitorService.syncState(this);
        btnSync.requestFocus();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applyLaunchExtras(intent);
        MonitorService.syncState(this);
        refresh();
    }

    @Override
    protected void onStart() {
        super.onStart();
        registerStatusReceiver();
        startWebConfigServer();
        refresh();
    }

    @Override
    protected void onStop() {
        stopWebConfigServer();
        unregisterStatusReceiver();
        super.onStop();
    }

    /** Позволяет задать ключ и устройство одной командой adb shell am start ... */
    private void applyLaunchExtras(Intent intent) {
        if (intent == null) return;
        Prefs prefs = Prefs.of(this);
        boolean keyProvided = false;

        String apiKey = intent.getStringExtra("api_key");
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            prefs.setApiKey(apiKey.trim());
            keyProvided = true;
        }

        String sku = intent.getStringExtra("sku");
        String device = intent.getStringExtra("device");
        String name = intent.getStringExtra("device_name");
        if (sku != null && !sku.trim().isEmpty() && device != null && !device.trim().isEmpty()) {
            prefs.setDevice(sku.trim(), device.trim(), name != null ? name.trim() : "");
        } else if (keyProvided && prefs.deviceId().isEmpty()) {
            // Если передали только ключ через adb — сразу подтягиваем устройства и выбираем H6097.
            loadAndPickDevice(true);
        }
    }

    private void refresh() {
        Prefs prefs = Prefs.of(this);

        btnSync.setText(prefs.isEnabled() ? R.string.btn_sync_on : R.string.btn_sync_off);

        String masked = prefs.maskedApiKey();
        btnApiKey.setText(getString(R.string.btn_api_key,
                masked.isEmpty() ? getString(R.string.value_not_set) : masked));

        String dev = prefs.deviceDisplay();
        btnDevice.setText(getString(R.string.btn_device,
                dev.isEmpty() ? getString(R.string.value_not_selected) : dev));

        btnDream.setText(prefs.isOffOnDream() ? R.string.btn_dream_on : R.string.btn_dream_off);
        btnBoot.setText(prefs.isOnOnBoot() ? R.string.btn_boot_on : R.string.btn_boot_off);

        String ip = WebConfigServer.findLocalIpv4();
        if (webServer != null && ip != null) {
            webInfo.setText(getString(R.string.web_url, "http://" + ip + ":" + WebConfigServer.PORT));
        } else {
            webInfo.setText(R.string.web_unavailable);
        }

        String svcState = getString(MonitorService.isRunning()
                ? R.string.status_service_running
                : R.string.status_service_stopped);
        String last = prefs.lastStatus();
        String lastLine = getString(R.string.status_last_event,
                last.isEmpty() ? getString(R.string.status_none) : last);
        statusView.setText(svcState + "\n" + lastLine);
    }

    private void promptApiKey() {
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        input.setHint(R.string.dialog_api_key_hint);
        input.setText(Prefs.of(this).apiKey());

        builder()
                .setTitle(R.string.dialog_api_key_title)
                .setView(input)
                .setPositiveButton(R.string.dialog_save, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        String key = input.getText().toString().trim();
                        Prefs.of(SettingsActivity.this).setApiKey(key);
                        MonitorService.syncState(SettingsActivity.this);
                        refresh();
                        if (!key.isEmpty() && Prefs.of(SettingsActivity.this).deviceId().isEmpty()) {
                            loadAndPickDevice(true);
                        }
                    }
                })
                .setNegativeButton(R.string.dialog_cancel, null)
                .show();
    }

    private void loadAndPickDevice(final boolean autoSelectFirstIfSingle) {
        final String apiKey = Prefs.of(this).apiKey();
        if (apiKey.isEmpty()) {
            toast(getString(R.string.dialog_enter_key_first));
            return;
        }

        toast(getString(R.string.dialog_loading_devices));

        Thread worker = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    final List<GoveeApi.Device> devices = GoveeApi.fetchDevices(apiKey);
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (isFinishing()) return;
                            if (devices.isEmpty()) {
                                toast(getString(R.string.dialog_no_devices));
                                return;
                            }
                            if (autoSelectFirstIfSingle) {
                                GoveeApi.Device first = devices.get(0);
                                Prefs.of(SettingsActivity.this).setDevice(first.sku, first.device, first.name);
                                MonitorService.syncState(SettingsActivity.this);
                                refresh();
                                toast("Выбрано: " + first.displayLabel());
                                return;
                            }
                            showDevicePicker(devices);
                        }
                    });
                } catch (final IOException e) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (isFinishing()) return;
                            toast("Ошибка: " + e.getMessage());
                        }
                    });
                }
            }
        }, "GoveeFetchDevices");
        worker.start();
    }

    private void showDevicePicker(final List<GoveeApi.Device> devices) {
        Prefs prefs = Prefs.of(this);
        String currentId = prefs.deviceId();
        String[] labels = new String[devices.size()];
        int checked = -1;

        for (int i = 0; i < devices.size(); i++) {
            GoveeApi.Device d = devices.get(i);
            labels[i] = d.displayLabel();
            if (d.device.equals(currentId)) checked = i;
        }

        builder()
                .setTitle(R.string.dialog_devices_title)
                .setSingleChoiceItems(labels, checked, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        GoveeApi.Device d = devices.get(which);
                        Prefs.of(SettingsActivity.this).setDevice(d.sku, d.device, d.name);
                        MonitorService.syncState(SettingsActivity.this);
                        dialog.dismiss();
                        refresh();
                    }
                })
                .setNegativeButton(R.string.dialog_cancel, null)
                .show();
    }

    private void runTestPower(boolean on) {
        if (!Prefs.of(this).isConfigured()) {
            toast(getString(R.string.dialog_enter_key_first));
            return;
        }

        toast(on ? "Отправка: ВКЛ…" : "Отправка: ВЫКЛ…");
        MonitorService.sendPowerAsync(this, on, "TEST", false, new MonitorService.PowerCallback() {
            @Override
            public void onComplete(boolean success, String statusLine) {
                if (isFinishing()) return;
                refresh();
                toast(statusLine);
            }
        });
    }

    private void startWebConfigServer() {
        if (webServer != null) return;
        try {
            webServer = WebConfigServer.start(this, new WebConfigServer.OnChangeListener() {
                @Override
                public void onConfigChanged() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (!isFinishing()) refresh();
                        }
                    });
                }
            });
        } catch (IOException e) {
            Log.w(TAG, "cannot start WebConfigServer on port " + WebConfigServer.PORT, e);
        }
    }

    private void stopWebConfigServer() {
        if (webServer != null) {
            webServer.shutdown();
            webServer = null;
        }
    }

    private void registerStatusReceiver() {
        if (statusReceiverRegistered) return;
        IntentFilter filter = new IntentFilter(MonitorService.ACTION_STATUS_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statusReceiver, filter);
        }
        statusReceiverRegistered = true;
    }

    private void unregisterStatusReceiver() {
        if (!statusReceiverRegistered) return;
        try {
            unregisterReceiver(statusReceiver);
        } catch (IllegalArgumentException ignored) {}
        statusReceiverRegistered = false;
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    @SuppressWarnings("deprecation")
    private AlertDialog.Builder builder() {
        return new AlertDialog.Builder(this, AlertDialog.THEME_DEVICE_DEFAULT_DARK);
    }
}
