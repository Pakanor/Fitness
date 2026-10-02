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
    }
}