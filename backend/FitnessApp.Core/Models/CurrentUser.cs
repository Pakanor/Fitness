namespace FitnessApp.Core.Models;

public sealed record CurrentUser
{
    public int Id { get; init; }
    public bool IsAuthenticated { get; init; }
    public UserProfile? Profile { get; init; }
    public string? Name { get; init; }
    public string? Email { get; init; }

    public static CurrentUser Anonymous => new()
    {
        Id = 0,
        IsAuthenticated = false,
        Profile = null,
        Name = null,
        Email = null
    };
}