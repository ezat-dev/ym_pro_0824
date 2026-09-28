using MySqlConnector;

namespace PlcApiServer.Logging;

/// <summary>
/// 값쓰기 성공 이력을 tb_tag_log에 남긴다 (DB 테이블, 파일 로그인 SC_LOG/ER_LOG와는 별개).
/// 원래 Program.cs 안의 로컬 함수였는데, Endpoints/AdminTagEndpoints.cs의 알람 태그 쓰기
/// 경로에서도 똑같이 필요해져서(폴더 태그 쓰기와 동일한 감사 로그가 남아야 함) 공용 클래스로 뺐다.
/// </summary>
public static class TagWriteLog
{
    // 실제 쓰기가 성공한 뒤에만 호출된다 — tb_tag_log가 없으면 그때그때 만든다.
    // 쓰기는 사람이 버튼을 누를 때만 일어나는 저빈도 동작이라, 매번 CREATE TABLE IF NOT EXISTS를
    // 다시 실행해도 비용 문제가 없다(TempMonitorService처럼 매 30초 도는 핫패스가 아님).
    // 기록 실패가 "쓰기 자체는 이미 성공"한 응답을 막으면 안 되므로 예외를 삼킨다(로그만 남김).
    public static async Task LogAsync(string connStr, string tagType, int? tagId, string? tagName, string address, string plcId, int? oldValue, int newValue)
    {
        try
        {
            using var conn = new MySqlConnection(connStr);
            await conn.OpenAsync();

            using (var ddl = new MySqlCommand(@"
CREATE TABLE IF NOT EXISTS tb_tag_log (
    log_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    tag_type   VARCHAR(10) NOT NULL,
    tag_id     INT NULL,
    tag_name   VARCHAR(100) NULL,
    address    VARCHAR(50) NOT NULL,
    plc_id     VARCHAR(50) NOT NULL,
    old_value  INT NULL,
    new_value  INT NOT NULL,
    written_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tag_log_written (written_at),
    INDEX idx_tag_log_tag (tag_type, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4", conn))
                await ddl.ExecuteNonQueryAsync();

            using var cmd = new MySqlCommand(@"
INSERT INTO tb_tag_log(tag_type, tag_id, tag_name, address, plc_id, old_value, new_value)
VALUES (@tagType, @tagId, @tagName, @address, @plcId, @oldValue, @newValue)", conn);
            cmd.Parameters.AddWithValue("@tagType", tagType);
            cmd.Parameters.AddWithValue("@tagId", (object?)tagId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tagName", (object?)tagName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@address", address);
            cmd.Parameters.AddWithValue("@plcId", plcId);
            cmd.Parameters.AddWithValue("@oldValue", (object?)oldValue ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@newValue", newValue);
            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[TagLog] 기록 실패(쓰기 자체는 성공): {ex.Message}");
        }
    }
}
