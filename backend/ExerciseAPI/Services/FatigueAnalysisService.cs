using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class FatigueAnalysisService : IFatigueAnalysisService
    {
        private readonly AppDbContext _context;

        public FatigueAnalysisService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MuscleDamageDto>> GetMuscleDamageAsync(int userId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.MuscleDamage
                .Where(md => md.UserId == userId);

            if (startDate.HasValue)
            {
                var start = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
                query = query.Where(md => md.SessionDate >= start);
            }

            if (endDate.HasValue)
            {
                var end = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1), DateTimeKind.Utc);
                query = query.Where(md => md.SessionDate < end);
            }

            var damages = await query
                .OrderByDescending(md => md.SessionDate)
                .ToListAsync();

            var muscleGroups = await _context.MuscleGroups.ToDictionaryAsync(mg => mg.Key);

            return damages.Select(d => new MuscleDamageDto
            {
                MuscleGroupKey = d.MuscleGroupKey,
                MuscleGroupName = muscleGroups.TryGetValue(d.MuscleGroupKey, out var mg) ? mg.NamePl : d.MuscleGroupKey,
                SessionDate = d.SessionDate,
                DamagePercent = d.DamagePercent,
                IsPrimary = d.IsPrimary
            }).ToList();
        }

        public async Task<List<MuscleGroupDto>> GetMuscleGroupsAsync()
        {
            return await _context.MuscleGroups
                .Select(mg => new MuscleGroupDto
                {
                    Key = mg.Key,
                    NamePl = mg.NamePl,
                    IsFront = mg.IsFront,
                    HalfLife = mg.HalfLife
                })
                .ToListAsync();
        }
    }
}