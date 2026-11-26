namespace FitnessApp.Core.Models;

public readonly record struct SessionId
{
    public Guid Value { get; }

    public SessionId(Guid value)
    {
        Value = value;
    }

    public static SessionId New() => new(Guid.NewGuid());

    public static SessionId Parse(string s) => new(Guid.Parse(s));

    public static bool TryParse(string s, out SessionId sessionId)
    {
        if (Guid.TryParse(s, out var guid))
        {
            sessionId = new SessionId(guid);
            return true;
        }
        sessionId = default;
        return false;
    }

    public static implicit operator Guid(SessionId sessionId) => sessionId.Value;
    public static implicit operator SessionId(Guid guid) => new(guid);

    public override string ToString() => Value.ToString();
}