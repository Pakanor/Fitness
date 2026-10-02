namespace ExerciseAPI.DTOs
{
    public class MuscleVolumeLandmarkDto
    {
        public string NameKey { get; set; }
        public string NamePl { get; set; }
        public decimal StimulatingSets { get; set; }
        public decimal JunkSets { get; set; }
        public decimal TotalPhysicalSets { get; set; }
        public string Status { get; set; }
        public string Color { get; set; }
    }
}
