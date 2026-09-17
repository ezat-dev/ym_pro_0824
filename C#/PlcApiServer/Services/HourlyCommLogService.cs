// ============================================================================
// HourlyCommLogService.cs
// ============================================================================
// [파일 역할]
//   D:\ER_LOG에 "매 정각 한 번씩" 하트비트 한 줄을 남기는 전용 BackgroundService.
//   실패 자체의 상세 내용은 이 서비스가 아니라 LiveTagMonitorService/TempMonitorService의
//   RecordFailure가 "발생한 그 순간" 바로 ErFileLogger로 기록한다(FAIL 태그) — 정각까지
//   기다렸다가 몰아서 쓰지 않는다. 이 서비스는 그와 별개로, 지난 1시간 동안 실패가 몇 건
//   있었는지 개수만 세어 한 줄을 더 남긴다(HOURLY 태그) — "로그가 계속 갱신되고 있다 =
//   서비스가 살아있다"를 확인하기 위한 하트비트 목적이고, 상세는 위 FAIL 로그를 보면 된다.
//
// [왜 정상 통신은 기록 안 하는가]
//   폴링 사이클이 2~30초마다 도는데, 성공까지 전부 기록하면 파일만 커지고 정작 필요한
//   "문제가 있었는지"를 찾기 어려워진다. 그래서 정상 통신은 아예 안 남기고(부하 최소화),
//   실패만 즉시 기록 + 시간당 하트비트 1줄만 추가로 남긴다.
// ============================================================================

namespace PlcApiServer.Services;

public class HourlyCommLogService : BackgroundService
{
    private readonly ILogger<HourlyCommLogService> _logger;
    private readonly LiveTagMonitorService _live;
    private readonly TempMonitorService _temp;

    public HourlyCommLogService(ILogger<HourlyCommLogService> logger, LiveTagMonitorService live, TempMonitorService temp)
    {
        _logger = logger;
        _live = live;
        _temp = temp;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 서버가 몇 시 몇 분에 뜨든, 항상 다음 "정각"(예: 14:00:00)까지 기다렸다가 시작한다.
        var now = DateTime.Now;
        var nextHour = now.Date.AddHours(now.Hour + 1);
        _logger.LogInformation("HourlyCommLogService started. First heartbeat at {NextHour}", nextHour);

        try { await Task.Delay(nextHour - now, stoppingToken); }
        catch (TaskCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try { WriteHeartbeat(nextHour); }
            catch (Exception ex) { _logger.LogError(ex, "HourlyCommLogService heartbeat write failed"); }

            // 하트비트 작성 자체가 걸린 시간과 무관하게, 다음 정각은 항상 "+1시간"으로 고정한다
            // (TempMonitorService의 scheduledTick과 동일한 이유 — 시간이 밀리지 않게).
            nextHour = nextHour.AddHours(1);
            var wait = nextHour - DateTime.Now;
            if (wait < TimeSpan.Zero) wait = TimeSpan.Zero;   // 극단적으로 오래 걸린 경우 방어
            try { await Task.Delay(wait, stoppingToken); }
            catch (TaskCanceledException) { break; }
        }
    }

    private void WriteHeartbeat(DateTime hourEnd)
    {
        int liveCount = _live.DrainHourlyFailureCount();
        int tempCount = _temp.DrainHourlyFailureCount();
        int total = liveCount + tempCount;

        var hourStart = hourEnd.AddHours(-1);
        var label = $"{hourStart:yyyy-MM-dd HH:mm} ~ {hourEnd:HH:mm}";

        Logging.ErFileLogger.Write("HOURLY", total == 0
            ? $"[{label}] 이상 없음 (통신 실패 0건)"
            : $"[{label}] 통신 실패 {total}건 (알람/폴더 {liveCount}, 온도 {tempCount}) — 상세는 위 FAIL 로그 참고");
    }
}
