namespace ExerciseAPI.DTOs;

public record AiExerciseResponseDto(
    List<ExerciseMatchDto> Matches,
    List<string> Unmatched
);