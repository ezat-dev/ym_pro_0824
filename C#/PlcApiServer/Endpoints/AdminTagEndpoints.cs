// ============================================================================
// AdminTagEndpoints.cs
// ============================================================================
// [파일 역할]
//   "PLC 태그 관리" 화면(wwwroot/admin/tags.html)이 쓰는 CRUD + 엑셀 임포트/익스포트 API 전용 파일.
//   Program.cs의 기존 API들은 "값을 읽고 쓰는" 용도(/api/plc/*, /api/foldertag/value*)였고,
//   이 파일은 "태그 정의 자체(이름/주소/PLC 등)를 추가·수정·삭제"하는 관리자용 API만 모아둔다.
//   기존 폴링(LiveTagMonitorService/TempMonitorService)은 DB를 매 사이클 또는 30초 캐시로
//   다시 읽으므로, 여기서 DB 행만 바꿔주면 폴링 쪽은 별도 알림 없이 알아서 따라온다.
//
//   대상 5개 테이블(관계):
//     folders(폴더) 1 ── N folders_tags(모니터링 태그)   → 값 조회는 /api/foldertag/*
//     tb_alarm_folder(알람폴더) 1 ── N tb_alarm_tag(알람태그) → 전환 시 tb_alarm_history 기록
//     tb_temp_tag(온도태그) 1개 저장 시 tb_temp_snapshot에 col_name 컬럼이 동적 생성됨
//
//   모든 응답은 이 프로젝트 전체 컨벤션과 동일하게 "HTTP 200 + { success, ... }" 형태다
//   (호출측은 HTTP status가 아니라 JSON의 success 필드를 본다). 단, 엑셀 다운로드(export)만
//   파일 자체를 응답 바디로 내려준다(Results.File).
// ============================================================================

using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using MySqlConnector;
using PlcApiServer.Repositories;
using PlcApiServer.Services;

namespace PlcApiServer.Endpoints;

public static class AdminTagEndpoints
{
    private const string XlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static void MapAdminTagEndpoints(this WebApplication app)
    {
        MapPlcListEndpoint(app);
        MapFolderEndpoints(app);
        MapFolderTagEndpoints(app);
        MapTempTagEndpoints(app);
        MapAlarmFolderEndpoints(app);
        MapAlarmTagEndpoints(app);
        MapMonitorEndpoints(app);
    }

    // ================= 실시간 모니터링 — PLC를 새로 두드리지 않고, LiveTagMonitorService/
    // TempMonitorService가 이미 폴링해서 메모리(또는 tb_temp_snapshot)에 들고 있는 값만 꺼내 보여준다 =================
    private static void MapMonitorEndpoints(WebApplication app)
    {
        // GET /api/admin/monitor/foldertags?folderId= (생략 시 전체) — FolderTagValues(메모리) 그대로 조회
        app.MapGet("/api/admin/monitor/foldertags", async (int? folderId, LiveTagMonitorService monitor, PlcRepository repo) =>
        {
            try
            {
                var list = await QueryFolderTags(repo, folderId);
                var tags = list.Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    address = t.Address,
                    folderId = t.FolderId,
                    folderName = t.FolderName,
                    plcId = t.PlcId,
                    value = monitor.FolderTagValues.TryGetValue(t.Id, out var v) ? v : null
                });
                return Results.Ok(new { success = true, lastPollAt = monitor.LastPollAt, tags });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/monitor/alarmtags?folderId= (생략 시 전체) — AlarmTagValues(메모리, ON/OFF) 그대로 조회
        app.MapGet("/api/admin/monitor/alarmtags", async (int? folderId, LiveTagMonitorService monitor, PlcRepository repo) =>
        {
            try
            {
                var list = await QueryAlarmTags(repo, folderId);
                var tags = list.Select(t => new
                {
                    tagId = t.TagId,
                    tagName = t.TagName,
                    address = t.Address,
                    plcId = t.PlcId,
                    folderName = t.FolderName,
                    alarmMsg = t.AlarmMsg,
                    level = t.Level,
                    isOn = monitor.AlarmTagValues.TryGetValue(t.TagId, out var v) ? (bool?)v : null
                });
                return Results.Ok(new { success = true, lastPollAt = monitor.LastPollAt, tags });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/monitor/temptags?equipId=&minutes=60 (생략 시 전체/60분)
        //   tb_temp_snapshot에서 최근 N분 치를 태그별 col_name 컬럼으로 뽑아 트렌드(시계열)로 재구성한다.
        //   col_name은 태그 등록 시 SafeColumnName으로 이미 검증된 값만 DB에 들어올 수 있어
        //   여기서 SELECT 컬럼 목록에 직접 꽂아도 SQL 인젝션 위험이 없다.
        app.MapGet("/api/admin/monitor/temptags", async (string? equipId, int? minutes, PlcRepository repo) =>
        {
            try
            {
                var tempTags = await QueryTempTags(repo, equipId);
                if (tempTags.Count == 0) return Results.Ok(new { success = true, tags = Array.Empty<object>() });

                int mins = minutes is > 0 ? minutes.Value : 60;
                var colNames = tempTags.Select(t => t.ColName).Distinct().ToList();
                string selectCols = string.Join(", ", colNames.Select(c => $"`{c}`"));

                var seriesByCol = colNames.ToDictionary(c => c, _ => new List<(string T, double V)>());
                using (var conn = new MySqlConnection(repo.ConnectionString))
                {
                    await conn.OpenAsync();
                    using var cmd = new MySqlCommand($@"
SELECT record_time, {selectCols} FROM tb_temp_snapshot
 WHERE record_time >= DATE_SUB(NOW(), INTERVAL @mins MINUTE)
 ORDER BY record_time ASC", conn);
                    cmd.Parameters.AddWithValue("@mins", mins);
                    using var rd = await cmd.ExecuteReaderAsync();
                    while (await rd.ReadAsync())
                    {
                        string time = rd.GetDateTime(0).ToString("o");
                        for (int i = 0; i < colNames.Count; i++)
                        {
                            int ordinal = i + 1;
                            if (!rd.IsDBNull(ordinal))
                                seriesByCol[colNames[i]].Add((time, rd.GetDouble(ordinal)));
                        }
                    }
                }

                var tags = tempTags.Select(t => new
                {
                    tempId = t.TempId,
                    tagName = t.TagName,
                    trendName = t.TrendName,
                    equipId = t.EquipId,
                    current = seriesByCol[t.ColName].Count > 0 ? seriesByCol[t.ColName][^1].V : (double?)null,
                    series = seriesByCol[t.ColName].Select(s => new { t = s.T, v = s.V })
                });
                return Results.Ok(new { success = true, tags });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/monitor/taglog?limit=50 — 값 쓰기 이력(tb_tag_log) 최근 N건.
        // 모니터링 태그 값쓰기 패널이 빈 공간을 채우는 용도로 쓴다. 쓰기 자체가 없었으면 빈 배열.
        app.MapGet("/api/admin/monitor/taglog", async (int? limit, PlcRepository repo) =>
        {
            try
            {
                int take = Math.Clamp(limit ?? 50, 1, 500);
                var logs = new List<object>();
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using (var cmd = new MySqlCommand(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='tb_tag_log'", conn))
                {
                    if (Convert.ToInt64(await cmd.ExecuteScalarAsync()) == 0)
                        return Results.Ok(new { success = true, logs = Array.Empty<object>() }); // 아직 한 번도 안 써봄
                }
                using var sel = new MySqlCommand(@"
SELECT log_id, tag_type, tag_id, tag_name, address, plc_id, old_value, new_value, written_at
  FROM tb_tag_log ORDER BY written_at DESC, log_id DESC LIMIT @take", conn);
                sel.Parameters.AddWithValue("@take", take);
                using var rd = await sel.ExecuteReaderAsync();
                while (await rd.ReadAsync())
                {
                    logs.Add(new
                    {
                        logId = rd.GetInt64(0),
                        tagType = rd.GetString(1),
                        tagId = rd.IsDBNull(2) ? (int?)null : rd.GetInt32(2),
                        tagName = rd.IsDBNull(3) ? null : rd.GetString(3),
                        address = rd.GetString(4),
                        plcId = rd.GetString(5),
                        oldValue = rd.IsDBNull(6) ? (int?)null : rd.GetInt32(6),
                        newValue = rd.GetInt32(7),
                        writtenAt = rd.GetDateTime(8)
                    });
                }
                return Results.Ok(new { success = true, logs });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/monitor/pollstatus — PLC 관리 화면 우측 패널용. 백그라운드 폴링 두 서비스
        // (LiveTagMonitorService=알람+폴더 통합, TempMonitorService=온도)가 지금 PLC별로 어떻게
        // 묶여서 도는지, 한 사이클에 실제 몇 ms 걸리는지, 최근 실패가 있었는지를 그대로 보여준다.
        // PLC를 새로 두드리지 않는다 — 두 서비스가 이미 들고 있는 값만 꺼낸다.
        app.MapGet("/api/admin/monitor/pollstatus", (LiveTagMonitorService liveMonitor, TempMonitorService tempMonitor) =>
        {
            var liveFailures = liveMonitor.RecentFailures.Select(f => new
            {
                at = f.At, source = "알람/폴더", plcId = f.PlcId, device = f.Device, message = f.Message
            });
            var tempFailures = tempMonitor.RecentFailures.Select(f => new
            {
                at = f.At, source = "온도", plcId = f.PlcId, device = f.Device, message = f.Message
            });
            var failures = liveFailures.Concat(tempFailures).OrderByDescending(f => f.at).Take(30);

            return Results.Ok(new
            {
                success = true,
                live = new
                {
                    intervalMs = liveMonitor.IntervalMs,
                    chunkSize = liveMonitor.ChunkSize,
                    lastCycleDurationMs = liveMonitor.LastCycleDurationMs,
                    lastPollAt = liveMonitor.LastPollAt,
                    groups = liveMonitor.GetPollGroups(),
                    durationHistory = liveMonitor.DurationHistory.Select(h => new { at = h.At, ms = h.DurationMs })
                },
                temp = new
                {
                    intervalMs = tempMonitor.IntervalMs,
                    lastCycleDurationMs = tempMonitor.LastCycleDurationMs,
                    lastPollAt = tempMonitor.LastPollAt,
                    tagCount = tempMonitor.LastTagCount,
                    durationHistory = tempMonitor.DurationHistory.Select(h => new { at = h.At, ms = h.DurationMs })
                },
                failures
            });
        });

        // POST /api/admin/monitor/ai-diagnosis  body: pollstatus가 이미 내려준 { live, temp, failures } 그대로
        //   PLC를 새로 두드리거나 DB를 새로 조회하지 않는다 — 프론트가 이미 가지고 있는 상태 요약을
        //   그대로 받아서 로컬 Ollama(같은 PC, http://localhost:11434)에게 "지금 상황을 설명해달라"고
        //   물어본 결과만 돌려준다. Ollama가 안 켜져 있거나 느리면 success:false로 응답한다.
        app.MapPost("/api/admin/monitor/ai-diagnosis", async (HttpRequest req) =>
        {
            try
            {
                using var reader = new StreamReader(req.Body);
                string body = await reader.ReadToEndAsync();
                using var doc = JsonDocument.Parse(body);

                string prompt = BuildDiagnosisPrompt(doc.RootElement);

                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
                var ollamaReq = new { model = "qwen2.5:3b", prompt, stream = false };
                var resp = await http.PostAsJsonAsync("http://localhost:11434/api/generate", ollamaReq);
                if (!resp.IsSuccessStatusCode)
                    return Results.Ok(new { success = false, error = $"Ollama 응답 오류: {resp.StatusCode}" });

                var ollamaJson = await resp.Content.ReadFromJsonAsync<JsonElement>();
                string analysis = ollamaJson.TryGetProperty("response", out var respProp) ? (respProp.GetString() ?? "") : "";
                return Results.Ok(new { success = true, analysis = analysis.Trim() });
            }
            catch (HttpRequestException ex)
            {
                return Results.Ok(new { success = false, error = $"Ollama에 연결할 수 없습니다(로컬에서 실행 중인지 확인하세요): {ex.Message}" });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    // pollstatus 응답(JSON)을 그대로 받아 Ollama에게 물어볼 한국어 프롬프트로 조립한다.
    // 실패 로그는 프롬프트가 너무 길어지지 않도록 최근 15건까지만 포함한다.
    private static string BuildDiagnosisPrompt(JsonElement root)
    {
        var sb = new StringBuilder();
        sb.AppendLine("당신은 공장 PLC 통신 모니터링 시스템의 진단 도우미입니다. 아래 현재 상태를 보고 한국어로, " +
                       "5줄 이내로 짧고 실용적으로 현재 상황·원인 추정·조치 방법을 설명해주세요.");
        sb.AppendLine();

        if (root.TryGetProperty("live", out var live))
        {
            sb.AppendLine($"[알람+폴더 태그 폴링] 주기 {live.GetProperty("intervalMs").GetInt32()}ms, " +
                           $"최근 한 바퀴 소요시간 {live.GetProperty("lastCycleDurationMs").GetInt64()}ms");
            if (live.TryGetProperty("groups", out var groups))
                foreach (var g in groups.EnumerateArray())
                    sb.AppendLine($"  - {g.GetProperty("plcLabel").GetString()}({g.GetProperty("plcId").GetString()}): " +
                                  $"폴더 {g.GetProperty("folderTagCount").GetInt32()}개, 알람 {g.GetProperty("alarmTagCount").GetInt32()}개");
        }
        if (root.TryGetProperty("temp", out var temp))
        {
            sb.AppendLine($"[온도 태그 폴링] 주기 {temp.GetProperty("intervalMs").GetInt32()}ms, " +
                           $"최근 한 바퀴 소요시간 {temp.GetProperty("lastCycleDurationMs").GetInt64()}ms, " +
                           $"태그 {temp.GetProperty("tagCount").GetInt32()}개");
        }

        sb.AppendLine();
        int failureCount = root.TryGetProperty("failures", out var failures) ? failures.GetArrayLength() : 0;
        if (failureCount > 0)
        {
            sb.AppendLine("[최근 실패 로그]");
            int i = 0;
            foreach (var f in failures.EnumerateArray())
            {
                if (i++ >= 15) break;
                sb.AppendLine($"  - {f.GetProperty("plcId").GetString()}: {f.GetProperty("message").GetString()}");
            }
        }
        else
        {
            sb.AppendLine("[최근 실패 로그] 없음 — 모든 PLC 정상 통신 중");
        }

        return sb.ToString();
    }

    // col_name으로 쓸 수 있는 안전한 식별자인지 검사.
    // tb_temp_snapshot에 `ALTER TABLE ... ADD COLUMN `{col}` DOUBLE` 형태로 그대로 꽂히므로
    // 영문/숫자/밑줄만 허용해서 SQL 식별자 주입(백틱 탈출 등)을 원천 차단한다.
    // 맨 앞이 숫자여도 허용한다 — MySQL은 백틱으로 감싸면 숫자로 시작하는 식별자도 유효하고,
    // 실제로 기존 온도 태그(No.1/No.2 Zone)의 col_name이 "1zone"/"2zone"라 숫자로 시작한다.
    // 앞글자를 강제하면 이 기존 태그를 수정/재업로드할 때마다 검증에 걸려 저장이 안 되는 문제가 있었다.
    private static readonly Regex SafeColumnName = new(@"^[A-Za-z0-9_]{1,64}$", RegexOptions.Compiled);

    private static bool IsFkRestrict(MySqlException ex) => ex.Number is 1451 or 1452;

    // "사용" 엑셀 컬럼 파싱 — 비우면 기본 true(신규 등록 폼과 동일한 기본값), 0/false/N 계열만 false.
    private static bool ParseEnabledCell(string? v)
    {
        if (string.IsNullOrWhiteSpace(v)) return true;
        var t = v.Trim();
        return !(t == "0" || t.Equals("false", StringComparison.OrdinalIgnoreCase) || t.Equals("N", StringComparison.OrdinalIgnoreCase));
    }

    // ── 엑셀 공용 헬퍼: 워크시트 1행을 헤더로 보고, 그 아래 행들을 "헤더텍스트→값(문자열)" 딕셔너리로 읽는다.
    // 인덱스가 아니라 헤더 텍스트로 찾기 때문에, 사용자가 엑셀에서 컬럼 순서를 바꿔도 안전하다.
    private static List<Dictionary<string, string>> ReadXlsxRows(Stream stream)
    {
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheet(1);
        var headers = new List<string>();
        int col = 1;
        while (!ws.Cell(1, col).IsEmpty())
        {
            headers.Add(ws.Cell(1, col).GetString().Trim());
            col++;
        }

        var rows = new List<Dictionary<string, string>>();
        int lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
        for (int r = 2; r <= lastRow; r++)
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            bool anyValue = false;
            for (int c = 0; c < headers.Count; c++)
            {
                var cell = ws.Cell(r, c + 1);
                string val = cell.IsEmpty() ? "" : cell.GetString().Trim();
                if (val.Length > 0) anyValue = true;
                dict[headers[c]] = val;
            }
            if (anyValue) rows.Add(dict);
        }
        return rows;
    }

    // ── 엑셀 공용 헬퍼: 헤더 배열 + 행 데이터로 .xlsx 바이트를 만든다.
    private static byte[] WriteXlsx(string sheetName, string[] headers, IEnumerable<object?[]> rows)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(sheetName);
        for (int i = 0; i < headers.Length; i++) ws.Cell(1, i + 1).Value = headers[i];
        ws.Row(1).Style.Font.Bold = true;
        ws.Row(1).Style.Fill.BackgroundColor = XLColor.FromArgb(0xE3, 0xF1, 0xF5);
        ws.SheetView.FreezeRows(1);

        int r = 2;
        foreach (var row in rows)
        {
            for (int c = 0; c < row.Length; c++)
            {
                var cell = ws.Cell(r, c + 1);
                switch (row[c])
                {
                    case null: cell.Value = ""; break;
                    case int iv: cell.Value = iv; break;
                    case bool bv: cell.Value = bv ? 1 : 0; break;
                    default: cell.Value = row[c]!.ToString(); break;
                }
            }
            r++;
        }
        ws.Columns().AdjustToContents(1, Math.Min(r - 1, 500));
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // ================= 공용: PLC 목록 (드롭다운용) =================
    private static readonly HashSet<string> KnownPlcTypes = new(StringComparer.OrdinalIgnoreCase) { "LS", "MITSUBISHI", "MODBUS_TCP" };

    private static void MapPlcListEndpoint(WebApplication app)
    {
        // GET /api/admin/plcs — "PLC 관리" 탭의 목록이자, 다른 태그 등록 폼들의 "PLC 선택" 드롭다운도
        // 같은 응답을 그대로 재사용한다(둘 다 tb_plc 전체 목록이 필요할 뿐이라 API를 나눌 이유가 없음).
        app.MapGet("/api/admin/plcs", async (PlcRepository repo) =>
        {
            var list = await repo.GetAllAsync();
            return Results.Ok(new
            {
                success = true,
                plcs = list.Select(p => new { plcId = p.Id, label = p.Label, ip = p.Ip, port = p.Port, plcType = p.PlcType, enabled = p.Enabled })
            });
        });

        // POST /api/admin/plcs  body: { plcId, ip, port, plcType, label, enabled? }
        //   plc_id가 PK라 신규 등록 때 이미 있는 id를 쓰면 기존 PLC 설정을 덮어쓰는 사고가 될 수 있어
        //   생성 전에 먼저 존재 여부를 확인한다(수정은 아래 PUT에서 id를 route로 고정해서 처리).
        app.MapPost("/api/admin/plcs", async (PlcAdminRequest req, PlcRepository repo) =>
        {
            var err = ValidatePlcBasics(req.PlcId, req.Ip, req.Label, req.PlcType, req.Port);
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                if (await repo.GetByIdAsync(req.PlcId.Trim()) != null)
                    return Results.Ok(new { success = false, error = "이미 존재하는 PLC ID입니다" });
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
INSERT INTO tb_plc(plc_id, ip, port, plc_type, label, enabled, created_at, updated_at)
VALUES (@id, @ip, @port, @type, @label, @enabled, NOW(), NOW())", conn);
                cmd.Parameters.AddWithValue("@id", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@ip", req.Ip.Trim());
                cmd.Parameters.AddWithValue("@port", req.Port);
                cmd.Parameters.AddWithValue("@type", req.PlcType.Trim().ToUpperInvariant());
                cmd.Parameters.AddWithValue("@label", req.Label.Trim());
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, plcId = req.PlcId.Trim() });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // PUT /api/admin/plcs/{id}  body: { ip, port, plcType, label, enabled? } — plc_id(PK)는 route로 고정,
        //   본문으로 바꿀 수 없다(다른 태그들이 문자열로 참조하고 있어 여기서 바뀌면 전부 끊어짐).
        app.MapPut("/api/admin/plcs/{id}", async (string id, PlcAdminRequest req, PlcRepository repo) =>
        {
            var err = ValidatePlcBasics(id, req.Ip, req.Label, req.PlcType, req.Port);
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
UPDATE tb_plc SET ip=@ip, port=@port, plc_type=@type, label=@label, enabled=@enabled, updated_at=NOW()
 WHERE plc_id=@id", conn);
                cmd.Parameters.AddWithValue("@ip", req.Ip.Trim());
                cmd.Parameters.AddWithValue("@port", req.Port);
                cmd.Parameters.AddWithValue("@type", req.PlcType.Trim().ToUpperInvariant());
                cmd.Parameters.AddWithValue("@label", req.Label.Trim());
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/plcs/{id}/usage — 삭제 확인창에 "이 PLC를 쓰는 태그가 몇 개 있는지" 보여주기 위한 사전 조회.
        //   folders_tags/tb_temp_tag는 plc_id에 FK가 없어 삭제해도 조용히 고아 참조로 남고,
        //   tb_alarm_tag만 FK가 SET NULL이라 삭제 시 자동으로 plc_id가 비워진다 — 셋 다 "막지는" 않는다.
        app.MapGet("/api/admin/plcs/{id}/usage", async (string id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                async Task<int> CountAsync(string table, string col)
                {
                    using var cmd = new MySqlCommand($"SELECT COUNT(*) FROM {table} WHERE {col}=@id", conn);
                    cmd.Parameters.AddWithValue("@id", id);
                    return Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }
                int folderTags = await CountAsync("folders_tags", "plc_id");
                int tempTags = await CountAsync("tb_temp_tag", "plc_id");
                int alarmTags = await CountAsync("tb_alarm_tag", "plc_id");
                return Results.Ok(new { success = true, folderTags, tempTags, alarmTags });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // DELETE /api/admin/plcs/{id}
        app.MapDelete("/api/admin/plcs/{id}", async (string id, PlcRepository repo) =>
        {
            try
            {
                bool ok = await repo.RemoveAsync(id);
                return Results.Ok(new { success = ok });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    private static string? ValidatePlcBasics(string? plcId, string? ip, string? label, string? plcType, int port)
    {
        if (string.IsNullOrWhiteSpace(plcId)) return "PLC ID는 필수입니다";
        if (string.IsNullOrWhiteSpace(ip)) return "IP는 필수입니다";
        if (string.IsNullOrWhiteSpace(label)) return "이름(label)은 필수입니다";
        if (string.IsNullOrWhiteSpace(plcType) || !KnownPlcTypes.Contains(plcType.Trim())) return "타입은 LS/MITSUBISHI/MODBUS_TCP 중 하나여야 합니다";
        if (port is < 1 or > 65535) return "포트는 1~65535 사이여야 합니다";
        return null;
    }

    // ================= 폴더 (folders) — 모니터링 태그가 속하는 폴더 =================
    private static void MapFolderEndpoints(WebApplication app)
    {
        // GET /api/admin/folders — 전체 폴더 목록 (트리 구성은 프론트에서 parentId로 조립)
        app.MapGet("/api/admin/folders", async (PlcRepository repo) =>
        {
            try
            {
                var list = new List<object>();
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("SELECT id, name, parent_id FROM folders ORDER BY id", conn);
                using var rd = await cmd.ExecuteReaderAsync();
                while (await rd.ReadAsync())
                    list.Add(new { id = rd.GetInt32(0), name = rd.GetString(1), parentId = rd.IsDBNull(2) ? (int?)null : rd.GetInt32(2) });
                return Results.Ok(new { success = true, folders = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // POST /api/admin/folders  body: { name, parentId? }
        app.MapPost("/api/admin/folders", async (FolderRequest req, PlcRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.Ok(new { success = false, error = "폴더 이름은 필수입니다" });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("INSERT INTO folders(name, parent_id) VALUES (@name, @parentId)", conn);
                cmd.Parameters.AddWithValue("@name", req.Name.Trim());
                cmd.Parameters.AddWithValue("@parentId", (object?)req.ParentId ?? DBNull.Value);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, id = (int)cmd.LastInsertedId });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 상위 폴더입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // PUT /api/admin/folders/{id}  body: { name, parentId? }
        app.MapPut("/api/admin/folders/{id:int}", async (int id, FolderRequest req, PlcRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.Ok(new { success = false, error = "폴더 이름은 필수입니다" });
            if (req.ParentId == id)
                return Results.Ok(new { success = false, error = "자기 자신을 상위 폴더로 지정할 수 없습니다" });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("UPDATE folders SET name=@name, parent_id=@parentId WHERE id=@id", conn);
                cmd.Parameters.AddWithValue("@name", req.Name.Trim());
                cmd.Parameters.AddWithValue("@parentId", (object?)req.ParentId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 상위 폴더입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // DELETE /api/admin/folders/{id}
        //   주의: folders_tags.folder_id와 folders.parent_id 둘 다 FK가 ON DELETE CASCADE라,
        //   이 폴더 삭제는 안의 태그/하위 폴더까지 DB가 조용히 함께 지운다(막아주지 않음).
        //   그래서 되돌릴 수 없는 개수 경고는 프론트(tags.js)가 삭제 전 태그 목록을 먼저 조회해서 보여준다.
        app.MapDelete("/api/admin/folders/{id:int}", async (int id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("DELETE FROM folders WHERE id=@id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    // ================= 모니터링 태그 (folders_tags) =================
    private static void MapFolderTagEndpoints(WebApplication app)
    {
        // GET /api/admin/foldertags?folderId=4 (생략 시 전체 폴더 통틀어 전부) — 관리 화면용 "정의" 목록
        // (값이 아니라 정의. 값 조회는 /api/foldertag/values)
        app.MapGet("/api/admin/foldertags", async (int? folderId, PlcRepository repo) =>
        {
            try
            {
                var list = await QueryFolderTags(repo, folderId);
                return Results.Ok(new { success = true, tags = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/foldertags/export?folderId=4 (생략 시 전체) — 엑셀 다운로드
        app.MapGet("/api/admin/foldertags/export", async (int? folderId, PlcRepository repo) =>
        {
            var list = await QueryFolderTags(repo, folderId);
            var rows = list.Select(t => new object?[] { t.Id, t.FolderId, t.FolderName, t.Name, t.Address, t.PlcId, t.Type, t.Enabled ? 1 : 0 });
            var bytes = WriteXlsx("모니터링태그", new[] { "ID", "폴더ID", "폴더명(참고용,수정무시)", "태그이름", "주소", "PLC ID", "타입", "사용(1/0)" }, rows);
            return Results.File(bytes, XlsxContentType, $"monitoring_tags_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        });

        // POST /api/admin/foldertags/import?folderId=4 — 엑셀 업로드로 일괄 등록/수정
        //   행의 "폴더ID"가 비어있으면 이 folderId(현재 화면에서 선택된 폴더)를 기본값으로 쓴다.
        //   "ID"가 있고 실제 존재하는 태그면 수정, 없으면 신규 등록. 한 행 실패해도 나머지는 계속 처리한다.
        app.MapPost("/api/admin/foldertags/import", async (IFormFile file, int? folderId, PlcRepository repo) =>
        {
            List<Dictionary<string, string>> rows;
            try
            {
                using var stream = file.OpenReadStream();
                rows = ReadXlsxRows(stream);
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = "엑셀 파일을 읽을 수 없습니다: " + ex.Message }); }

            int inserted = 0, updated = 0;
            var errors = new List<string>();
            using var conn = new MySqlConnection(repo.ConnectionString);
            await conn.OpenAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int excelRow = i + 2;
                string name = row.GetValueOrDefault("태그이름", "");
                string address = row.GetValueOrDefault("주소", "");
                string plcId = row.GetValueOrDefault("PLC ID", "");
                string type = row.GetValueOrDefault("타입", "WORD");
                bool enabled = ParseEnabledCell(row.GetValueOrDefault("사용(1/0)", ""));
                int? fid = int.TryParse(row.GetValueOrDefault("폴더ID", ""), out var pf) ? pf : folderId;

                var err = ValidateTagBasics(name, address, plcId);
                if (err == null && fid == null) err = "폴더ID가 없고 기본 폴더도 지정되지 않았습니다";
                if (err != null) { errors.Add($"{excelRow}행: {err}"); continue; }

                bool hasId = int.TryParse(row.GetValueOrDefault("ID", ""), out var id) && id > 0;
                try
                {
                    if (hasId)
                    {
                        using var cmd = new MySqlCommand(@"
UPDATE folders_tags SET folder_id=@fid, name=@name, address=@addr, plc_id=@plc, type=@type, enabled=@en WHERE id=@id", conn);
                        cmd.Parameters.AddWithValue("@fid", fid);
                        cmd.Parameters.AddWithValue("@name", name.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@type", string.IsNullOrWhiteSpace(type) ? "WORD" : type.Trim());
                        cmd.Parameters.AddWithValue("@en", enabled);
                        cmd.Parameters.AddWithValue("@id", id);
                        int n = await cmd.ExecuteNonQueryAsync();
                        if (n > 0) updated++; else errors.Add($"{excelRow}행: ID {id}인 태그를 찾을 수 없습니다");
                    }
                    else
                    {
                        using var cmd = new MySqlCommand(@"
INSERT INTO folders_tags(folder_id, name, address, plc_id, type, enabled) VALUES (@fid, @name, @addr, @plc, @type, @en)", conn);
                        cmd.Parameters.AddWithValue("@fid", fid);
                        cmd.Parameters.AddWithValue("@name", name.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@type", string.IsNullOrWhiteSpace(type) ? "WORD" : type.Trim());
                        cmd.Parameters.AddWithValue("@en", enabled);
                        await cmd.ExecuteNonQueryAsync();
                        inserted++;
                    }
                }
                catch (MySqlException ex) when (ex.Number == 1062) { errors.Add($"{excelRow}행: 같은 이름의 태그가 이미 있습니다"); }
                catch (Exception ex) { errors.Add($"{excelRow}행: {ex.Message}"); }
            }

            return Results.Ok(new { success = true, inserted, updated, errors });
        }).DisableAntiforgery(); // 이 관리 화면은 인증/세션이 아예 없는 내부망 전용 도구라 CSRF 토큰이 막을 대상이 없다.

        // POST /api/admin/foldertags  body: { folderId, name, address, plcId, type?, enabled? }
        app.MapPost("/api/admin/foldertags", async (FolderTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.Name, req.Address, req.PlcId);
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
INSERT INTO folders_tags(folder_id, name, address, plc_id, type, enabled)
VALUES (@folderId, @name, @address, @plcId, @type, @enabled)", conn);
                cmd.Parameters.AddWithValue("@folderId", req.FolderId);
                cmd.Parameters.AddWithValue("@name", req.Name.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@type", string.IsNullOrWhiteSpace(req.Type) ? "WORD" : req.Type.Trim());
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, id = (int)cmd.LastInsertedId });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Results.Ok(new { success = false, error = "이 폴더에 같은 이름의 태그가 이미 있습니다" }); }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 폴더입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // PUT /api/admin/foldertags/{id}  body: { folderId, name, address, plcId, type?, enabled? }
        app.MapPut("/api/admin/foldertags/{id:int}", async (int id, FolderTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.Name, req.Address, req.PlcId);
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
UPDATE folders_tags SET folder_id=@folderId, name=@name, address=@address, plc_id=@plcId, type=@type, enabled=@enabled
 WHERE id=@id", conn);
                cmd.Parameters.AddWithValue("@folderId", req.FolderId);
                cmd.Parameters.AddWithValue("@name", req.Name.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@type", string.IsNullOrWhiteSpace(req.Type) ? "WORD" : req.Type.Trim());
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Results.Ok(new { success = false, error = "이 폴더에 같은 이름의 태그가 이미 있습니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // DELETE /api/admin/foldertags/{id}
        app.MapDelete("/api/admin/foldertags/{id:int}", async (int id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("DELETE FROM folders_tags WHERE id=@id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    private sealed record FolderTagRow(int Id, int FolderId, string FolderName, string Name, string Address, string PlcId, string Type, bool Enabled);

    // folderId 생략 시 전체 폴더 통틀어 조회 — "전체" 화면과 엑셀 내보내기 둘 다 이 헬퍼를 공용으로 쓴다.
    private static async Task<List<FolderTagRow>> QueryFolderTags(PlcRepository repo, int? folderId)
    {
        var list = new List<FolderTagRow>();
        using var conn = new MySqlConnection(repo.ConnectionString);
        await conn.OpenAsync();
        string sql = @"
SELECT t.id, t.folder_id, f.name AS folder_name, t.name, t.address, t.plc_id, t.type, t.enabled
  FROM folders_tags t JOIN folders f ON t.folder_id = f.id";
        if (folderId.HasValue) sql += " WHERE t.folder_id=@fid";
        sql += " ORDER BY f.name, t.id";
        using var cmd = new MySqlCommand(sql, conn);
        if (folderId.HasValue) cmd.Parameters.AddWithValue("@fid", folderId.Value);
        using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
            list.Add(new FolderTagRow(
                rd.GetInt32(0), rd.GetInt32(1), rd.GetString(2), rd.GetString(3),
                rd.IsDBNull(4) ? "" : rd.GetString(4), rd.IsDBNull(5) ? "" : rd.GetString(5),
                rd.IsDBNull(6) ? "" : rd.GetString(6), rd.GetBoolean(7)));
        return list;
    }

    // ================= 온도 태그 (tb_temp_tag) =================

    // col_name이 바뀔 때 tb_temp_snapshot의 실제 컬럼도 같이 맞춘다.
    // 예전 컬럼이 있고 새 이름 컬럼이 아직 없으면 진짜 컬럼 RENAME(CHANGE COLUMN)으로 과거 데이터를 그대로 이어간다.
    // 새 이름이 이미 다른 컬럼으로 존재하면(충돌) 덮어쓰지 않고 컬럼 존재만 보장한 뒤 경고 문구를 돌려준다.
    private static async Task<string?> EnsureTempSnapshotColumnRenamed(MySqlConnection conn, string? oldColName, string newColName)
    {
        if (string.IsNullOrEmpty(oldColName) || oldColName.Equals(newColName, StringComparison.OrdinalIgnoreCase))
        {
            using var ensure = new MySqlCommand("ALTER TABLE tb_temp_snapshot ADD COLUMN IF NOT EXISTS `" + newColName + "` DOUBLE", conn);
            await ensure.ExecuteNonQueryAsync();
            return null;
        }

        async Task<bool> ColumnExists(string name)
        {
            using var cmd = new MySqlCommand(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tb_temp_snapshot' AND column_name = @c", conn);
            cmd.Parameters.AddWithValue("@c", name);
            return Convert.ToInt64(await cmd.ExecuteScalarAsync()) > 0;
        }

        bool oldExists = await ColumnExists(oldColName);
        bool newExists = await ColumnExists(newColName);

        if (oldExists && !newExists)
        {
            using var rename = new MySqlCommand("ALTER TABLE tb_temp_snapshot CHANGE COLUMN `" + oldColName + "` `" + newColName + "` DOUBLE", conn);
            await rename.ExecuteNonQueryAsync();
            return null;
        }

        using (var ensure = new MySqlCommand("ALTER TABLE tb_temp_snapshot ADD COLUMN IF NOT EXISTS `" + newColName + "` DOUBLE", conn))
            await ensure.ExecuteNonQueryAsync();

        return oldExists && newExists
            ? $"컬럼 '{newColName}'이 이미 존재해 이전 컬럼('{oldColName}')의 과거 데이터를 자동으로 옮기지 못했습니다. 필요하면 DB에서 직접 병합하세요."
            : null;
    }

    private static void MapTempTagEndpoints(WebApplication app)
    {
        // GET /api/admin/temptags?equipId=BCF1 (선택) — equipId 생략 시 전체
        app.MapGet("/api/admin/temptags", async (string? equipId, PlcRepository repo) =>
        {
            try
            {
                var list = await QueryTempTags(repo, equipId);
                return Results.Ok(new { success = true, tags = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/temptags/export?equipId=BCF1 (선택)
        app.MapGet("/api/admin/temptags/export", async (string? equipId, PlcRepository repo) =>
        {
            var list = await QueryTempTags(repo, equipId);
            var rows = list.Select(t => new object?[] { t.TempId, t.TagName, t.Address, t.PlcId, t.ColName, t.TrendName, t.Scale, t.EquipId, t.Enabled ? 1 : 0 });
            var bytes = WriteXlsx("온도태그", new[] { "ID", "태그이름", "주소", "PLC ID", "컬럼명", "트렌드명", "스케일", "설비", "사용(1/0)" }, rows);
            return Results.File(bytes, XlsxContentType, $"temp_tags_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        });

        // POST /api/admin/temptags/import — 엑셀 업로드로 일괄 등록/수정 (신규 행은 컬럼도 즉시 생성)
        app.MapPost("/api/admin/temptags/import", async (IFormFile file, PlcRepository repo) =>
        {
            List<Dictionary<string, string>> rows;
            try
            {
                using var stream = file.OpenReadStream();
                rows = ReadXlsxRows(stream);
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = "엑셀 파일을 읽을 수 없습니다: " + ex.Message }); }

            int inserted = 0, updated = 0;
            var errors = new List<string>();
            using var conn = new MySqlConnection(repo.ConnectionString);
            await conn.OpenAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int excelRow = i + 2;
                string tagName = row.GetValueOrDefault("태그이름", "");
                string address = row.GetValueOrDefault("주소", "");
                string plcId = row.GetValueOrDefault("PLC ID", "");
                string colName = row.GetValueOrDefault("컬럼명", "").Trim();
                string trendName = row.GetValueOrDefault("트렌드명", "");
                string scale = row.GetValueOrDefault("스케일", "");
                string equipId = row.GetValueOrDefault("설비", "");
                bool enabled = ParseEnabledCell(row.GetValueOrDefault("사용(1/0)", ""));

                var err = ValidateTagBasics(tagName, address, plcId);
                if (err == null && colName.Length == 0) err = "컬럼명이 없습니다";
                if (err == null && !SafeColumnName.IsMatch(colName)) err = "컬럼명은 영문/숫자/밑줄만 가능합니다";
                if (err != null) { errors.Add($"{excelRow}행: {err}"); continue; }
                if (string.IsNullOrWhiteSpace(trendName)) trendName = tagName;

                bool hasId = int.TryParse(row.GetValueOrDefault("ID", ""), out var id) && id > 0;
                try
                {
                    if (hasId)
                    {
                        string? oldColName = null;
                        using (var lookup = new MySqlCommand("SELECT col_name FROM tb_temp_tag WHERE temp_id=@id", conn))
                        {
                            lookup.Parameters.AddWithValue("@id", id);
                            var found = await lookup.ExecuteScalarAsync();
                            if (found != null && found != DBNull.Value) oldColName = (string)found;
                        }
                        string? renameWarning = await EnsureTempSnapshotColumnRenamed(conn, oldColName, colName);
                        if (renameWarning != null) errors.Add($"{excelRow}행: {renameWarning}");

                        using var cmd = new MySqlCommand(@"
UPDATE tb_temp_tag SET tag_name=@tn, address=@addr, plc_id=@plc, col_name=@col, trend_name=@trend,
       scale=@scale, equip_id=@equip, enabled=@en WHERE temp_id=@id", conn);
                        cmd.Parameters.AddWithValue("@tn", tagName.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@col", colName);
                        cmd.Parameters.AddWithValue("@trend", trendName.Trim());
                        cmd.Parameters.AddWithValue("@scale", string.IsNullOrWhiteSpace(scale) ? DBNull.Value : scale.Trim());
                        cmd.Parameters.AddWithValue("@equip", string.IsNullOrWhiteSpace(equipId) ? DBNull.Value : equipId.Trim());
                        cmd.Parameters.AddWithValue("@en", enabled);
                        cmd.Parameters.AddWithValue("@id", id);
                        int n = await cmd.ExecuteNonQueryAsync();
                        if (n > 0) updated++; else errors.Add($"{excelRow}행: ID {id}인 태그를 찾을 수 없습니다");
                    }
                    else
                    {
                        using (var alter = new MySqlCommand("ALTER TABLE tb_temp_snapshot ADD COLUMN IF NOT EXISTS `" + colName + "` DOUBLE", conn))
                            await alter.ExecuteNonQueryAsync();

                        using var cmd = new MySqlCommand(@"
INSERT INTO tb_temp_tag(tag_name, address, plc_id, col_name, trend_name, scale, equip_id, enabled)
VALUES (@tn, @addr, @plc, @col, @trend, @scale, @equip, @en)", conn);
                        cmd.Parameters.AddWithValue("@tn", tagName.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@col", colName);
                        cmd.Parameters.AddWithValue("@trend", trendName.Trim());
                        cmd.Parameters.AddWithValue("@scale", string.IsNullOrWhiteSpace(scale) ? DBNull.Value : scale.Trim());
                        cmd.Parameters.AddWithValue("@equip", string.IsNullOrWhiteSpace(equipId) ? DBNull.Value : equipId.Trim());
                        cmd.Parameters.AddWithValue("@en", enabled);
                        await cmd.ExecuteNonQueryAsync();
                        inserted++;
                    }
                }
                catch (Exception ex) { errors.Add($"{excelRow}행: {ex.Message}"); }
            }

            return Results.Ok(new { success = true, inserted, updated, errors });
        }).DisableAntiforgery(); // 이 관리 화면은 인증/세션이 아예 없는 내부망 전용 도구라 CSRF 토큰이 막을 대상이 없다.

        // GET /api/admin/temptags/equipids — 설비명 자동완성용 기존 값 목록
        app.MapGet("/api/admin/temptags/equipids", async (PlcRepository repo) =>
        {
            try
            {
                var list = new List<string>();
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(
                    "SELECT DISTINCT equip_id FROM tb_temp_tag WHERE equip_id IS NOT NULL AND equip_id <> '' ORDER BY equip_id", conn);
                using var rd = await cmd.ExecuteReaderAsync();
                while (await rd.ReadAsync()) list.Add(rd.GetString(0));
                return Results.Ok(new { success = true, equipIds = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/tempsnapshot/columns — tb_temp_snapshot에 실제로 존재하는 컬럼 확인용
        // (온도 태그 저장 → 이 컬럼 목록에 즉시 반영되는 걸 화면에서 눈으로 확인시켜주는 용도)
        app.MapGet("/api/admin/tempsnapshot/columns", async (PlcRepository repo) =>
        {
            try
            {
                var list = new List<string>();
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
SELECT COLUMN_NAME FROM information_schema.columns
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_temp_snapshot'
   AND COLUMN_NAME NOT IN ('snapshot_id','record_time')
 ORDER BY ORDINAL_POSITION", conn);
                using var rd = await cmd.ExecuteReaderAsync();
                while (await rd.ReadAsync()) list.Add(rd.GetString(0));
                return Results.Ok(new { success = true, columns = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // POST /api/admin/temptags  body: { tagName, address, plcId, colName, trendName, scale?, equipId?, enabled? }
        //   저장과 동시에 tb_temp_snapshot에 col_name 컬럼을 즉시 만든다(원래 TempMonitorService가
        //   다음 30초 폴링에서 만들던 것을 화면에서 바로 확인 가능하도록 여기서도 선제적으로 실행).
        app.MapPost("/api/admin/temptags", async (TempTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.TagName, req.Address, req.PlcId);
            if (err == null && string.IsNullOrWhiteSpace(req.ColName)) err = "컬럼 이름(colName)은 필수입니다";
            if (err == null && !SafeColumnName.IsMatch(req.ColName.Trim())) err = "컬럼 이름은 영문/숫자/밑줄(_)만 가능합니다";
            if (err == null && req.ColName.Trim().Equals("snapshot_id", StringComparison.OrdinalIgnoreCase)) err = "컬럼 이름으로 사용할 수 없는 예약어입니다";
            if (err == null && req.ColName.Trim().Equals("record_time", StringComparison.OrdinalIgnoreCase)) err = "컬럼 이름으로 사용할 수 없는 예약어입니다";
            if (err != null) return Results.Ok(new { success = false, error = err });

            string colName = req.ColName.Trim();
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();

                using (var alter = new MySqlCommand("ALTER TABLE tb_temp_snapshot ADD COLUMN IF NOT EXISTS `" + colName + "` DOUBLE", conn))
                    await alter.ExecuteNonQueryAsync();

                using var cmd = new MySqlCommand(@"
INSERT INTO tb_temp_tag(tag_name, address, plc_id, col_name, trend_name, scale, equip_id, enabled)
VALUES (@tagName, @address, @plcId, @colName, @trendName, @scale, @equipId, @enabled)", conn);
                cmd.Parameters.AddWithValue("@tagName", req.TagName.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@colName", colName);
                cmd.Parameters.AddWithValue("@trendName", string.IsNullOrWhiteSpace(req.TrendName) ? req.TagName.Trim() : req.TrendName.Trim());
                cmd.Parameters.AddWithValue("@scale", (object?)req.Scale ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@equipId", (object?)req.EquipId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, id = (int)cmd.LastInsertedId, colName });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // PUT /api/admin/temptags/{id} — colName이 바뀌면 tb_temp_snapshot의 실제 컬럼도 CHANGE COLUMN으로
        //   같이 리네임해서 과거 데이터를 그대로 이어간다(새 이름이 이미 다른 컬럼과 충돌할 때만 예외적으로
        //   컬럼 생성만 보장하고 warning을 돌려준다 — EnsureTempSnapshotColumnRenamed 참고).
        app.MapPut("/api/admin/temptags/{id:int}", async (int id, TempTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.TagName, req.Address, req.PlcId);
            if (err == null && string.IsNullOrWhiteSpace(req.ColName)) err = "컬럼 이름(colName)은 필수입니다";
            if (err == null && !SafeColumnName.IsMatch(req.ColName.Trim())) err = "컬럼 이름은 영문/숫자/밑줄(_)만 가능합니다";
            if (err != null) return Results.Ok(new { success = false, error = err });

            string colName = req.ColName.Trim();
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();

                string? oldColName = null;
                using (var lookup = new MySqlCommand("SELECT col_name FROM tb_temp_tag WHERE temp_id=@id", conn))
                {
                    lookup.Parameters.AddWithValue("@id", id);
                    var found = await lookup.ExecuteScalarAsync();
                    if (found != null && found != DBNull.Value) oldColName = (string)found;
                }
                string? renameWarning = await EnsureTempSnapshotColumnRenamed(conn, oldColName, colName);

                using var cmd = new MySqlCommand(@"
UPDATE tb_temp_tag SET tag_name=@tagName, address=@address, plc_id=@plcId, col_name=@colName,
       trend_name=@trendName, scale=@scale, equip_id=@equipId, enabled=@enabled
 WHERE temp_id=@id", conn);
                cmd.Parameters.AddWithValue("@tagName", req.TagName.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@colName", colName);
                cmd.Parameters.AddWithValue("@trendName", string.IsNullOrWhiteSpace(req.TrendName) ? req.TagName.Trim() : req.TrendName.Trim());
                cmd.Parameters.AddWithValue("@scale", (object?)req.Scale ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@equipId", (object?)req.EquipId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0, colName, warning = renameWarning });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // DELETE /api/admin/temptags/{id} — 태그 정의만 삭제. tb_temp_snapshot 컬럼/과거 데이터는
        //   보존한다(과거 추세 데이터를 실수로 영구 삭제하는 사고를 방지하기 위한 의도적 설계).
        app.MapDelete("/api/admin/temptags/{id:int}", async (int id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("DELETE FROM tb_temp_tag WHERE temp_id=@id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    private sealed record TempTagRow(int TempId, string TagName, string Address, string PlcId, string ColName, string TrendName, string Scale, string EquipId, bool Enabled);

    private static async Task<List<TempTagRow>> QueryTempTags(PlcRepository repo, string? equipId)
    {
        var list = new List<TempTagRow>();
        using var conn = new MySqlConnection(repo.ConnectionString);
        await conn.OpenAsync();
        string sql = "SELECT temp_id, tag_name, address, plc_id, col_name, trend_name, scale, equip_id, enabled FROM tb_temp_tag";
        if (!string.IsNullOrWhiteSpace(equipId)) sql += " WHERE equip_id=@equipId";
        sql += " ORDER BY temp_id";
        using var cmd = new MySqlCommand(sql, conn);
        if (!string.IsNullOrWhiteSpace(equipId)) cmd.Parameters.AddWithValue("@equipId", equipId);
        using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
            list.Add(new TempTagRow(
                rd.GetInt32(0), rd.GetString(1), rd.GetString(2), rd.GetString(3), rd.GetString(4),
                rd.GetString(5), rd.IsDBNull(6) ? "" : rd.GetString(6), rd.IsDBNull(7) ? "" : rd.GetString(7), rd.GetBoolean(8)));
        return list;
    }

    // ================= 알람 폴더 (tb_alarm_folder) =================
    private static void MapAlarmFolderEndpoints(WebApplication app)
    {
        app.MapGet("/api/admin/alarmfolders", async (PlcRepository repo) =>
        {
            try
            {
                var list = await QueryAlarmFolders(repo);
                return Results.Ok(new { success = true, folders = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        app.MapPost("/api/admin/alarmfolders", async (AlarmFolderRequest req, PlcRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(req.FolderName))
                return Results.Ok(new { success = false, error = "폴더 이름은 필수입니다" });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(
                    "INSERT INTO tb_alarm_folder(folder_name, parent_id, sort_order) VALUES (@name, @parentId, @sortOrder)", conn);
                cmd.Parameters.AddWithValue("@name", req.FolderName.Trim());
                cmd.Parameters.AddWithValue("@parentId", (object?)req.ParentId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@sortOrder", req.SortOrder ?? 0);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, folderId = (int)cmd.LastInsertedId });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 상위 폴더입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        app.MapPut("/api/admin/alarmfolders/{id:int}", async (int id, AlarmFolderRequest req, PlcRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(req.FolderName))
                return Results.Ok(new { success = false, error = "폴더 이름은 필수입니다" });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(
                    "UPDATE tb_alarm_folder SET folder_name=@name, parent_id=@parentId, sort_order=@sortOrder WHERE folder_id=@id", conn);
                cmd.Parameters.AddWithValue("@name", req.FolderName.Trim());
                cmd.Parameters.AddWithValue("@parentId", (object?)req.ParentId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@sortOrder", req.SortOrder ?? 0);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 상위 폴더입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // 주의: tb_alarm_tag.folder_id와 tb_alarm_folder.parent_id 둘 다 FK가 ON DELETE CASCADE라
        // folders와 마찬가지로 이 폴더 삭제는 안의 알람 태그/하위 폴더까지 조용히 함께 지운다.
        app.MapDelete("/api/admin/alarmfolders/{id:int}", async (int id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("DELETE FROM tb_alarm_folder WHERE folder_id=@id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    private sealed record AlarmFolderRow(int FolderId, string FolderName, int? ParentId, int SortOrder);

    private static async Task<List<AlarmFolderRow>> QueryAlarmFolders(PlcRepository repo)
    {
        var list = new List<AlarmFolderRow>();
        using var conn = new MySqlConnection(repo.ConnectionString);
        await conn.OpenAsync();
        using var cmd = new MySqlCommand("SELECT folder_id, folder_name, parent_id, sort_order FROM tb_alarm_folder ORDER BY sort_order, folder_id", conn);
        using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
        {
            int fid = rd.GetInt32(0);
            int? parentId = rd.IsDBNull(2) ? null : rd.GetInt32(2);
            // 기존 데이터에 folder_id와 parent_id가 같은(자기참조) 행이 있다 — 최상위를
            // NULL 대신 자기 자신으로 표시해둔 것으로 보고, 화면에서는 "최상위"로 취급한다.
            if (parentId == fid) parentId = null;
            list.Add(new AlarmFolderRow(fid, rd.GetString(1), parentId, rd.GetInt32(3)));
        }
        return list;
    }

    // ================= 알람 태그 (tb_alarm_tag) =================
    private static void MapAlarmTagEndpoints(WebApplication app)
    {
        // folderId 생략 시 전체 알람 폴더 통틀어 전부
        app.MapGet("/api/admin/alarmtags", async (int? folderId, PlcRepository repo) =>
        {
            try
            {
                var list = await QueryAlarmTags(repo, folderId);
                return Results.Ok(new { success = true, tags = list });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // GET /api/admin/alarmtags/export?folderId=42 (생략 시 전체)
        app.MapGet("/api/admin/alarmtags/export", async (int? folderId, PlcRepository repo) =>
        {
            var list = await QueryAlarmTags(repo, folderId);
            var rows = list.Select(t => new object?[] { t.TagId, t.FolderId, t.FolderName, t.TagName, t.Address, t.PlcId, t.AlarmMsg, t.Level, t.Enabled ? 1 : 0 });
            var bytes = WriteXlsx("알람태그", new[] { "ID", "폴더ID", "폴더명(참고용,수정무시)", "태그이름", "주소", "PLC ID", "알람메시지", "레벨", "사용(1/0)" }, rows);
            return Results.File(bytes, XlsxContentType, $"alarm_tags_{DateTime.Now:yyyyMMdd_HHmm}.xlsx");
        });

        // POST /api/admin/alarmtags/import?folderId=42 — 엑셀 업로드로 일괄 등록/수정
        app.MapPost("/api/admin/alarmtags/import", async (IFormFile file, int? folderId, PlcRepository repo) =>
        {
            List<Dictionary<string, string>> rows;
            try
            {
                using var stream = file.OpenReadStream();
                rows = ReadXlsxRows(stream);
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = "엑셀 파일을 읽을 수 없습니다: " + ex.Message }); }

            int inserted = 0, updated = 0;
            var errors = new List<string>();
            using var conn = new MySqlConnection(repo.ConnectionString);
            await conn.OpenAsync();

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int excelRow = i + 2;
                string tagName = row.GetValueOrDefault("태그이름", "");
                string address = row.GetValueOrDefault("주소", "");
                string plcId = row.GetValueOrDefault("PLC ID", "");
                string alarmMsg = row.GetValueOrDefault("알람메시지", "");
                bool enabled = ParseEnabledCell(row.GetValueOrDefault("사용(1/0)", ""));
                byte level = byte.TryParse(row.GetValueOrDefault("레벨", ""), out var lv) ? lv : (byte)1;
                int? fid = int.TryParse(row.GetValueOrDefault("폴더ID", ""), out var pf) ? pf : folderId;

                var err = ValidateTagBasics(tagName, address, plcId);
                if (err == null && string.IsNullOrWhiteSpace(alarmMsg)) err = "알람 메시지가 없습니다";
                if (err == null && fid == null) err = "폴더ID가 없고 기본 폴더도 지정되지 않았습니다";
                if (err != null) { errors.Add($"{excelRow}행: {err}"); continue; }

                bool hasId = int.TryParse(row.GetValueOrDefault("ID", ""), out var id) && id > 0;
                try
                {
                    if (hasId)
                    {
                        using var cmd = new MySqlCommand(@"
UPDATE tb_alarm_tag SET folder_id=@fid, tag_name=@tn, address=@addr, plc_id=@plc, alarm_msg=@msg, level=@lv, enabled=@en
 WHERE tag_id=@id", conn);
                        cmd.Parameters.AddWithValue("@fid", fid);
                        cmd.Parameters.AddWithValue("@tn", tagName.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@msg", alarmMsg.Trim());
                        cmd.Parameters.AddWithValue("@lv", level);
                        cmd.Parameters.AddWithValue("@en", enabled);
                        cmd.Parameters.AddWithValue("@id", id);
                        int n = await cmd.ExecuteNonQueryAsync();
                        if (n > 0) updated++; else errors.Add($"{excelRow}행: ID {id}인 태그를 찾을 수 없습니다");
                    }
                    else
                    {
                        using var cmd = new MySqlCommand(@"
INSERT INTO tb_alarm_tag(folder_id, tag_name, address, plc_id, alarm_msg, level, enabled)
VALUES (@fid, @tn, @addr, @plc, @msg, @lv, @en)", conn);
                        cmd.Parameters.AddWithValue("@fid", fid);
                        cmd.Parameters.AddWithValue("@tn", tagName.Trim());
                        cmd.Parameters.AddWithValue("@addr", address.Trim());
                        cmd.Parameters.AddWithValue("@plc", plcId.Trim());
                        cmd.Parameters.AddWithValue("@msg", alarmMsg.Trim());
                        cmd.Parameters.AddWithValue("@lv", level);
                        cmd.Parameters.AddWithValue("@en", enabled);
                        await cmd.ExecuteNonQueryAsync();
                        inserted++;
                    }
                }
                catch (MySqlException ex) when (IsFkRestrict(ex)) { errors.Add($"{excelRow}행: 존재하지 않는 폴더 또는 PLC입니다"); }
                catch (Exception ex) { errors.Add($"{excelRow}행: {ex.Message}"); }
            }

            return Results.Ok(new { success = true, inserted, updated, errors });
        }).DisableAntiforgery(); // 이 관리 화면은 인증/세션이 아예 없는 내부망 전용 도구라 CSRF 토큰이 막을 대상이 없다.

        // POST /api/admin/alarmtags  body: { folderId, tagName, address, plcId, alarmMsg, level?, enabled? }
        app.MapPost("/api/admin/alarmtags", async (AlarmTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.TagName, req.Address, req.PlcId);
            if (err == null && string.IsNullOrWhiteSpace(req.AlarmMsg)) err = "알람 메시지는 필수입니다";
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
INSERT INTO tb_alarm_tag(folder_id, tag_name, address, plc_id, alarm_msg, level, enabled)
VALUES (@folderId, @tagName, @address, @plcId, @alarmMsg, @level, @enabled)", conn);
                cmd.Parameters.AddWithValue("@folderId", req.FolderId);
                cmd.Parameters.AddWithValue("@tagName", req.TagName.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@alarmMsg", req.AlarmMsg.Trim());
                cmd.Parameters.AddWithValue("@level", req.Level ?? 1);
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = true, tagId = (int)cmd.LastInsertedId });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 폴더 또는 PLC입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        // PUT /api/admin/alarmtags/{id}
        app.MapPut("/api/admin/alarmtags/{id:int}", async (int id, AlarmTagRequest req, PlcRepository repo) =>
        {
            var err = ValidateTagBasics(req.TagName, req.Address, req.PlcId);
            if (err == null && string.IsNullOrWhiteSpace(req.AlarmMsg)) err = "알람 메시지는 필수입니다";
            if (err != null) return Results.Ok(new { success = false, error = err });
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand(@"
UPDATE tb_alarm_tag SET folder_id=@folderId, tag_name=@tagName, address=@address, plc_id=@plcId,
       alarm_msg=@alarmMsg, level=@level, enabled=@enabled
 WHERE tag_id=@id", conn);
                cmd.Parameters.AddWithValue("@folderId", req.FolderId);
                cmd.Parameters.AddWithValue("@tagName", req.TagName.Trim());
                cmd.Parameters.AddWithValue("@address", req.Address.Trim());
                cmd.Parameters.AddWithValue("@plcId", req.PlcId.Trim());
                cmd.Parameters.AddWithValue("@alarmMsg", req.AlarmMsg.Trim());
                cmd.Parameters.AddWithValue("@level", req.Level ?? 1);
                cmd.Parameters.AddWithValue("@enabled", req.Enabled ?? true);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (MySqlException ex) when (IsFkRestrict(ex))
            { return Results.Ok(new { success = false, error = "존재하지 않는 폴더 또는 PLC입니다" }); }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });

        app.MapDelete("/api/admin/alarmtags/{id:int}", async (int id, PlcRepository repo) =>
        {
            try
            {
                using var conn = new MySqlConnection(repo.ConnectionString);
                await conn.OpenAsync();
                using var cmd = new MySqlCommand("DELETE FROM tb_alarm_tag WHERE tag_id=@id", conn);
                cmd.Parameters.AddWithValue("@id", id);
                int n = await cmd.ExecuteNonQueryAsync();
                return Results.Ok(new { success = n > 0 });
            }
            catch (Exception ex) { return Results.Ok(new { success = false, error = ex.Message }); }
        });
    }

    private sealed record AlarmTagRow(int TagId, int FolderId, string FolderName, string TagName, string Address, string PlcId, string AlarmMsg, byte Level, bool Enabled);

    private static async Task<List<AlarmTagRow>> QueryAlarmTags(PlcRepository repo, int? folderId)
    {
        var list = new List<AlarmTagRow>();
        using var conn = new MySqlConnection(repo.ConnectionString);
        await conn.OpenAsync();
        string sql = @"
SELECT t.tag_id, t.folder_id, f.folder_name, t.tag_name, t.address, t.plc_id, t.alarm_msg, t.level, t.enabled
  FROM tb_alarm_tag t JOIN tb_alarm_folder f ON t.folder_id = f.folder_id";
        if (folderId.HasValue) sql += " WHERE t.folder_id=@fid";
        sql += " ORDER BY f.sort_order, t.tag_id";
        using var cmd = new MySqlCommand(sql, conn);
        if (folderId.HasValue) cmd.Parameters.AddWithValue("@fid", folderId.Value);
        using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
            list.Add(new AlarmTagRow(
                rd.GetInt32(0), rd.GetInt32(1), rd.GetString(2), rd.GetString(3), rd.GetString(4),
                rd.IsDBNull(5) ? "" : rd.GetString(5), rd.GetString(6), rd.GetByte(7), rd.GetBoolean(8)));
        return list;
    }

    // 이름/주소/PLC ID처럼 세 태그 종류가 공통으로 갖는 필수값을 한 곳에서 검사.
    private static string? ValidateTagBasics(string? name, string? address, string? plcId)
    {
        if (string.IsNullOrWhiteSpace(name)) return "태그 이름은 필수입니다";
        if (string.IsNullOrWhiteSpace(address)) return "주소는 필수입니다";
        if (string.IsNullOrWhiteSpace(plcId)) return "PLC 선택은 필수입니다";
        return null;
    }
}

// ── 요청 바디 DTO들 (System.Text.Json 기본 바인딩은 대소문자 구분 안 함 → 프론트는 camelCase로 보내면 됨) ──
public record PlcAdminRequest(string PlcId, string Ip, int Port, string PlcType, string Label, bool? Enabled);
public record FolderRequest(string Name, int? ParentId);
public record FolderTagRequest(int FolderId, string Name, string Address, string PlcId, string? Type, bool? Enabled);
public record TempTagRequest(string TagName, string Address, string PlcId, string ColName, string? TrendName, string? Scale, string? EquipId, bool? Enabled);
public record AlarmFolderRequest(string FolderName, int? ParentId, int? SortOrder);
public record AlarmTagRequest(int FolderId, string TagName, string Address, string PlcId, string AlarmMsg, byte? Level, bool? Enabled);
