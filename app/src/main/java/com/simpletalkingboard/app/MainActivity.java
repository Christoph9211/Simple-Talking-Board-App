package com.simpletalkingboard.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity {
    private static final String PREFS_NAME = "speech";
    private static final String PREF_KEY_VOICE = "preferredVoiceName";

    private TextToSpeech textToSpeech;
    private volatile boolean ttsReady = false;
    private volatile String voiceSummary = "Android tablet voice initializing.";
    private volatile String activeVoiceName = "";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = textToSpeech.setLanguage(Locale.US);
                ttsReady = result != TextToSpeech.LANG_MISSING_DATA
                        && result != TextToSpeech.LANG_NOT_SUPPORTED;
                if (ttsReady) {
                    if (!applySavedOrBestVoice()) {
                        voiceSummary = "Using Android default English voice. Better network voices were not available to this app.";
                    }
                    textToSpeech.setSpeechRate(0.75f);
                } else {
                    voiceSummary = "Android English speech is not installed or supported.";
                }
            } else {
                voiceSummary = "Android tablet voice failed to initialize.";
            }
        });

        WebView webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidSpeechBridge(), "AndroidSpeech");
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
        hideSystemBars();
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }

    private void hideSystemBars() {
        View decorView = getWindow().getDecorView();
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            WindowInsetsController controller = decorView.getWindowInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }

    private SharedPreferences speechPrefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    private boolean applySavedOrBestVoice() {
        String preferredVoiceName = speechPrefs().getString(PREF_KEY_VOICE, "");
        if (preferredVoiceName != null && !preferredVoiceName.isEmpty()) {
            if (applyVoice(findEnglishVoice(preferredVoiceName), true)) return true;
            speechPrefs().edit().remove(PREF_KEY_VOICE).apply();
        }
        return applyVoice(pickBestVoice(), false);
    }

    private Voice pickBestVoice() {
        List<Voice> voices = getEnglishVoices();
        return voices.isEmpty() ? null : voices.get(0);
    }

    private List<Voice> getEnglishVoices() {
        List<Voice> englishVoices = new ArrayList<>();
        Set<Voice> voices = textToSpeech.getVoices();
        if (voices == null) return englishVoices;

        for (Voice voice : voices) {
            if (isUsableEnglishVoice(voice)) englishVoices.add(voice);
        }
        Collections.sort(englishVoices, (a, b) -> Integer.compare(voiceScore(b), voiceScore(a)));
        return englishVoices;
    }

    private boolean isUsableEnglishVoice(Voice voice) {
        if (voice.getName() == null || voice.getName().isEmpty()) return false;
        Locale locale = voice.getLocale();
        if (locale == null || !"en".equalsIgnoreCase(locale.getLanguage())) return false;
        return voice.getFeatures() == null
                || !voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);
    }

    private int voiceScore(Voice voice) {
        Locale locale = voice.getLocale();
        int score = voice.getQuality() - (voice.getLatency() / 2);
        if (Locale.US.equals(locale)) score += 1000;
        else if ("US".equalsIgnoreCase(locale.getCountry())) score += 900;
        else score += 500;
        if (voice.isNetworkConnectionRequired()) score += 250;

        String name = voice.getName().toLowerCase(Locale.US);
        if (name.contains("female") || name.contains("woman")) score += 25;
        return score;
    }

    private Voice findEnglishVoice(String voiceName) {
        if (voiceName == null || voiceName.isEmpty()) return null;
        for (Voice voice : getEnglishVoices()) {
            if (voiceName.equals(voice.getName())) return voice;
        }
        return null;
    }

    private boolean applyVoice(Voice voice, boolean parentChoice) {
        if (voice == null || textToSpeech.setVoice(voice) != TextToSpeech.SUCCESS) return false;
        activeVoiceName = voice.getName();
        voiceSummary = describeVoice(voice, parentChoice);
        return true;
    }

    private String getEnglishVoicesJson() {
        JSONArray json = new JSONArray();
        for (Voice voice : getEnglishVoices()) {
            try {
                JSONObject item = new JSONObject();
                item.put("name", voice.getName());
                item.put("lang", voice.getLocale().toLanguageTag());
                item.put("network", voice.isNetworkConnectionRequired());
                item.put("quality", voice.getQuality());
                item.put("latency", voice.getLatency());
                item.put("active", voice.getName().equals(activeVoiceName));
                json.put(item);
            } catch (JSONException ignored) {
            }
        }
        return json.toString();
    }

    private String describeVoice(Voice voice, boolean parentChoice) {
        String type = voice.isNetworkConnectionRequired() ? "online/network" : "offline/local";
        return "Using Android voice: " + voice.getName()
                + " (" + voice.getLocale().toLanguageTag()
                + ", " + type
                + ", quality " + voice.getQuality() + "). "
                + (parentChoice ? "Saved parent choice." : "Auto selected.");
    }

    private class AndroidSpeechBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return ttsReady;
        }

        @JavascriptInterface
        public void setRate(float rate) {
            if (textToSpeech == null || !ttsReady) return;
            textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(rate, 1.2f)));
        }

        @JavascriptInterface
        public String getVoiceSummary() {
            return voiceSummary;
        }

        @JavascriptInterface
        public String getEnglishVoices() {
            if (textToSpeech == null || !ttsReady) return "[]";
            return getEnglishVoicesJson();
        }

        @JavascriptInterface
        public String getActiveVoiceName() {
            return activeVoiceName;
        }

        @JavascriptInterface
        public boolean selectVoice(String voiceName) {
            if (textToSpeech == null || !ttsReady) return false;
            String requestedVoice = voiceName == null ? "" : voiceName.trim();
            if (requestedVoice.isEmpty()) {
                speechPrefs().edit().remove(PREF_KEY_VOICE).apply();
                return applyVoice(pickBestVoice(), false);
            }

            Voice voice = findEnglishVoice(requestedVoice);
            if (!applyVoice(voice, true)) return false;
            speechPrefs().edit().putString(PREF_KEY_VOICE, voice.getName()).apply();
            return true;
        }

        @JavascriptInterface
        public void speak(String text, float rate) {
            if (textToSpeech == null || !ttsReady || text == null || text.trim().isEmpty()) return;
            textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(rate, 1.2f)));
            textToSpeech.stop();
            textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "board-utterance");
        }

        @JavascriptInterface
        public void stop() {
            if (textToSpeech != null) {
                textToSpeech.stop();
            }
        }
    }
}
