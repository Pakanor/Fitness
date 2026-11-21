using ExerciseAPI.Models;

namespace ExerciseAPI.Services
{
    public static class RecordsAnalysis
    {
        public static DateTime GetWeekStart(DateTime date)
        {
            var day = date.Date;
            var offset = ((int)day.DayOfWeek + 6) % 7;
            return day.AddDays(-offset);
        }

        public static int GetCalendarWeekCount(DateTime periodStart, DateTime periodEnd)
        {
            var firstWeek = GetWeekStart(periodStart);
            var lastWeek = GetWeekStart(periodEnd);
            return Math.Max(1, (int)((lastWeek - firstWeek).TotalDays / 7) + 1);
        }

        public static string GetRepRange(int reps) => reps <= 5 ? "1-5" : reps <= 10 ? "6-10" : "11-15";

        public static IEnumerable<(string Key, string Name, decimal Weight)> GetMuscleWeights(Exercise? exercise)
        {
            if (exercise == null)
                return Enumerable.Empty<(string, string, decimal)>();

            if (exercise.MuscleGroupMappings.Count > 0)
            {
                return exercise.MuscleGroupMappings.Select(mapping =>
                    (mapping.MuscleGroupKey, mapping.MuscleGroup?.NamePl ?? mapping.MuscleGroupKey, mapping.WeightPercentage));
            }

            return new[]
            {
                ("chest_main", "Klatka piersiowa", exercise.ChestMain),
                ("deltoid_anterior", "Bark przedni", exercise.DeltoidAnterior),
                ("deltoid_lateral", "Bark boczny", exercise.DeltoidLateral),
                ("deltoid_posterior", "Bark tylny", exercise.DeltoidPosterior),
                ("biceps", "Biceps", exercise.Biceps),
                ("triceps", "Triceps", exercise.Triceps),
                ("forearms", "Przedramiona", exercise.Forearms),
                ("lats", "Plecy szerokie", exercise.Lats),
                ("rhomboids", "Romby i czworoboczny", exercise.Rhomboids),
                ("lower_back", "Dolny odcinek pleców", exercise.LowerBack),
                ("abs", "Brzuch", exercise.Abs),
                ("core_stabilizers", "Stabilizatory tułowia", exercise.CoreStabilizers),
                ("quadriceps", "Czwórki", exercise.Quadriceps),
                ("hamstrings", "Dwugłowe uda", exercise.Hamstrings),
                ("glutes", "Pośladki", exercise.Glutes),
                ("calves", "Łydki", exercise.Calves)
            }.Where(mapping => mapping.Item3 > 0)
                .Select(mapping => (mapping.Item1, mapping.Item2, mapping.Item3));
        }
    }
}