namespace ExerciseAPI.DTOs;

public record ExerciseMatchDto(
    int DbId,
    string Name,
    string Category,
    double Confidence,
    List<SuggestedSetDto> SuggestedSets,
    string? GifUrl = null,
    string? NameLocalized = null
);