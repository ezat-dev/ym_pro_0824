// ============================================================================
// AdminChatEndpoints.cs
// ============================================================================
// [파일 역할]
//   "PLC 태그 관리" 화면의 채팅 영역 전용 API. 사용자가 자연어로 "PLC 목록 보여줘",
//   "온도 태그 알려줘", "TEST 태그에 100 써줘" 같은 요청을 하면, 로컬 Ollama(qwen2.5:3b —
//   ai-diagnosis 기능에 이미 붙여둔 그 로컬 LLM)의 tool-calling 기능으로 어떤 동작인지 해석한
//   뒤, 실제로는 이 서버 자신의 기존 API(/api/admin/plcs, /api/foldertag/write/by-name 등)를
//   내부 루프백 HTTP 호출로 그대로 재사용해서 처리한다 — DB/폴링 로직을 새로 만들지 않고
//   이미 검증된 기존 엔드포인트에 얹는 얇은 오케스트레이션 계층이다.
//
//   안전장치: 실제 설비/DB에 변화를 주는 "쓰기" 도구(태그 값 쓰기, 온도 태그 신규 등록)는
//   모델이 호출하기로 결정해도 여기서 즉시 실행하지 않는다. "이 동작을 실행할까요?"라는 확인
//   대기 상태(pendingConfirm)만 클라이언트에 돌려주고, 사용자가 화면에서 실행 버튼을 눌러
//   confirm:true로 다시 요청해야만 실제로 수행한다. 조회(읽기) 도구는 설비에 영향이 없으므로
//   바로 실행하고 결과를 모델에게 다시 넘겨 자연어로 요약하게 한다.
//
//   대화 상태는 서버에 저장하지 않는다(무상태) — 매 요청마다 지금까지의 전체 messages 배열을
//   클라이언트가 그대로 실어 보내고, 서버는 그걸 이어 붙여 되돌려줄 뿐이다.
// ============================================================================

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using PlcApiServer.Services;

namespace PlcApiServer.Endpoints;

public static class AdminChatEndpoints
{
    private const string OllamaChatUrl = "http://localhost:11434/api/chat";
    private const string ChatModel = "qwen2.5:3b";
    private const string SelfBaseUrl = "http://localhost:5050";
    private const int MaxToolIterations = 6;

    // 실제 설비/DB에 변화를 주는 도구 이름 — 이 목록에 있으면 confirm:true 없이는 절대 실행하지 않는다.
    // PLC/폴더/알람 CRUD 전체를 도구로 열었더니(28개) 3B 모델이 완전히 무관한 삭제를 제안하는 등
    // 안정성이 크게 떨어지는 게 확인돼(get_docs만 물어봤는데 delete_folder_tag를 시도) 다시 핵심
    // 범위(조회 + 값쓰기 + 온도 태그 추가)로 축소했다 — 7b로 모델을 키워도 같은 문제가 반복돼
    // 근본 원인이 "도구 개수"라고 결론 내림.
    private static readonly HashSet<string> WriteTools = new() { "write_folder_tag", "write_plc_address", "add_temp_tag" };

    private const string SystemPrompt =
        "당신은 이 화면(PLC 태그 관리, PlcApiServer)의 어시스턴트입니다. 답변은 항상 한국어로 간결하게.\n" +
        "\n" +
        "이 시스템 자체에 대한 질문(테이블 구조, API 사용법, 폴링/쓰기 동작 방식 등)을 받으면 절대 스스로 " +
        "기억하거나 지어내지 말고, 반드시 get_docs 도구를 호출해서 정확한 문서를 가져온 뒤 그 내용을 바탕으로 " +
        "답하세요.\n" +
        "\n" +
        "실제 조회/조작이 필요한 요청은 도구(tools)를 사용하세요.\n" +
        "중요한 구분 1: '이미 있는 태그에 값을 쓰다/써줘/변경해줘'는 write_folder_tag이고, " +
        "'새 태그를 추가/등록/만들어줘'는 add_temp_tag입니다 — 절대 혼동하지 마세요. " +
        "태그에 값을 쓰라는 요청에 add_temp_tag를 쓰면 안 됩니다.\n" +
        "중요한 구분 2: 사용자가 'D100', 'M10'처럼 PLC 번지(디바이스 문자+숫자)를 직접 말하며 읽거나 쓰라고 " +
        "하면(등록된 태그 이름이 아니라 번지 자체) read_plc_address/write_plc_address를 쓰세요 — 이 경우 " +
        "번지를 태그 이름인 것처럼 write_folder_tag/list_folder_tags의 name 인자에 넣지 마세요.\n" +
        "PLC ID, 주소(D4 등), 컬럼명처럼 도구 인자에 필요한 값을 사용자가 알려주지 않았다면 절대 추측하거나 " +
        "지어내지 마세요 — list_plcs/list_folder_tags 같은 조회 도구로 먼저 확인하거나 사용자에게 되물어보세요.";

    public static void MapAdminChatEndpoints(this WebApplication app)
    {
        app.MapPost("/api/admin/chat", async (HttpRequest req) =>
        {
            try
            {
                using var reader = new StreamReader(req.Body);
                string body = await reader.ReadToEndAsync();
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;
                bool confirm = root.TryGetProperty("confirm", out var cf) && cf.ValueKind == JsonValueKind.True;

                // 클라이언트가 보낸 messages를 그대로 이어받는다. doc(JsonDocument)은 이 핸들러가 끝나면
                // 사라지므로, 응답으로 다시 돌려줄 수 있게 각 원소를 Clone()해서 doc 수명과 분리한다.
                var transcript = new List<object>();
                foreach (var m in root.GetProperty("messages").EnumerateArray())
                    transcript.Add(m.Clone());

                // 도구가 28개로 늘고 시스템 프롬프트에 지식베이스까지 들어가면서 CPU로 돌아가는 3B 모델
                // 기준 한 번의 응답이 60초를 넘기는 경우가 실제로 생겨(확인됨) 넉넉히 잡는다.
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(180) };
                var toolsUsed = new List<string>();

                // 직전 턴에서 "쓰기" 도구 호출이 확인 대기 중이었고, 사용자가 방금 실행을 승인한 경우 —
                // 마지막 메시지(보류 중이던 assistant의 tool_calls)를 지금 실제로 실행하고 결과를 이어붙인다.
                if (confirm && transcript.Count > 0 && transcript[^1] is JsonElement lastEl &&
                    lastEl.TryGetProperty("tool_calls", out var pendingCalls) && pendingCalls.GetArrayLength() > 0)
                {
                    var fn = pendingCalls[0].GetProperty("function");
                    string pendingName = fn.GetProperty("name").GetString() ?? "";
                    var pendingArgs = NormalizeArgs(fn.GetProperty("arguments"));
                    string pendingResult = await ExecuteToolAsync(http, pendingName, pendingArgs);
                    toolsUsed.Add(pendingName);
                    transcript.Add(new { role = "tool", content = pendingResult });
                }

                // 도구가 늘면서(28개) 작은 모델이 이미 조회한 도구를 의미 없이 반복 호출하다 반복
                // 한도까지 소진해버리는 경우가 실제로 확인됨(get_docs 이후 list_plcs를 5번 연속 호출).
                // 직전과 완전히 같은 도구+인자 호출이면 다시 실행하지 않고, "그만 반복하라"는 안내만
                // 돌려줘서 다음 턴에 다른 판단을 하도록(또는 있는 정보로 답하도록) 유도한다.
                string? lastToolCallKey = null;

                for (int iter = 0; iter < MaxToolIterations; iter++)
                {
                    var ollamaMessages = new List<object> { new { role = "system", content = SystemPrompt } };
                    ollamaMessages.AddRange(transcript);

                    var ollamaReq = new { model = ChatModel, messages = ollamaMessages, tools = ToolSchema, stream = false };
                    var resp = await http.PostAsJsonAsync(OllamaChatUrl, ollamaReq);
                    if (!resp.IsSuccessStatusCode)
                        return Results.Ok(new { success = false, error = $"Ollama 응답 오류: {resp.StatusCode}" });

                    var ollamaJson = await resp.Content.ReadFromJsonAsync<JsonElement>();
                    var message = ollamaJson.GetProperty("message");
                    string? content = message.TryGetProperty("content", out var cEl) ? cEl.GetString() : null;
                    bool hasToolCalls = message.TryGetProperty("tool_calls", out var toolCalls) && toolCalls.ValueKind == JsonValueKind.Array && toolCalls.GetArrayLength() > 0;

                    if (!hasToolCalls)
                    {
                        transcript.Add(new { role = "assistant", content });
                        return Results.Ok(new { success = true, done = true, messages = transcript, reply = content, toolsUsed });
                    }

                    var firstFn = toolCalls[0].GetProperty("function");
                    string toolName = firstFn.GetProperty("name").GetString() ?? "";
                    var toolArgs = NormalizeArgs(firstFn.GetProperty("arguments"));
                    var toolCallEntry = new { function = new { name = toolName, arguments = toolArgs } };

                    // 이번 턴에서 새로 등장한 "쓰기" 도구는 여기서 실행하지 않고 확인을 요청한다.
                    if (WriteTools.Contains(toolName))
                    {
                        transcript.Add(new { role = "assistant", content, tool_calls = new[] { toolCallEntry } });
                        return Results.Ok(new
                        {
                            success = true,
                            done = false,
                            messages = transcript,
                            toolsUsed,
                            pendingConfirm = new { name = toolName, arguments = toolArgs, description = DescribePendingAction(toolName, toolArgs) }
                        });
                    }

                    string callKey = toolName + "|" + toolArgs.GetRawText();
                    string toolResult;
                    if (callKey == lastToolCallKey)
                    {
                        toolResult = JsonSerializer.Serialize(new
                        {
                            success = false,
                            error = "바로 직전과 같은 조회를 반복하고 있습니다 — 이미 받은 정보로 답하거나, 다른 도구를 시도하세요."
                        });
                    }
                    else
                    {
                        toolResult = await ExecuteToolAsync(http, toolName, toolArgs);
                        toolsUsed.Add(toolName);
                        lastToolCallKey = callKey;
                    }
                    transcript.Add(new { role = "assistant", content, tool_calls = new[] { toolCallEntry } });
                    transcript.Add(new { role = "tool", content = toolResult });
                }

                return Results.Ok(new { success = false, error = "요청이 너무 복잡해서 처리하지 못했습니다(반복 한도 초과).", messages = transcript, toolsUsed });
            }
            catch (HttpRequestException ex)
            {
                return Results.Ok(new { success = false, error = $"Ollama에 연결할 수 없습니다(로컬에서 실행 중인지 확인하세요): {ex.Message}" });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    // Ollama tool_calls의 arguments는 버전에 따라 JSON 객체로 오거나 JSON 문자열로 올 수 있어 방어적으로 통일한다.
    private static JsonElement NormalizeArgs(JsonElement raw)
    {
        if (raw.ValueKind == JsonValueKind.String)
        {
            string s = raw.GetString() ?? "{}";
            using var d = JsonDocument.Parse(string.IsNullOrWhiteSpace(s) ? "{}" : s);
            return d.RootElement.Clone();
        }
        return raw;
    }

    private static string? GetStringArg(JsonElement args, string key) =>
        args.ValueKind == JsonValueKind.Object && args.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static int? GetIntArg(JsonElement args, string key)
    {
        if (args.ValueKind != JsonValueKind.Object || !args.TryGetProperty(key, out var v)) return null;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i)) return i;
        if (v.ValueKind == JsonValueKind.String && int.TryParse(v.GetString(), out var pi)) return pi;
        return null;
    }

    // ── 도구 실행: 전부 이 서버 자신의 기존 API를 루프백으로 호출한다(로직 중복 없음). ──────────
    private static async Task<string> ExecuteToolAsync(HttpClient http, string name, JsonElement args)
    {
        try
        {
            HttpResponseMessage resp;
            switch (name)
            {
                case "list_plcs":
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/plcs");
                    break;
                case "get_poll_status":
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/monitor/pollstatus");
                    break;
                case "get_docs":
                    // 시스템 프롬프트에 문서를 통째로 넣어뒀을 때는 작은 모델이 정확한 테이블/컬럼명을
                    // 잘 인용하지 못했다(실제로 확인됨) — 대신 도구 결과로 "방금 막 읽은 것"처럼 주면
                    // 다른 조회 도구들과 같은 방식으로 훨씬 정확하게 인용한다.
                    return JsonSerializer.Serialize(new { success = true, docs = GetDocs(GetStringArg(args, "topic")) });
                case "list_folder_tags":
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/monitor/foldertags" +
                        (GetIntArg(args, "folderId") is int fid ? $"?folderId={fid}" : ""));
                    break;
                case "list_alarm_tags":
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/monitor/alarmtags" +
                        (GetIntArg(args, "folderId") is int afid ? $"?folderId={afid}" : ""));
                    break;
                case "list_temp_tags":
                {
                    var q = new List<string>();
                    if (GetStringArg(args, "equipId") is string eq) q.Add($"equipId={Uri.EscapeDataString(eq)}");
                    if (GetIntArg(args, "minutes") is int mins) q.Add($"minutes={mins}");
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/monitor/temptags" + (q.Count > 0 ? "?" + string.Join("&", q) : ""));
                    break;
                }
                case "list_equip_ids":
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/admin/temptags/equipids");
                    break;
                case "write_folder_tag":
                {
                    string tagName = GetStringArg(args, "name") ?? "";
                    int value = GetIntArg(args, "value") ?? 0;
                    var q = new List<string> { $"name={Uri.EscapeDataString(tagName)}", $"value={value}" };
                    if (GetIntArg(args, "folderId") is int wfid) q.Add($"folderId={wfid}");
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/foldertag/write/by-name?{string.Join("&", q)}");
                    break;
                }
                case "add_temp_tag":
                {
                    var reqBody = new
                    {
                        tagName = GetStringArg(args, "tagName") ?? "",
                        address = GetStringArg(args, "address") ?? "",
                        plcId = GetStringArg(args, "plcId") ?? "",
                        colName = GetStringArg(args, "colName") ?? "",
                        trendName = GetStringArg(args, "trendName"),
                        scale = GetStringArg(args, "scale"),
                        equipId = GetStringArg(args, "equipId"),
                        enabled = true
                    };
                    resp = await http.PostAsJsonAsync($"{SelfBaseUrl}/api/admin/temptags", reqBody);
                    break;
                }
                case "read_plc_address":
                {
                    string plcId = GetStringArg(args, "plcId") ?? "";
                    string address = GetStringArg(args, "address") ?? "";
                    int count = GetIntArg(args, "count") ?? 1;
                    var parsed = LiveTagMonitorService.ParseAddressFull(address);
                    if (parsed == null)
                        return JsonSerializer.Serialize(new { success = false, error = $"주소 형식을 해석할 수 없음: '{address}'" });
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/plc/read/{Uri.EscapeDataString(plcId)}" +
                        $"?start={parsed.Value.Addr}&count={count}&device={Uri.EscapeDataString(parsed.Value.Device)}");
                    break;
                }
                case "write_plc_address":
                {
                    string plcId = GetStringArg(args, "plcId") ?? "";
                    string address = GetStringArg(args, "address") ?? "";
                    int value = GetIntArg(args, "value") ?? 0;
                    resp = await http.GetAsync($"{SelfBaseUrl}/api/foldertag/write/by-address" +
                        $"?plcId={Uri.EscapeDataString(plcId)}&address={Uri.EscapeDataString(address)}&value={value}");
                    break;
                }
                default:
                    return JsonSerializer.Serialize(new { success = false, error = $"알 수 없는 도구: {name}" });
            }

            string raw = await resp.Content.ReadAsStringAsync();
            raw = await EnrichPlcNotFoundError(http, raw);
            return TrimForLlm(raw);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { success = false, error = ex.Message });
        }
    }

    // plcId를 직접 타이핑/추론해야 하는 도구(read_plc_address 등)는 작은 모델이 한 글자 틀리는 실수를
    // 종종 한다(실제로 확인됨: 사용자가 "MST_MITSUBISHI"라고 정확히 알려줬는데도 모델이 "MST_MITSUBISHIS"로
    // 잘못 불러 실패). "PLC를 찾을 수 없음" 오류가 나면 실제 PLC ID 목록을 같이 돌려줘서, 같은 턴 안에서
    // 모델이 다음 반복 때 스스로 맞는 ID로 다시 시도할 수 있게 한다.
    private static async Task<string> EnrichPlcNotFoundError(HttpClient http, string rawJson)
    {
        try
        {
            if (JsonNode.Parse(rawJson) is not JsonObject node) return rawJson;
            bool ok = node["success"]?.GetValue<bool>() ?? true;
            string? error = node["error"]?.GetValue<string>();
            if (ok || error == null) return rawJson;
            bool looksLikeMissingPlc = error.Contains("not found", StringComparison.OrdinalIgnoreCase) || error.Contains("없음");
            if (!looksLikeMissingPlc) return rawJson;

            var plcsResp = await http.GetAsync($"{SelfBaseUrl}/api/admin/plcs");
            var plcsJson = await plcsResp.Content.ReadFromJsonAsync<JsonElement>();
            if (plcsJson.TryGetProperty("plcs", out var plcsArr))
            {
                var ids = new JsonArray();
                foreach (var p in plcsArr.EnumerateArray())
                    if (p.TryGetProperty("plcId", out var idProp)) ids.Add(JsonValue.Create(idProp.GetString()));
                node["validPlcIds"] = ids;
            }
            return node.ToJsonString();
        }
        catch { return rawJson; }   // 목록 조회 자체가 실패해도 원래 오류는 그대로 전달한다.
    }

    // 도구 실행 결과를 그대로 모델에게 돌려주면 안 되는 경우가 있다 — 온도 태그의 시계열(series),
    // 폴링 이력(durationHistory)은 화면 차트용이라 통째로 넘기면 3B 모델이 숫자 나열에 압도돼 엉뚱한
    // 답을 하거나(실제로 확인됨: "온도 태그 목록 보여줘"에 시간대별 수치 분석을 늘어놓은 사례) 응답이
    // 크게 느려진다. 태그 개수 자체도 실사용 환경에서 PLC 1대당 수백 개(예: 폴더 242개)까지 있어서,
    // 목록형 도구는 개수를 넉넉히 앞부분만 잘라서 넘기고 전체 개수는 note로 알려준다(화면 표는 그대로 전체를 보여준다 — 이건 LLM에게 넘기는 사본에만 적용).
    private const int MaxArrayItemsForLlm = 40;
    private static readonly string[] ArrayKeysToCap = { "tags", "plcs" };

    private static string TrimForLlm(string rawJson)
    {
        try
        {
            if (JsonNode.Parse(rawJson) is not JsonObject node) return rawJson;

            if (node["tags"] is JsonArray tagsArr)
                foreach (var t in tagsArr)
                    (t as JsonObject)?.Remove("series");
            (node["live"] as JsonObject)?.Remove("durationHistory");
            (node["temp"] as JsonObject)?.Remove("durationHistory");

            foreach (var key in ArrayKeysToCap)
            {
                if (node[key] is JsonArray arr && arr.Count > MaxArrayItemsForLlm)
                {
                    int total = arr.Count;
                    while (arr.Count > MaxArrayItemsForLlm) arr.RemoveAt(arr.Count - 1);
                    node["note"] = $"총 {total}개 중 {MaxArrayItemsForLlm}개만 표시(나머지 {total - MaxArrayItemsForLlm}개 생략) — " +
                                   "전체 목록이 필요하면 화면의 표를 직접 확인하도록 안내하세요.";
                }
            }

            return node.ToJsonString();
        }
        catch { return rawJson; }   // 예상과 다른 형식이면 안전하게 원본 그대로 넘긴다.
    }

    // get_docs 도구가 돌려주는 실제 문서 내용. 시스템 프롬프트에 그대로 박아뒀을 때보다 "도구 결과"로
    // 줬을 때 모델이 정확한 테이블/컬럼명·API 경로를 훨씬 잘 인용해서(다른 조회 도구들과 동일한 경로라서)
    // 이 텍스트를 시스템 프롬프트가 아니라 여기 도구 결과 쪽에 둔다.
    private static string GetDocs(string? topic)
    {
        const string tables =
            "[테이블 구조] tb_plc(plc_id PK, ip, port, plc_type=LS|MITSUBISHI|MODBUS_TCP, label, enabled) — PLC 연결정보. " +
            "folders(id,name,parent_id) 1─N folders_tags(id,folder_id,name,address,plc_id,type,enabled) = 모니터링(폴더) 태그 정의. " +
            "tb_alarm_folder(folder_id,folder_name,parent_id,sort_order) 1─N tb_alarm_tag(tag_id,folder_id,tag_name,address,plc_id,alarm_msg,level,enabled) " +
            "— ON/OFF로 전환되는 순간마다 tb_alarm_history에 발생/해제 이력이 남는다(현재 이 이력을 조회하는 API는 없음). " +
            "tb_temp_tag(temp_id,tag_name,address,plc_id,col_name,trend_name,scale,equip_id,enabled) — col_name 하나당 " +
            "tb_temp_snapshot 테이블에 실제 컬럼이 하나 생기고, 폴링 주기마다 스냅샷 1행이 새로 쌓인다.";

        const string api =
            "[API로 값 읽기/쓰기] 태그 이름으로: GET /api/foldertag/value/by-name?name=이름 (읽기), " +
            "GET /api/foldertag/write/by-name?name=이름&value=값 (쓰기, 실제 PLC에 씀). " +
            "PLC 번지 직접(태그 등록 여부 무관): GET /api/plc/read/{plcId}?start=번지숫자&count=개수&device=디바이스문자 (읽기), " +
            "GET /api/foldertag/write/by-address?plcId=아이디&address=번지&value=값 (쓰기). " +
            "목록 조회: GET /api/admin/plcs, /api/admin/foldertags, /api/admin/alarmtags, /api/admin/temptags.";

        const string process =
            "[동작 방식] 폴더/알람 태그는 백그라운드 서비스가 2초 주기로, 온도 태그는 30초 주기로 각각 독립적으로 " +
            "PLC를 직접 폴링한다(HTTP 요청과 무관하게 항상 돌아감, PLC 하나당 커넥션 1개를 재사용). " +
            "폴더 태그 값은 DB에 저장하지 않고 서버 메모리에만 있다가 API 요청이 오면 그 값을 그대로 보여준다(추가 " +
            "PLC 통신 없음). 온도 태그는 매 주기마다 전체 태그의 값을 한 행으로 tb_temp_snapshot에 insert한다. " +
            "값 쓰기는 큐 없이 그 자리에서 즉시 실제 PLC에 쓰고, 쓴 직후 다시 읽어서 반영됐는지 확인한다.";

        return (topic?.Trim().ToLowerInvariant()) switch
        {
            "tables" or "table" or "테이블" => tables,
            "api" => api,
            "process" or "flow" or "동작" => process,
            _ => tables + " " + api + " " + process
        };
    }

    // "쓰기" 도구를 실행하기 전, 사용자에게 무엇을 할지 미리 보여줄 한국어 설명.
    private static string DescribePendingAction(string toolName, JsonElement args) => toolName switch
    {
        "write_folder_tag" =>
            $"태그 '{GetStringArg(args, "name")}' 에 값 {GetIntArg(args, "value")} 쓰기" +
            (GetIntArg(args, "folderId") is int fid ? $" (폴더 ID {fid})" : "") +
            " — 실제 설비에 값이 전달됩니다.",
        "write_plc_address" =>
            $"PLC '{GetStringArg(args, "plcId")}'의 번지 '{GetStringArg(args, "address")}'에 값 {GetIntArg(args, "value")} 쓰기" +
            " — 태그 등록 여부와 상관없이 그 번지에 직접 쓰며, 실제 설비에 값이 전달됩니다.",
        "add_temp_tag" =>
            $"새 온도 태그 등록 — 이름:'{GetStringArg(args, "tagName")}', PLC:'{GetStringArg(args, "plcId")}', " +
            $"주소:'{GetStringArg(args, "address")}', 컬럼:'{GetStringArg(args, "colName")}'" +
            (GetStringArg(args, "equipId") is string eq ? $", 설비:'{eq}'" : ""),
        _ => $"{toolName} 실행"
    };

    private static object Tool(string name, string description, object parameters) =>
        new { type = "function", function = new { name, description, parameters } };

    // ── Ollama에게 알려줄 도구 목록(JSON Schema) ────────────────────────────────────────────
    private static readonly object[] ToolSchema =
    {
        Tool("list_plcs", "등록된 모든 PLC 목록을 IP/포트/타입/사용여부와 함께 조회한다.",
            new { type = "object", properties = new { } }),

        Tool("get_poll_status", "현재 PLC 통신(폴링) 상태 — 최근 한 바퀴 소요시간, 최근 실패 이력 등을 조회한다. " +
                                 "'지금 통신 상태 어때', '문제 있어?' 같은 질문에 사용한다.",
            new { type = "object", properties = new { } }),

        Tool("get_docs", "이 시스템 자체에 대한 문서를 조회한다 — 테이블 구조, 값 읽기/쓰기 API 사용법, 폴링/쓰기 " +
                          "동작 방식을 묻는 질문에는 반드시 이 도구를 먼저 호출해서 정확한 내용을 가져온 뒤 답한다.",
            new
            {
                type = "object",
                properties = new
                {
                    topic = new { type = "string", description = "tables(테이블 구조) | api(API 사용법) | process(동작 방식) 중 하나, 생략하면 전체" }
                }
            }),

        Tool("list_folder_tags", "모니터링(폴더) 태그 목록과 현재 값을 조회한다.",
            new
            {
                type = "object",
                properties = new { folderId = new { type = "integer", description = "특정 폴더 ID로 좁히고 싶을 때만 지정(선택)" } }
            }),

        Tool("write_folder_tag", "이미 등록되어 있는 모니터링 태그를 이름으로 찾아 실제 PLC에 값을 쓴다(새 태그를 만들지 않는다). " +
                                  "'~태그에 …써줘/변경해줘' 요청은 항상 이 도구를 쓴다. 실제 설비에 영향을 주는 동작이다.",
            new
            {
                type = "object",
                properties = new
                {
                    name = new { type = "string", description = "태그 이름(정확히 일치해야 함)" },
                    value = new { type = "integer", description = "쓸 값" },
                    folderId = new { type = "integer", description = "같은 이름이 여러 폴더에 있을 때만 지정(선택)" }
                },
                required = new[] { "name", "value" }
            }),

        Tool("list_alarm_tags", "알람 태그 목록과 현재 ON/OFF 상태를 조회한다.",
            new
            {
                type = "object",
                properties = new { folderId = new { type = "integer", description = "특정 알람 폴더 ID로 좁히고 싶을 때만 지정(선택)" } }
            }),

        Tool("list_temp_tags", "온도 태그 목록과 각 태그의 현재 값을 조회한다(그래프용 시계열 이력은 포함하지 않는다).",
            new
            {
                type = "object",
                properties = new { equipId = new { type = "string", description = "특정 설비로 좁히고 싶을 때만 지정(선택)" } }
            }),

        Tool("list_equip_ids", "온도 태그에 등록되어 있는 설비(equip_id) 목록을 조회한다. 온도 태그를 추가하기 전, " +
                                "이미 쓰이고 있는 설비명을 확인할 때 사용한다.",
            new { type = "object", properties = new { } }),

        Tool("add_temp_tag", "완전히 새로운 온도 태그를 DB에 등록(생성)한다 — 기존 태그에 값을 쓰는 것이 아니다. " +
                              "'태그 추가/등록/새로 만들어줘' 요청에만 사용한다. plcId는 반드시 list_plcs로 확인한 " +
                              "실제 PLC ID를 사용해야 한다. colName은 영문/숫자/밑줄만 가능한 내부 컬럼명이며, " +
                              "tagName/address/plcId/colName 중 사용자가 알려주지 않은 값이 있으면 지어내지 말고 먼저 물어봐야 한다.",
            new
            {
                type = "object",
                properties = new
                {
                    tagName = new { type = "string", description = "태그 이름(화면 표시용)" },
                    address = new { type = "string", description = "PLC 주소(예: D100)" },
                    plcId = new { type = "string", description = "PLC ID(list_plcs 결과 중 하나)" },
                    colName = new { type = "string", description = "DB 컬럼명(영문/숫자/밑줄만)" },
                    trendName = new { type = "string", description = "그래프 표시용 이름(선택, 생략 시 tagName 사용)" },
                    scale = new { type = "string", description = "값 보정 배율(선택)" },
                    equipId = new { type = "string", description = "소속 설비(선택)" }
                },
                required = new[] { "tagName", "address", "plcId", "colName" }
            }),

        Tool("read_plc_address", "등록된 태그 이름과 상관없이, 지정한 PLC의 번지(주소)를 직접 읽는다. " +
                                  "사용자가 'D100', 'M10'처럼 번지 자체를 말하며 읽어달라고 할 때 사용한다.",
            new
            {
                type = "object",
                properties = new
                {
                    plcId = new { type = "string", description = "PLC ID(list_plcs 결과 중 하나)" },
                    address = new { type = "string", description = "PLC 번지(예: D100, M10)" },
                    count = new { type = "integer", description = "연속으로 몇 개를 읽을지(기본 1, 선택)" }
                },
                required = new[] { "plcId", "address" }
            }),

        Tool("write_plc_address", "등록된 태그 이름과 상관없이, 지정한 PLC의 번지(주소)에 직접 값을 쓴다. " +
                                   "사용자가 'D100', 'M10'처럼 번지 자체를 말하며 값을 쓰라고 할 때 사용한다. " +
                                   "실제 설비에 영향을 주는 동작이다.",
            new
            {
                type = "object",
                properties = new
                {
                    plcId = new { type = "string", description = "PLC ID(list_plcs 결과 중 하나)" },
                    address = new { type = "string", description = "PLC 번지(예: D100, M10)" },
                    value = new { type = "integer", description = "쓸 값" }
                },
                required = new[] { "plcId", "address", "value" }
            }),
    };
}
