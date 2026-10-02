namespace ExerciseAPI.DTOs
{
    public class UserExerciseWithMappingDto
    {
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public int Sets { get; set; }
        public int? RPE { get; set; }
        public decimal ChestMain { get; set; }
        public decimal DeltoidAnterior { get; set; }
        public decimal DeltoidLateral { get; set; }
        public decimal DeltoidPosterior { get; set; }
        public decimal Biceps { get; set; }
        public decimal Triceps { get; set; }
        public decimal Forearms { get; set; }
        public decimal Lats { get; set; }
        public decimal Rhomboids { get; set; }
        public decimal LowerBack { get; set; }
        public decimal Abs { get; set; }
        public decimal CoreStabilizers { get; set; }
        public decimal Quadriceps { get; set; }
        public decimal Hamstrings { get; set; }
        public decimal Glutes { get; set; }
        public decimal Calves { get; set; }
    }
}
