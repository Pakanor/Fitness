namespace ExerciseAPI.Options;

public class OpenRouterOptions
{
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "openrouter/auto";
    public int MaxTokens { get; set; } = 500;
    public double Temperature { get; set; } = 0.1;
}