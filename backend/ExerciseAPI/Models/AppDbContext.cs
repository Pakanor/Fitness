using Microsoft.EntityFrameworkCore;
using ExerciseAPI.Models;

namespace ExerciseAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<UserExercise> UserExercise { get; set; }
        public DbSet<PersonalRecord> PersonalRecords { get; set; }
        public DbSet<ExerciseMuscleGroup> ExerciseMuscleGroups { get; set; }
        public DbSet<MuscleGroup> MuscleGroups { get; set; }
        public DbSet<MuscleDamage> MuscleDamage { get; set; }
        public DbSet<WorkoutTemplate> WorkoutTemplates { get; set; }
        public DbSet<TemplateExercise> TemplateExercises { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserExercise>()
                .HasIndex(ue => ue.Date);

            modelBuilder.Entity<UserExercise>()
                .HasIndex(ue => new { ue.UserId, ue.Date });

            modelBuilder.Entity<MuscleGroup>().HasData(
                new MuscleGroup { Key = "chest_main", NamePl = "Klatka piersiowa", IsFront = true, HalfLife = 42 },
                new MuscleGroup { Key = "deltoid_anterior", NamePl = "Bark przedni", IsFront = true, HalfLife = 30 },
                new MuscleGroup { Key = "deltoid_lateral", NamePl = "Bark boczny", IsFront = true, HalfLife = 30 },
                new MuscleGroup { Key = "deltoid_posterior", NamePl = "Bark tylny", IsFront = false, HalfLife = 30 },
                new MuscleGroup { Key = "biceps", NamePl = "Biceps", IsFront = true, HalfLife = 30 },
                new MuscleGroup { Key = "triceps", NamePl = "Triceps", IsFront = false, HalfLife = 30 },
                new MuscleGroup { Key = "forearms", NamePl = "Przedramiona", IsFront = true, HalfLife = 24 },
                new MuscleGroup { Key = "lats", NamePl = "Plecy szerokie", IsFront = false, HalfLife = 42 },
                new MuscleGroup { Key = "rhomboids", NamePl = "Romby i czworoboczny", IsFront = false, HalfLife = 30 },
                new MuscleGroup { Key = "lower_back", NamePl = "Dolny odcinek pleców", IsFront = false, HalfLife = 30 },
                new MuscleGroup { Key = "abs", NamePl = "Brzuch", IsFront = true, HalfLife = 24 },
                new MuscleGroup { Key = "core_stabilizers", NamePl = "Stabilizatory tułowia", IsFront = true, HalfLife = 24 },
                new MuscleGroup { Key = "quadriceps", NamePl = "Czwórki", IsFront = true, HalfLife = 42 },
                new MuscleGroup { Key = "hamstrings", NamePl = "Dwugłowe uda", IsFront = false, HalfLife = 30 },
                new MuscleGroup { Key = "glutes", NamePl = "Pośladki", IsFront = false, HalfLife = 42 },
                new MuscleGroup { Key = "calves", NamePl = "Łydki", IsFront = false, HalfLife = 24 }
            );

            modelBuilder.Entity<WorkoutTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.UserId);
            });

            modelBuilder.Entity<TemplateExercise>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Template)
                    .WithMany(t => t.TemplateExercises)
                    .HasForeignKey(e => e.TemplateId);
                entity.HasOne(e => e.Exercise)
                    .WithMany()
                    .HasForeignKey(e => e.ExerciseId);
                entity.HasIndex(e => new { e.TemplateId, e.Order });
            });
        }
    }
}
