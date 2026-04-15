package com.example.xgglassapp.logic

import com.universalglasses.appcontract.*
import com.universalglasses.core.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.Base64

/**
 * Look & Remember — xg.glass app
 *
 * 功能：睇到野 → 按一下 → AI 分析存入記憶 → 再見到時自動提醒
 *
 * Command 1: "Look & Remember" — 影相 + AI 分析 + 存入
 * Command 2: "What Did I See?" — 查看今日記錄
 * Command 3: "Recall This" — 對住某樣野再按，AI 話你知係咪見過
 */
class LookRememberEntry : UniversalAppEntrySimple {

    override val id = "look_remember"
    override val displayName = "Look & Remember"

    // 簡單的記憶儲存（用戶端集合）
    private val memoryStore = mutableListOf<MemoryItem>()

    override fun userSettings(): List<UserSettingField> = AIApiSettings.fields(
        defaultBaseUrl = "https://api.openai.com/v1/",
        defaultModel = "gpt-4o-mini",
    )

    override fun commands(): List<UniversalCommand> = listOf(
        // === Command 1: 隨睇即記 ===
        object : UniversalCommand {
            override val id = "remember"
            override val title = "Remember This"
            override suspend fun run(ctx: UniversalAppContext): Result<Unit> {
                ctx.client.display("Capturing...", DisplayOptions())

                val img = ctx.client.capturePhoto().getOrElse {
                    return ctx.client.display("Camera error: ${it.message}", DisplayOptions())
                }

                val b64 = Base64.getEncoder().encodeToString(img.jpegBytes)
                val summary = analyzeImage(ctx, b64, "Briefly describe what you see in 20 words or less.")

                val item = MemoryItem(
                    summary = summary,
                    timestamp = System.currentTimeMillis(),
                    sourceModel = img.sourceModel.name
                )
                memoryStore.add(item)

                ctx.client.display("Remembered: $summary", DisplayOptions())

                if (ctx.client.capabilities.canPlayTts) {
                    ctx.client.playAudio(AudioSource.Tts("Got it. I'll remember that."))
                }

                return Result.success(Unit)
            }
        },

        // === Command 2: 回顧今日記憶 ===
        object : UniversalCommand {
            override val id = "review"
            override val title = "What Did I See?"
            override suspend fun run(ctx: UniversalAppContext): Result<Unit> {
                if (memoryStore.isEmpty()) {
                    return ctx.client.display("No memories yet. Try Remember This first!", DisplayOptions())
                }

                val now = System.currentTimeMillis()
                val today = memoryStore.filter {
                    (now - it.timestamp) < 24 * 60 * 60 * 1000
                }

                if (today.isEmpty()) {
                    return ctx.client.display("Nothing seen today yet.", DisplayOptions())
                }

                val review = today.take(5).reversed().mapIndexed { i, item ->
                    "${i + 1}. ${item.summary}"
                }.joinToString("\n")

                return ctx.client.display("Today:\n$review", DisplayOptions())
            }
        },

        // === Command 3: 認知的野 ===
        object : UniversalCommand {
            override val id = "recall"
            override val title = "Recall This"
            override suspend fun run(ctx: UniversalAppContext): Result<Unit> {
                ctx.client.display("Checking...", DisplayOptions())

                val img = ctx.client.capturePhoto().getOrElse {
                    return ctx.client.display("Camera error: ${it.message}", DisplayOptions())
                }

                val b64 = Base64.getEncoder().encodeToString(img.jpegBytes)
                val currentDesc = analyzeImage(ctx, b64, "Briefly describe what you see in 15 words or less.")

                val match = memoryStore.find { existing ->
                    simpleMatch(existing.summary, currentDesc)
                }

                val response = if (match != null) {
                    val ago = timeAgo(match.timestamp)
                    "Seen before ($ago): ${match.summary}"
                } else {
                    "New - not in your memory yet"
                }

                return ctx.client.display(response, DisplayOptions())
            }
        },

        // === Command 4: 清空記憶 ===
        object : UniversalCommand {
            override val id = "clear"
            override val title = "Clear Memory"
            override suspend fun run(ctx: UniversalAppContext): Result<Unit> {
                memoryStore.clear()
                return ctx.client.display("Memory cleared.", DisplayOptions())
            }
        }
    )

    // === Helper: AI Image Analysis (via HttpURLConnection — no extra deps) ===
    private suspend fun analyzeImage(ctx: UniversalAppContext, b64: String, prompt: String): String {
        return withContext(Dispatchers.IO) {
            try {
                val apiKey = AIApiSettings.apiKey(ctx.settings)
                val baseUrl = AIApiSettings.baseUrl(ctx.settings).removeSuffix("/")
                val model = AIApiSettings.model(ctx.settings)

                val imagePart = JSONObject().apply {
                    put("type", "image_url")
                    put("image_url", JSONObject().apply {
                        put("url", "data:image/jpeg;base64,$b64")
                        put("detail", "low")
                    })
                }
                val textPart = JSONObject().apply {
                    put("type", "text")
                    put("text", prompt)
                }
                val contentArray = JSONArray().apply {
                    put(textPart)
                    put(imagePart)
                }
                val messageObj = JSONObject().apply {
                    put("role", "user")
                    put("content", contentArray)
                }
                val messagesArray = JSONArray().apply {
                    put(messageObj)
                }
                val requestBody = JSONObject().apply {
                    put("model", model)
                    put("messages", messagesArray)
                    put("max_tokens", 100)
                }.toString()

                val url = URL("$baseUrl/chat/completions")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.addRequestProperty("Authorization", "Bearer $apiKey")
                conn.addRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.outputStream.write(requestBody.toByteArray())
                conn.outputStream.flush()

                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val responseBody = reader.readText()
                reader.close()
                conn.disconnect()

                val json = JSONObject(responseBody)
                json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content")
                    .trim()
            } catch (e: Exception) {
                "AI error: ${e.message}"
            }
        }
    }

    // === Helper: 簡單文字相似度 matching ===
    private fun simpleMatch(a: String, b: String): Boolean {
        val wordsA = a.lowercase().split(" ").filter { it.length > 3 }.toSet()
        val wordsB = b.lowercase().split(" ").filter { it.length > 3 }.toSet()
        return wordsA.intersect(wordsB).size >= 2
    }

    // === Helper: 時間描述 ===
    private fun timeAgo(ts: Long): String {
        val diff = System.currentTimeMillis() - ts
        return when {
            diff < 60_000 -> "just now"
            diff < 3_600_000 -> "${diff / 60_000}m ago"
            diff < 86_400_000 -> "${diff / 3_600_000}h ago"
            else -> "${diff / 86_400_000}d ago"
        }
    }

    data class MemoryItem(
        val summary: String,
        val timestamp: Long,
        val sourceModel: String
    )
}
