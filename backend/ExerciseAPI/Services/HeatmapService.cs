using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class HeatmapService
    {
        private readonly AppDbContext _context;

        private static readonly Dictionary<string, double> HalfLives = new()
        {
            ["chest_main"] = 42,
            ["deltoid_anterior"] = 30,
            ["deltoid_lateral"] = 30,
            ["deltoid_posterior"] = 30,
            ["biceps"] = 30,
            ["triceps"] = 30,
            ["forearms"] = 24,
            ["lats"] = 42,
            ["rhomboids"] = 30,
            ["lower_back"] = 30,
            ["abs"] = 24,
            ["core_stabilizers"] = 24,
            ["quadriceps"] = 42,
            ["hamstrings"] = 30,
            ["glutes"] = 42,
            ["calves"] = 24,
        };

        private static readonly Dictionary<string, (string NamePl, bool IsFront)> MuscleMeta = new()
        {
            ["chest_main"] = ("Klatka piersiowa", true),
            ["deltoid_anterior"] = ("Bark przedni", true),
            ["deltoid_lateral"] = ("Bark boczny", true),
            ["deltoid_posterior"] = ("Bark tylny", false),
            ["biceps"] = ("Biceps", true),
            ["triceps"] = ("Triceps", false),
            ["forearms"] = ("Przedramiona", true),
            ["lats"] = ("Plecy szerokie", false),
            ["rhomboids"] = ("Romby i czworoboczny", false),
            ["lower_back"] = ("Dolny odcinek pleców", false),
            ["abs"] = ("Brzuch", true),
            ["core_stabilizers"] = ("Stabilizatory tułowia", true),
            ["quadriceps"] = ("Czwórki", true),
            ["hamstrings"] = ("Dwugłowe uda", false),
            ["glutes"] = ("Pośladki", false),
            ["calves"] = ("Łydki", false),
        };

        public HeatmapService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<HeatmapMuscleDto>> GetHeatmapData(int userId)
        {
            var now = DateTime.UtcNow;
            var weekStart = now.AddDays(-7);

            // Only fetch sessions from last 14 days — older ones have negligible decay
            var cutoff = now.AddDays(-14);
            var recentExercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date >= cutoff)
                .OrderBy(ue => ue.Date)
                .ToListAsync();

            // All exercises for this week's volume
            var weekLogs = recentExercises.Where(ue => ue.Date >= weekStart).ToList();

            var exercises = await _context.Exercises.ToListAsync();

            var allPrs = await _context.PersonalRecords
                .Where(pr => pr.UserId == userId)
                .GroupBy(pr => pr.ExerciseId)
                .Select(g => new
                {
                    ExerciseId = g.Key,
                    BestWeight = g.Max(pr => pr.Weight),
                    BestReps = g.OrderByDescending(pr => pr.Weight).Select(pr => pr.Reps).FirstOrDefault()
                })
                .ToListAsync();

            var result = new List<HeatmapMuscleDto>();

            foreach (var (key, meta) in MuscleMeta)
            {
                if (!HalfLives.TryGetValue(key, out double halfLife))
                    continue;

                double lambda = Math.Log(2) / halfLife;

                // ── Fatigue: exponential decay per session ──────────────
                // Multiplier 5 calibrated so:
                //   1 heavy session (4 sets, coeff 0.8, RPE 8) → ~13% fatigue
                //   2 heavy sessions 24h apart → ~22% fatigue
                //   3 heavy sessions → ~30% fatigue
                double totalFatigue = 0;
                foreach (var log in recentExercises)
                {
                    var ex = exercises.FirstOrDefault(e => e.Id == log.ExerciseId);
                    if (ex == null) continue;
                    decimal coeff = GetCoefficient(ex, key);
                    if (coeff <= 0) continue;

                    double rpeMod = log.RPE.HasValue ? log.RPE.Value / 10.0 : 0.8;
                    double load = (log.Sets ?? 0) * (double)coeff * 5.0 * rpeMod;

                    DateTime utcDate = log.Date.Kind == DateTimeKind.Utc
                        ? log.Date
                        : DateTime.SpecifyKind(log.Date, DateTimeKind.Utc);
                    double hoursElapsed = (now - utcDate).TotalHours;
                    if (hoursElapsed < 0) hoursElapsed = 0;

                    totalFatigue += load * Math.Exp(-lambda * hoursElapsed);
                }

                totalFatigue = Math.Min(100.0, totalFatigue);

                // Recovery = 100 - fatigue
                double recoveryPercent = Math.Max(0, Math.Round(100 - totalFatigue, 1));

                // Time to reach 15% fatigue (practical recovery)
                int cooldownRemainingMinutes = 0;
                if (totalFatigue > 15)
                {
                    double hoursToRecover = Math.Log(totalFatigue / 15.0) / lambda;
                    cooldownRemainingMinutes = (int)Math.Min(96 * 60, Math.Max(0, Math.Round(hoursToRecover * 60)));
                }

                // ── Weekly volume: raw sets × coeff (weighted effective sets) ──
                int weeklyVolume = 0;
                foreach (var log in weekLogs)
                {
                    var ex = exercises.FirstOrDefault(e => e.Id == log.ExerciseId);
                    if (ex == null) continue;
                    decimal coeff = GetCoefficient(ex, key);
                    if (coeff > 0 && log.Sets.HasValue)
                        weeklyVolume += (int)Math.Round(log.Sets.Value * (double)coeff);
                }

                bool isLarge = new[] { "chest_main", "lats", "quadriceps", "glutes" }.Contains(key);
                int volumeGoal = isLarge ? 12 : 8;

                // 1RM estimation
                decimal? estimatedOneRM = null;
                int? baseExerciseId = null;

                var bestPr = allPrs
                    .Where(pr =>
                    {
                        var ex = exercises.FirstOrDefault(e => e.Id == pr.ExerciseId);
                        if (ex == null || !ex.IsBenchmark) return false;
                        return GetCoefficient(ex, key) > 0;
                    })
                    .OrderByDescending(pr => pr.BestWeight)
                    .FirstOrDefault();

                if (bestPr != null)
                {
                    baseExerciseId = bestPr.ExerciseId;
                    if (bestPr.BestReps > 0 && bestPr.BestWeight > 0)
                    {
                        estimatedOneRM = Math.Round(bestPr.BestWeight * (decimal)(1 + bestPr.BestReps / 30.0), 1);
                    }
                }

                result.Add(new HeatmapMuscleDto
                {
                    NameKey = key,
                    NamePl = meta.NamePl,
                    IsFront = meta.IsFront,
                    CooldownPercent = recoveryPercent,
                    CooldownRemainingMinutes = cooldownRemainingMinutes,
                    WeeklyVolumeSets = weeklyVolume,
                    VolumeGoalSets = volumeGoal,
                    EstimatedOneRM = estimatedOneRM,
                    BaseExerciseId = baseExerciseId
                });
            }

            return result;
        }

        private static decimal GetCoefficient(ExerciseAPI.Models.Exercise ex, string muscleKey)
        {
            return muscleKey switch
            {
                "chest_main" => ex.ChestMain,
                "deltoid_anterior" => ex.DeltoidAnterior,
                "deltoid_lateral" => ex.DeltoidLateral,
                "deltoid_posterior" => ex.DeltoidPosterior,
                "biceps" => ex.Biceps,
                "triceps" => ex.Triceps,
                "forearms" => ex.Forearms,
                "lats" => ex.Lats,
                "rhomboids" => ex.Rhomboids,
                "lower_back" => ex.LowerBack,
                "abs" => ex.Abs,
                "core_stabilizers" => ex.CoreStabilizers,
                "quadriceps" => ex.Quadriceps,
                "hamstrings" => ex.Hamstrings,
                "glutes" => ex.Glutes,
                "calves" => ex.Calves,
                _ => 0
            };
        }
    }
}
