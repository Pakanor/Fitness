namespace ExerciseAPI.DTOs
{
    public class ExerciseProgressPointDto
    {
        public string Date { get; set; } = "";
        public decimal MaxE1RM { get; set; }
        public decimal TopSetWeight { get; set; }
        public int TopSetReps { get; set; }
    }

    public class ExerciseProgressResponseDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public List<ExerciseProgressPointDto> DataPoints { get; set; } = new();
        public decimal AllTimeMaxE1RM { get; set; }
    }
}
