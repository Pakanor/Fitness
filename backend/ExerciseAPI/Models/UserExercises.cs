namespace ExerciseAPI.Models
{

public class UserExercise
{
    public int Id { get; set; }

    public int UserId { get; set; }      
    public int ExerciseId { get; set; }  

    public DateTime Date { get; set; }

    public int? Sets { get; set; }
    public int? Reps { get; set; }
    public decimal? Weight { get; set; }
    public int? RPE { get; set; }
    public int? RIR { get; set; }
    
    public WorkoutStartMode? StartMode { get; set; }
    public int? TemplateId { get; set; }
    public WorkoutStatus? Status { get; set; }
    
    public Exercise? Exercise { get; set; }
}
}