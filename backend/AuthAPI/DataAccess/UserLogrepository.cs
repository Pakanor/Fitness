using AuthAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthAPI.DataAccess
{
    public class UserLogrepository
    {
        private readonly AppDbContext _context;



        public UserLogrepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<bool> UserExistsAsync(string email, string login)
        {
            return await _context.Users
                .AnyAsync(u => u.Email == email || u.Username == login);
        }
        public async Task AddUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        public async Task<User?> GetByEmailOrLoginAsync(string emailOrLogin)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == emailOrLogin || u.Username == emailOrLogin);
        }
        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.ID == id);
        }
        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(User user)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task AddSessionAsync(UserSession session)
        {
            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();
        }

        public async Task<List<UserSession>> GetActiveSessionsAsync(int userId)
        {
            return await _context.UserSessions
                .Where(s => s.UserId == userId && s.IsActive)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserSession?> GetSessionByIdAsync(int sessionId)
        {
            return await _context.UserSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        }

        public async Task<bool> RevokeSessionAsync(int sessionId, int userId)
        {
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return false;
            session.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RevokeSessionByTokenAsync(string sessionToken)
        {
            if (string.IsNullOrEmpty(sessionToken)) return false;
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken && s.IsActive);
            if (session == null) return false;
            session.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}