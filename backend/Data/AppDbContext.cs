using Microsoft.EntityFrameworkCore;
using ChatApi.Models;

namespace ChatApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
         .Property(u => u.Username)
         .HasMaxLength(100);

        modelBuilder.Entity<User>()
         .HasIndex(u => u.Username)
         .IsUnique();

        modelBuilder.Entity<RefreshToken>()
         .Property(r => r.Token)
         .HasMaxLength(512);

        modelBuilder.Entity<RefreshToken>()
         .HasIndex(r => r.Token)
         .IsUnique();

        modelBuilder.Entity<RefreshToken>()
         .HasOne(r => r.User)
         .WithMany()
         .HasForeignKey(r => r.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
         .Property(m => m.Room)
         .HasMaxLength(120);

        modelBuilder.Entity<Message>()
         .HasIndex(m => new { m.Room, m.SentAt });
    }
}