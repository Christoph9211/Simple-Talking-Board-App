package com.simpletalkingboard.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.util.Locale;

public class MainActivity extends Activity {
    private TextToSpeech textToSpeech;
    private boolean ttsReady = false;

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
                textToSpeech.setSpeechRate(0.75f);
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

    private class AndroidSpeechBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return ttsReady;
        }

        @JavascriptInterface
        public void setRate(float rate) {
            if (textToSpeech == null) return;
            textToSpeech.setSpeechRate(Math.max(0.5f, Math.min(rate, 1.2f)));
        }

        @JavascriptInterface
        public void speak(String text, float rate) {
            if (textToSpeech == null || text == null || text.trim().isEmpty()) return;
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
