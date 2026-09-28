// ============================================================================
// DoubleWordTagMonitorService.cs
// ============================================================================
// [파일 역할]
//   StringTagMonitorService와 같은 구조의 BackgroundService — 다만 워드들을 아스키로 디코딩하는
//   대신, 정수 하나(더블워드 이상)로 합친다. 히스토리는 저장하지 않고(알람 태그처럼) 항상
//   최신값만 메모리(DoubleWordTagValues)에 들고 있는다.
// ============================================================================

using System.Collections.Concurrent;
using MySqlConnector;
using PlcApiServer.Repositories;
using PlcApiServer.Models;

namespace PlcApiServer.Services;

public class DoubleWordTagMonitorService : BackgroundService
{
    private readonly ILogger<DoubleWordTagMonitorService> _logger;
    private readonly IConfiguration _config;
    private readonly PlcRepository _repo;
    private readonly PlcServiceCache _cache;

    public DateTime? LastPollAt { get; private set; }
    public int IntervalMs { get; private set; } = 30000;
    public ConcurrentDictionary<int, long> DoubleWordTagValues { get; } = new();

    public DoubleWordTagMonitorService(ILogger<DoubleWordTagMonitorService> logger, IConfiguration config, PlcRepository repo, PlcServiceCache cache)
    {
        _logger = logger;
        _config = config;
        _repo = repo;
        _cache = cache;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        bool enabled = _config.GetValue("DoubleWordTagMonitor:Enabled", true);
        int intervalMs = _config.GetValue("DoubleWordTagMonitor:IntervalMs", 30000);
        if (!enabled)
        {
            _logger.LogInformation("DoubleWordTagMonitorService disabled by config.");
            return;
        }
        IntervalMs = intervalMs;
        _logger.LogInformation("DoubleWordTagMonitorService started. IntervalMs={Interval}", intervalMs);

        // StringTagMonitorService/TempMonitorService와 동일하게 :00/:30 같은 고정 경계에 맞춰
        // 폴링한다 — 서버 기동 시각이 제각각이라 세 폴러의 타이밍이 서로 어긋나 있던 문제(리뷰에서
        // 발견)를 없앤다.
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
                _logger.LogError(ex, "DoubleWordTagMonitorService poll error");
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
        var tags = new List<DwPollRow>();
        using (var conn = new MySqlConnection(_repo.ConnectionString))
        {
            await conn.OpenAsync(ct);
            using var check = new MySqlCommand(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='dw_folders_tags'", conn);
            if (Convert.ToInt64(await check.ExecuteScalarAsync(ct)) == 0) return;

            using var cmd = new MySqlCommand(@"
SELECT d.id, d.name, d.address, d.word_count, d.word_order, d.signed_val,
       p.plc_id, p.ip, p.port, p.plc_type, p.label, p.enabled AS plc_enabled
  FROM dw_folders_tags d JOIN tb_plc p ON d.plc_id = p.plc_id
 WHERE d.enabled = 1 AND p.enabled = 1", conn);
            using var rd = await cmd.ExecuteReaderAsync(ct);
            while (await rd.ReadAsync(ct))
            {
                tags.Add(new DwPollRow(
                    rd.GetInt32(0), rd.GetString(1), rd.GetString(2), rd.GetInt32(3), rd.GetString(4), rd.GetBoolean(5),
                    new PlcConfigRow(rd.GetString(6), rd.GetString(7), rd.GetInt32(8), rd.GetString(9), rd.GetString(10), rd.GetBoolean(11))));
            }
        }

        if (tags.Count == 0) return;

        var valid = new List<DwPollRow>();
        foreach (var t in tags)
        {
            var parsed = LiveTagMonitorService.ParseAddressFull(t.Address);
            var order = DoubleWordCodec.ParseOrder(t.WordOrder, t.WordCount);
            if (parsed == null || order == null)
            {
                _logger.LogWarning("Skip dw tag {Id} invalid address/order: {Address} / {Order}", t.Id, t.Address, t.WordOrder);
                continue;
            }
            t.DeviceType = parsed.Value.Device;
            t.AddressValue = parsed.Value.Addr;
            t.Order = order;
            valid.Add(t);
        }
        if (valid.Count == 0) return;

        await Task.WhenAll(valid.GroupBy(t => t.Plc.Id).Select(async plcGroup =>
        {
            var plc = plcGroup.First().Plc;
            try
            {
                var svc = _cache.GetOrCreate(plc);
                foreach (var devGroup in plcGroup.GroupBy(t => t.DeviceType))
                {
                    string deviceType = devGroup.Key;
                    var ranges = devGroup.Select(t => (t.AddressValue, t.WordCount)).ToList();
                    var map = await svc.ReadWordsBatchAsync(ranges, deviceType, (start, count, ex) =>
                        _logger.LogWarning(ex, "DW tag read failed. PlcId={PlcId} Device={Device} Start={Start} Count={Count}",
                            plc.Id, deviceType, start, count));

                    foreach (var t in devGroup)
                    {
                        var words = new int[t.WordCount];
                        bool ok = true;
                        for (int i = 0; i < t.WordCount; i++)
                        {
                            if (map.TryGetValue(t.AddressValue + i, out var raw)) words[i] = raw;
                            else { ok = false; break; }
                        }
                        if (ok) DoubleWordTagValues[t.Id] = DoubleWordCodec.Decode(words, t.Order!, t.Signed);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DW tag PLC group poll failed, skipping. PlcId={PlcId}", plc.Id);
            }
        }));
    }

    private sealed class DwPollRow
    {
        public int Id { get; }
        public string Name { get; }
        public string Address { get; }
        public int WordCount { get; }
        public string WordOrder { get; }
        public bool Signed { get; }
        public PlcConfigRow Plc { get; }
        public string DeviceType { get; set; } = "D";
        public int AddressValue { get; set; }
        public int[]? Order { get; set; }

        public DwPollRow(int id, string name, string address, int wordCount, string wordOrder, bool signed, PlcConfigRow plc)
        {
            Id = id; Name = name; Address = address; WordCount = wordCount; WordOrder = wordOrder; Signed = signed; Plc = plc;
        }
    }
}
