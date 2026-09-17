namespace PlcApiServer.Logging;

/// <summary>
/// D:\ER_LOG\YYYYMMDD.log 에 로그를 기록한다. ScFileLogger(D:\SC_LOG)와 달리 이 로거는
/// 통신 실패가 "발생하는 그 순간마다"가 아니라 HourlyCommLogService가 매 정각 한 번씩만 호출한다 —
/// 성공은 워낙 많아서 매번 기록하면 디스크 I/O 부하만 커지고, 정작 필요한 건 "그 시간에 문제가
/// 있었는지"이기 때문에 시간당 1건(요약 리포트)으로 묶어서 남긴다.
/// </summary>
public static class ErFileLogger
{
    private static readonly string LogDir = @"D:\ER_LOG";
    private static readonly object _lock  = new();

    /// <param name="tag">로그 분류 태그 (예: "HOURLY")</param>
    /// <param name="message">기록할 내용 — 여러 줄이어도 됨(에러가 여러 건이면 줄바꿈으로 나열)</param>
    public static void Write(string tag, string message)
    {
        try
        {
            Directory.CreateDirectory(LogDir);
            var now      = DateTime.Now;
            var filePath = Path.Combine(LogDir, now.ToString("yyyyMMdd") + ".log");
            var line     = $"{now:yyyy-MM-dd HH:mm:ss} [{tag,-6}] {message}{Environment.NewLine}";
            lock (_lock)
                File.AppendAllText(filePath, line, System.Text.Encoding.UTF8);
        }
        catch { /* 로그 실패는 서비스 동작에 영향 없이 무시 */ }
    }
}
