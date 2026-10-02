namespace ExerciseAPI.DTOs
{
    public class OneRepMaxDataPointDto
    {
        public DateTime Date { get; set; }
        public decimal Estimated1RM { get; set; }
    }

    public class OneRepMaxLiftDto
    {
        public string LiftName { get; set; } = "";
        public string ExerciseCategory { get; set; } = "";
        public decimal Current1RM { get; set; }
        public List<OneRepMaxDataPointDto> History { get; set; } = new();
    }

    public class OneRepMaxProgressionResponseDto
    {
        public List<OneRepMaxLiftDto> Lifts { get; set; } = new();
    }
}
