using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class AcwrService : IAcwrService
    {
        private readonly AppDbContext _context;

        // Onboarding guard: ACWR is suppressed until this many distinct training
        // days exist in the rolling window. Below it we use an estimated baseline.
        //a
        private const int ColdStartDays = 14;

        public AcwrService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AcwrResultDto> GetAcwrAsync(int userId, double weightKg, string trainingExperience)
        {
            var since = DateTime.UtcNow.AddDays(-(ColdStartDays + 14));
            // Use completion date (e.Date) as the session date and only count
            // completed (or legacy NULL-status) sessions, ignoring Skipped/Resting.
            var exercises = await _context.UserExercise
                .Where(e => e.UserId == userId && e.Date >= since
                            && (e.Status == null || e.Status == WorkoutStatus.Completed))
                .ToListAsync();

            // Daily workload = Tonnage x average RPE (RPE on 1-10 scale).
            var dayWorkloads = new Dictionary<DateTime, double>();
            foreach (var g in exercises.GroupBy(e => e.Date.Date))
            {
                double tonnage = 0;
                double totalRpe = 0;
                int rpeCount = 0;
                foreach (var e in g)
                {
                    if (e.Sets.HasValue && e.Reps.HasValue && e.Weight.HasValue)
                        tonnage += (double)(e.Sets.Value * e.Reps.Value * e.Weight.Value);
                    if (e.RPE.HasValue)
                    {
                        totalRpe += e.RPE.Value;
                        rpeCount++;
                    }
                }
                double avgRpe = rpeCount > 0 ? totalRpe / rpeCount : 1;
                dayWorkloads[g.Key] = tonnage * avgRpe;
            }

            // Distinct training days in the rolling window (the cold-start metric).
            var trainingDays = dayWorkloads.Count;

            // Build a CONTINUOUS daily series over the last 28 days so the chart maps
            // each calendar day to its own bar (rest days = 0). Rest days correctly
            // dilute the averages rather than being omitted.
            var today = DateTime.UtcNow.Date;
            var dailySeries = new List<DailyWorkloadDto>();
            for (int i = 27; i >= 0; i--)
            {
                var d = today.AddDays(-i);
                dailySeries.Add(new DailyWorkloadDto
                {
                    Date = d,
                    Workload = Math.Round(dayWorkloads.TryGetValue(d, out var w) ? w : 0, 1),
                });
            }

            // True daily averages: window sum / window length.
            double acute = dailySeries.TakeLast(7).Average(x => x.Workload);
            double chronic = dailySeries.Average(x => x.Workload);

            var estimatedBaseline = GetEstimatedBaselineAsync(weightKg, trainingExperience);
            bool coldStart = trainingDays < ColdStartDays;

            double ratio;
            string status;
            string? alert;
            double chronicLoad;
            if (coldStart)
            {
                // Use the estimated baseline as the temporary chronic load so the
                // ratio stays sane (never a divide-by-near-zero); the alarm is
                // suppressed by the frontend via the ColdStart flag.
                chronicLoad = estimatedBaseline;
                ratio = estimatedBaseline > 0 ? Math.Round(acute / estimatedBaseline, 2) : 0;
                status = "";
                alert = null;
            }
            else
            {
                chronicLoad = chronic;
                ratio = chronic > 0 ? Math.Round(acute / chronic, 2) : 0;
                (status, alert) = Classify(ratio);
            }

            return new AcwrResultDto
            {
                Ratio = ratio,
                AcuteLoad = Math.Round(acute, 1),
                ChronicLoad = Math.Round(chronicLoad, 1),
                Status = status,
                Alert = alert,
                InsufficientData = trainingDays < 7,
                ColdStart = coldStart,
                BaselineCollectionDaysRemaining = coldStart ? ColdStartDays - trainingDays : 0,
                EstimatedBaseline = Math.Round(estimatedBaseline, 1),
                DailyWorkload = dailySeries,
            };
        }

        private static (string Status, string? Alert) Classify(double ratio)
        {
            if (ratio < 0.8)
                return ("Niedotrenowanie (Zwiększ obciążenie)", "Za niskie obciążenie — rozważ zwiększenie objętości.");
            if (ratio <= 1.3)
                return ("Strefa Progresu (Stan optymalny)", null);
            if (ratio <= 1.5)
                return ("Wysokie Zmęczenie (Trenuj ostrożnie)", "Obciążenie rośnie szybko. Rozważ deload.");
            return ("Przeciążenie OUN (Krytyczne ryzyko kontuzji - zalecany Deload)", "Wysokie ryzyko kontuzji! Zastosuj deload.");
        }

        // Estimated onboarding baseline = experience factor x body weight.
        // The gateway injects both values as headers, so the service remains shared-nothing.
        private static double GetEstimatedBaselineAsync(double weightKg, string trainingExperience)
        {
            var factor = ExperienceFactor(trainingExperience);
            return factor * weightKg;
        }

        private static double ExperienceFactor(string? trainingExperience) => trainingExperience?.ToLowerInvariant() switch
        {
            "beginner" => 6,
            "advanced" => 10,
            _ => 8,
        };
    }
}
