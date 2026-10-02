using System;
using Microsoft.EntityFrameworkCore;
using BackendLogicApi.Models;

namespace BackendLogicApi.DataAccess
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<ProductLogEntry> ProductLogEntries { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Product>()
                .OwnsOne(p => p.Nutriments, nb =>
                {
                    nb.Property(n => n.Energy).IsRequired();
                    nb.Property(n => n.EnergyUnit).IsRequired();
                    nb.Property(n => n.Fat).IsRequired();
                    nb.Property(n => n.Carbs).IsRequired();
                    nb.Property(n => n.Proteins).IsRequired();
                    nb.Property(n => n.Salt).IsRequired();
                });

            modelBuilder.Entity<ProductLogEntry>()
                .HasOne(p => p.User)
                .WithMany(u => u.ProductLogs)
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<User>()
                .Property(u => u.Username)
                .HasMaxLength(100)
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.Email)
                .HasMaxLength(255)
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.PasswordHash)
                .IsRequired();
        }
    }
}