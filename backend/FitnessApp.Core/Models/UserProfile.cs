namespace FitnessApp.Core.Models;

public sealed record UserProfile
{
    public decimal Weight { get; init; }
    public string TrainingExperience { get; init; } = "intermediate";
    public decimal? CaloricTarget { get; init; }

    public static UserProfile Default => new()
    {
        Weight = 75.0m,
        TrainingExperience = "intermediate",
        CaloricTarget = null
    };
}