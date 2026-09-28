namespace PlcApiServer.Services;

// PLC 워드 레지스터(16비트) <-> 아스키 문자열 상호 변환. 워드 하나에 아스키 2글자(각 8비트)가 들어가는데,
// 어느 바이트가 앞 글자인지(상위바이트 먼저 vs 하위바이트 먼저)는 PLC 기종/설정마다 달라서 태그마다
// byte_order를 선택하게 하고, 이 클래스는 그 설정에 따라 순서만 바꿔 조립/분해한다.
public static class StringTagCodec
{
    public const string HighFirst = "HIGH_FIRST"; // 워드의 상위바이트가 문자열의 앞 글자
    public const string LowFirst = "LOW_FIRST";   // 워드의 하위바이트가 문자열의 앞 글자

    // 워드 배열 → 문자열. GX Works의 디바이스 모니터 "String" 열과 같은 방식 — 끝쪽에 남는
    // 0(널문자)/공백 패딩만 잘라내고, 중간에 낀 비인쇄 바이트는 '.'으로 표시한다(원래는 처음
    // 만나는 널바이트에서 바로 잘라버렸는데, 실제 GX Works 화면과 비교해보니 숫자값이 섞인
    // 워드나 1워드=1글자 관행처럼 글자 중간에 0x00이 낀 경우 앞부분에서 널을 만나자마자 전체가
    // 빈 문자열이 돼버리는 문제가 확인됨 — 진짜 문자열이 있어도 바이트 순서가 아직 안 맞으면
    // 통째로 안 보이게 되는 셈이라, 끝만 정리하고 나머지는 있는 그대로 최대한 보여주는 쪽으로 바꿈).
    public static string Decode(IReadOnlyList<ushort> words, string byteOrder)
    {
        var bytes = new byte[words.Count * 2];
        for (int i = 0; i < words.Count; i++)
        {
            byte hi = (byte)(words[i] >> 8);
            byte lo = (byte)(words[i] & 0xFF);
            if (byteOrder == LowFirst) { bytes[i * 2] = lo; bytes[i * 2 + 1] = hi; }
            else { bytes[i * 2] = hi; bytes[i * 2 + 1] = lo; }
        }

        int end = bytes.Length;
        while (end > 0 && (bytes[end - 1] == 0 || bytes[end - 1] == 0x20)) end--;

        var chars = new char[end];
        for (int i = 0; i < end; i++)
        {
            byte b = bytes[i];
            chars[i] = (b >= 0x20 && b < 0x7F) ? (char)b : '.';
        }
        return new string(chars);
    }

    // 문자열 → 워드 배열. wordCount*2바이트보다 짧으면 남는 자리를 0으로 채우고(null 패딩),
    // 길면 잘라내며 Truncated=true로 알려준다(호출측이 사용자에게 경고할 수 있도록).
    public static (ushort[] Words, bool Truncated) Encode(string text, int wordCount, string byteOrder)
    {
        int totalBytes = wordCount * 2;
        var bytes = new byte[totalBytes];
        var src = System.Text.Encoding.ASCII.GetBytes(text ?? "");
        bool truncated = src.Length > totalBytes;
        Array.Copy(src, bytes, Math.Min(src.Length, totalBytes));

        var words = new ushort[wordCount];
        for (int i = 0; i < wordCount; i++)
        {
            byte b0 = bytes[i * 2], b1 = bytes[i * 2 + 1];
            words[i] = byteOrder == LowFirst ? (ushort)((b1 << 8) | b0) : (ushort)((b0 << 8) | b1);
        }
        return (words, truncated);
    }
}
