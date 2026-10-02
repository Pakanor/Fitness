using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class MuscleRecoveryService : IMuscleRecoveryService
    {
        private readonly AppDbContext _context;

        public MuscleRecoveryService(AppDbContext context)
        {
            _context = context;
        }

        // Live recovery model: Recovery(t) = 100 - Damage% * e^(-lambda*t).
        // Remaining time is to the 98% threshold: t_98 = ln(2/Damage%) / -lambda.
        // Callers must clamp to exactly 100% / 0h when t >= T_max (full recovery).
        public static (double Recovery, double Remaining) ComputeRecovery(double damagePercent, double lambda, double elapsedHours)
        {
            if (damagePercent <= 0) return (100, 0);
            double recovery = 100 - damagePercent * Math.Exp(-lambda * elapsedHours);
            double remaining = Math.Max(0, (Math.Log(2.0 / damagePercent) / -lambda) - elapsedHours);
            return (recovery, remaining);
        }

        public async Task<List<MuscleRecoveryDto>> ComputeAsync(int userId)
        {
            // One stored row per trained muscle (final Total_Damage + last training date).
            var damages = await _context.MuscleDamage
                .Where(m => m.UserId == userId)
                .ToDictionaryAsync(m => m.MuscleGroupKey);

            var now = DateTime.UtcNow;
            var result = new List<MuscleRecoveryDto>();

            foreach (var key in MuscleCategories.AllKeys)
            {
                var info = MuscleCategories.Get(key);

                if (!damages.TryGetValue(key, out var row) || row.DamagePercent <= 0)
                {
                    result.Add(new MuscleRecoveryDto
                    {
                        MuscleGroupKey = key,
                        NamePl = info.NamePl,
                        Category = info.Category,
                        TMaxHours = info.TMax,
                        Lambda = info.Lambda,
                        DamagePercent = 0,
                        SessionTimestamp = default,
                        RecoveryPercent = 100,
                        ElapsedHours = 0,
                        RemainingHours = 0,
                    });
                    continue;
                }

                double t = (now - row.SessionDate).TotalHours;
                double recovery;
                double remaining;
                if (t >= info.TMax)
                {
                    recovery = 100;
                    remaining = 0;
                }
                else
                {
                    (recovery, remaining) = ComputeRecovery(row.DamagePercent, info.Lambda, t);
                }

                result.Add(new MuscleRecoveryDto
                {
                    MuscleGroupKey = key,
                    NamePl = info.NamePl,
                    Category = info.Category,
                    TMaxHours = info.TMax,
                    Lambda = info.Lambda,
                    DamagePercent = Math.Round(row.DamagePercent, 1),
                    SessionTimestamp = row.SessionDate,
                    RecoveryPercent = Math.Round(recovery, 1),
                    ElapsedHours = Math.Round(t, 1),
                    RemainingHours = Math.Round(remaining, 1),
                });
            }

            // Most-fatigued muscles first.
            return result.OrderBy(r => r.RecoveryPercent).ToList();
        }
    }
}
