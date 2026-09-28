// ============================================================================
// StringTagMonitorService.cs
// ============================================================================
// [파일 역할]
//   TempMonitorService와 마찬가지로 웹 요청과 무관하게 도는 BackgroundService다. 다만 온도 태그와
//   달리 "히스토리(시계열) 저장"이 필요 없다고 판단해 tb_temp_snapshot 같은 스냅샷 테이블을 두지
//   않고, 알람 태그(LiveTagMonitorService.AlarmTagValues)처럼 항상 최신값만 메모리에 들고 있는다.
//
//   문자열 태그 하나 = PLC의 연속된 워드 레지스터 N개. 매 주기 그 워드들을 읽어서
//   StringTagCodec.Decode로 아스키 문자열로 바꿔 StringTagValues(string_id → 문자열)에 저장한다.
// ============================================================================

using System.Collections.Concurrent;
using MySqlConnector;
using PlcApiServer.Repositories;
using PlcApiServer.Models;

namespace PlcApiServer.Services;

public class StringTagMonitorService : BackgroundService
{
    private readonly ILogger<StringTagMonitorService> _logger;
    private readonly IConfiguration _config;
    private readonly PlcRepository _repo;
    private readonly PlcServiceCache _cache;

    public DateTime? LastPollAt { get; private set; }
    public int IntervalMs { get; private set; } = 30000;
    public ConcurrentDictionary<int, string> StringTagValues { get; } = new();

    public StringTagMonitorService(ILogger<StringTagMonitorService> logger, IConfiguration config, PlcRepository repo, PlcServiceCache cache)
    {
        _logger = logger;
        _config = config;
        _repo = repo;
        _cache = cache;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        bool enabled = _config.GetValue("StringTagMonitor:Enabled", true);
        int intervalMs = _config.GetValue("StringTagMonitor:IntervalMs", 30000);
        if (!enabled)
        {
            _logger.LogInformation("StringTagMonitorService disabled by config.");
            return;
        }
        IntervalMs = intervalMs;
        _logger.LogInformation("StringTagMonitorService started. IntervalMs={Interval}", intervalMs);

        // TempMonitorService와 동일하게 :00/:30 같은 고정 경계에 맞춰 폴링한다 — 서버 기동 시각이
        // 제각각이라 온도/문자열/더블워드 세 폴러의 폴링 타이밍이 서로 어긋나 있던 문제(리뷰에서
        // 발견) 를 없앤다. 히스토리를 저장하지 않으니 정확한 시각 자체가 중요한 건 아니지만,
        // 세 폴러가 같은 경계에서 도는 편이 부하 패턴을 예측하기 쉽다.
        {
            long nowMs = (long)DateTime.Now.TimeOfDay.TotalMilliseconds;
            int msToFirst = intervalMs - (int)(nowMs % intervalMs);
            try { await Task.Delay(msToFirst, stoppingToken); }
            catch (TaskCanceledException) { return; }
        }
        DateTime scheduledTick = RoundDownToInterval(DateTime.Now, intervalMs);

        while (!stoppingToken.IsCancellationRequested)
        {
            DateTime nextScheduled = scheduledTick.AddMilliseconds(intervalMs);
            try
            {
                await PollOnceAsync(stoppingToken);
                LastPollAt = DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "StringTagMonitorService poll error");
            }

            scheduledTick = nextScheduled;
            TimeSpan remaining = nextScheduled - DateTime.Now;
            if (remaining > TimeSpan.Zero)
            {
                try { await Task.Delay(remaining, stoppingToken); }
                catch (TaskCanceledException) { break; }
            }
        }
    }

    // 현재 시각을 intervalMs 배수의 직전 경계로 내림한다 (예: 12:00:47, interval=30000 → 12:00:30)
    private static DateTime RoundDownToInterval(DateTime dt, int intervalMs)
    {
        long totalMs = (long)dt.TimeOfDay.TotalMilliseconds;
        long boundary = (totalMs / intervalMs) * intervalMs;
        return dt.Date.AddMilliseconds(boundary);
    }

    private async Task PollOnceAsync(CancellationToken ct)
    {
        var tags = new List<StringTagPollRow>();
        using (var conn = new MySqlConnection(_repo.ConnectionString))
        {
            await conn.OpenAsync(ct);
            // 테이블이 아직 없으면(문자열 태그를 한 번도 등록 안 한 초기 상태) 조용히 넘어간다 —
            // 등록 화면(AdminTagEndpoints)이 최초 등록 시 테이블을 만든다.
            using var check = new MySqlCommand(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='tb_string_tag'", conn);
            if (Convert.ToInt64(await check.ExecuteScalarAsync(ct)) == 0) return;

            using var cmd = new MySqlCommand(@"
SELECT s.string_id, s.tag_name, s.address, s.word_count, s.byte_order,
       p.plc_id, p.ip, p.port, p.plc_type, p.label, p.enabled AS plc_enabled
  FROM tb_string_tag s JOIN tb_plc p ON s.plc_id = p.plc_id
 WHERE s.enabled = 1 AND p.enabled = 1", conn);
            using var rd = await cmd.ExecuteReaderAsync(ct);
            while (await rd.ReadAsync(ct))
            {
                tags.Add(new StringTagPollRow(
                    rd.GetInt32(0), rd.GetString(1), rd.GetString(2), rd.GetInt32(3), rd.GetString(4),
                    new PlcConfigRow(rd.GetString(5), rd.GetString(6), rd.GetInt32(7), rd.GetString(8), rd.GetString(9), rd.GetBoolean(10))));
            }
        }

        if (tags.Count == 0) return;

        var valid = new List<StringTagPollRow>();
        foreach (var t in tags)
        {
            var parsed = LiveTagMonitorService.ParseAddressFull(t.Address);
            if (parsed == null)
            {
                _logger.LogWarning("Skip string tag {Id} invalid address: {Address}", t.StringId, t.Address);
                continue;
            }
            t.DeviceType = parsed.Value.Device;
            t.AddressValue = parsed.Value.Addr;
            valid.Add(t);
        }
        if (valid.Count == 0) return;

        // 알람/온도 태그와 동일한 패턴 — PLC별로 묶어서 PlcService(TCP 연결 1개)를 재사용한다.
        await Task.WhenAll(valid.GroupBy(t => t.Plc.Id).Select(async plcGroup =>
        {
            var plc = plcGroup.First().Plc;
            try
            {
                var svc = _cache.GetOrCreate(plc);
                foreach (var devGroup in plcGroup.GroupBy(t => t.DeviceType))
                {
                    string deviceType = devGroup.Key;
                    // 태그마다 워드 개수가 달라 알람/온도처럼 인접 주소를 하나로 합칠 수 없어서,
                    // 태그 하나당 (시작주소, 워드개수) 범위 하나씩 그대로 배치에 넘긴다.
                    var ranges = devGroup.Select(t => (t.AddressValue, t.WordCount)).ToList();
                    var map = await svc.ReadWordsBatchAsync(ranges, deviceType, (start, count, ex) =>
                        _logger.LogWarning(ex, "String tag read failed. PlcId={PlcId} Device={Device} Start={Start} Count={Count}",
                            plc.Id, deviceType, start, count));

                    foreach (var t in devGroup)
                    {
                        var words = new ushort[t.WordCount];
                        bool ok = true;
                        for (int i = 0; i < t.WordCount; i++)
                        {
                            if (map.TryGetValue(t.AddressValue + i, out var raw)) words[i] = (ushort)raw;
                            else { ok = false; break; }
                        }
                        if (ok) StringTagValues[t.StringId] = StringTagCodec.Decode(words, t.ByteOrder);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "String tag PLC group poll failed, skipping. PlcId={PlcId}", plc.Id);
            }
        }));
    }

    private sealed class StringTagPollRow
    {
        public int StringId { get; }
        public string TagName { get; }
        public string Address { get; }
        public int WordCount { get; }
        public string ByteOrder { get; }
        public PlcConfigRow Plc { get; }
        public string DeviceType { get; set; } = "D";
        public int AddressValue { get; set; }

        public StringTagPollRow(int stringId, string tagName, string address, int wordCount, string byteOrder, PlcConfigRow plc)
        {
            StringId = stringId; TagName = tagName; Address = address; WordCount = wordCount; ByteOrder = byteOrder; Plc = plc;
        }
    }
}
