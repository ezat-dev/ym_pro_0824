namespace PlcApiServer.Services;

// PLC 워드 레지스터 여러 개를 하나의 정수(더블워드류)로 합치거나 쪼갠다. 워드 하나는 16비트라
// 32비트(더블워드) 이상 값은 연속 주소 여러 개를 이어붙여야 한다. "어느 주소가 최하위/최상위
// 16비트를 맡는지"는 PLC/설정마다 다를 수 있어서, order로 오프셋별 유의도 순서를 태그마다
// 정할 수 있게 한다 — order[0]가 최하위 16비트, order[1]이 그 다음 16비트, ...
public static class DoubleWordCodec
{
    public const int MinWordCount = 2;
    public const int MaxWordCount = 4; // 4워드(64비트)까지 — 그 이상은 long 부호 계산이 불안정해짐

    // "0,1,2" 같은 콤마구분 문자열을 오프셋 배열로 파싱한다. 0..wordCount-1의 순열이 아니면 null.
    public static int[]? ParseOrder(string orderText, int wordCount)
    {
        if (string.IsNullOrWhiteSpace(orderText)) return null;
        var parts = orderText.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != wordCount) return null;
        var order = new int[wordCount];
        var seen = new bool[wordCount];
        for (int i = 0; i < wordCount; i++)
        {
            if (!int.TryParse(parts[i], out int v) || v < 0 || v >= wordCount || seen[v]) return null;
            seen[v] = true;
            order[i] = v;
        }
        return order;
    }

    public static string DefaultOrder(int wordCount) => string.Join(",", Enumerable.Range(0, wordCount));

    // words: 시작 주소 기준 오프셋 0..N-1에서 읽은 원시 워드 값(부호 없는 16비트로 취급).
    // order: 오프셋별 유의도 순서(order[slot] = 그 유의도 자리를 채우는 오프셋).
    public static long Decode(IReadOnlyList<int> words, int[] order, bool signed)
    {
        long value = 0;
        for (int slot = 0; slot < order.Length; slot++)
        {
            ushort raw = (ushort)words[order[slot]];
            value |= ((long)raw) << (16 * slot);
        }
        int totalBits = 16 * order.Length;
        if (signed && totalBits < 64 && (value & (1L << (totalBits - 1))) != 0)
            value -= 1L << totalBits;
        return value;
    }

    // 정수 하나 → 오프셋별 워드 배열(주소 순서 그대로, order 적용된 상태로 바로 쓸 수 있음).
    public static ushort[] Encode(long value, int[] order)
    {
        var words = new ushort[order.Length];
        for (int slot = 0; slot < order.Length; slot++)
            words[order[slot]] = (ushort)((value >> (16 * slot)) & 0xFFFF);
        return words;
    }
}
