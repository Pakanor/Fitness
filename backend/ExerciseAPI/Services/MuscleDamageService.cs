using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class MuscleDamageService : IMuscleDamageService
    {
        private readonly AppDbContext _context;

        public MuscleDamageService(AppDbContext context)
        {
            _context = context;
        }

        public async Task RecordSessionDamageAsync(int userId, DateTime sessionDay)
        {
            // Treat NULL status (legacy rows) as completed, consistent with the rest of the API.
            var sessions = await _context.UserExercise
                .Where(e => e.UserId == userId && (e.Status == null || e.Status == WorkoutStatus.Completed))
                .Include(e => e.Exercise)
                .ThenInclude(ex => ex.MuscleGroupMappings)
                .OrderBy(e => e.Date)
                .ToListAsync();

            // Replay sessions chronologically, accumulating Total_Damage per muscle.
            // state[key] = (current Damage%, date of last training).
            var state = new Dictionary<string, (double damage, DateTime lastDate)>();

            foreach (var day in sessions.GroupBy(e => e.Date.Date).OrderBy(g => g.Key))
            {
                var sessionDateUtc = day.Max(e => e.Date);
                var sessionDamage = new Dictionary<string, double>();

                foreach (var ue in day)
                {
                    if (ue.RPE == null || ue.RPE < 7) continue;
                    var sets = ue.Sets ?? 0;
                    if (sets <= 0) continue;

                    var weights = GetMuscleWeights(ue.Exercise);
                    if (weights.Count == 0) continue;

                    double rpeMult = RpeMultiplier(ue.RPE.Value);
                    double kg = (double)(ue.Weight ?? 0);
                    double reps = (double)(ue.Reps ?? 0);

                    // Effective load = sets × reps × kg / 1000 (tonnage in "metric tons").
                    // Falls back to plain sets when weight or reps are not set.
                    double loadFactor = (kg > 0 && reps > 0)
                        ? (sets * reps * kg / 1000.0)
                        : sets;

                    foreach (var kv in weights)
                    {
                        // partyMult = activation weight (0.0–1.0), no binary primary/secondary split.
                        double partyMult = kv.Value;
                        // Damage = 5% × RPE_mult × activation_ratio × tonnage_factor.
                        double contribution = 5.0 * rpeMult * partyMult * loadFactor;
                        sessionDamage[kv.Key] = sessionDamage.GetValueOrDefault(kv.Key, 0) + contribution;
                    }
                }

                // Cumulative overlap: existing damage decays from the prior session to now.
                foreach (var kv in sessionDamage)
                {
                    double existing = 0;
                    if (state.TryGetValue(kv.Key, out var prev))
                    {
                        double tComp = (sessionDateUtc - prev.lastDate).TotalHours;
                        existing = prev.damage * Math.Exp(-MuscleCategories.Get(kv.Key).Lambda * tComp);
                    }
                    double total = Math.Min(100.0, existing + kv.Value);
                    state[kv.Key] = (total, sessionDateUtc);
                }
            }

            // Persist final state (one row per trained muscle) for this user.
            var existingRows = await _context.MuscleDamage.Where(m => m.UserId == userId).ToListAsync();
            _context.MuscleDamage.RemoveRange(existingRows);
            foreach (var kv in state)
            {
                _context.MuscleDamage.Add(new MuscleDamage
                {
                    UserId = userId,
                    MuscleGroupKey = kv.Key,
                    SessionDate = kv.Value.lastDate,
                    DamagePercent = kv.Value.damage,
                    IsPrimary = kv.Value.damage > 0,
                });
            }
            await _context.SaveChangesAsync();
        }

        // RPE multiplier: 7->0.5, 8->0.8, 9->1.2, 10->2.0 (>=10 saturates at 2.0, <7 -> 0).
        private static double RpeMultiplier(int rpe) => rpe switch
        {
            >= 10 => 2.0,
            9 => 1.2,
            8 => 0.8,
            7 => 0.5,
            _ => 0.0,
        };

        // Muscle -> weight, from the junction table (authoritative where present) and the
        // legacy per-muscle decimal columns (populated for far more exercises). The muscle
        // with the highest weight is the Primary; others are Secondary.
        private static Dictionary<string, double> GetMuscleWeights(Exercise? ex)
        {
            var weights = new Dictionary<string, double>();
            if (ex == null) return weights;

            if (ex.MuscleGroupMappings != null)
            {
                foreach (var m in ex.MuscleGroupMappings)
                    if (m.WeightPercentage > 0)
                        weights[m.MuscleGroupKey] = Math.Max(weights.GetValueOrDefault(m.MuscleGroupKey, 0), (double)m.WeightPercentage);
            }

            void AddIf(decimal v, string key) { if (v > 0) weights[key] = Math.Max(weights.GetValueOrDefault(key, 0), (double)v); }
            AddIf(ex.ChestMain, "chest_main");
            AddIf(ex.DeltoidAnterior, "deltoid_anterior");
            AddIf(ex.DeltoidLateral, "deltoid_lateral");
            AddIf(ex.DeltoidPosterior, "deltoid_posterior");
            AddIf(ex.Biceps, "biceps");
            AddIf(ex.Triceps, "triceps");
            AddIf(ex.Forearms, "forearms");
            AddIf(ex.Lats, "lats");
            AddIf(ex.Rhomboids, "rhomboids");
            AddIf(ex.LowerBack, "lower_back");
            AddIf(ex.Abs, "abs");
            AddIf(ex.CoreStabilizers, "core_stabilizers");
            AddIf(ex.Quadriceps, "quadriceps");
            AddIf(ex.Hamstrings, "hamstrings");
            AddIf(ex.Glutes, "glutes");
            AddIf(ex.Calves, "calves");

            return weights;
        }
    }
}
