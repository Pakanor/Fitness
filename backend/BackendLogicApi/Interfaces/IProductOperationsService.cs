using BackendLogicApi.Models;
using Microsoft.EntityFrameworkCore.Update;

namespace BackendLogicApi.Interfaces
{
    public interface IProductOperationsService
    {
        Task AddUserLogAsync(Product product, double grams, Nutriments calculated);

        Task DeleteUserLogAsync(int id);
        Task<List<ProductLogEntry>> GetRecentLogsAsync();
        Task<bool> HasAnyLogsAsync();
        Task UpdateUserLogAsync(ProductLogEntry updatedEntry);

    }
}