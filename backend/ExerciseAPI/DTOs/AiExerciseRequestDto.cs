namespace ExerciseAPI.DTOs;

public record AiExerciseRequestDto(string Text, string Domain = "exercise");