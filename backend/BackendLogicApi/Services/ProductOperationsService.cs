using BackendLogicApi.DataAccess;
using BackendLogicApi.Interfaces;
using BackendLogicApi.Models;


namespace BackendLogicApi.Services
{
    public class ProductOperationsService : IProductOperationsService
    {
        private readonly List<Product> _products;
        private readonly ProductLogRepository _repository;


        public Product NewProduct { get; set; } = new Product();

        public ProductOperationsService(ProductLogRepository logRepository)
        {

            _products = new List<Product>();
            _repository = logRepository;


        }

        public async Task AddUserLogAsync(Product product, double grams, Nutriments calculated)
        {
            

            var entry = new ProductLogEntry
            {
                ProductName = product.ProductName,
                Brands = product.Brands,
                Grams = grams,
                Energy = calculated.Energy,
                Fat = calculated.Fat,
                Sugars = calculated.Carbs, 
                Proteins = calculated.Proteins,
                Salt = calculated.Salt,
                EnergyUnit = calculated.EnergyUnit,
                LoggedAt = DateTime.UtcNow
            };
            await _repository.AddLogEntryAsync(entry);
        }



        public async Task DeleteUserLogAsync(int id)
        {
            var log = await _repository.GetByIdAsync(id); 
            if (log == null)
                throw new Exception($"Log with ID {id} not found.");

            await _repository.DeleteAsync(log);
        }
        public async Task<List<ProductLogEntry>> GetRecentLogsAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<bool> HasAnyLogsAsync()
        {
            var logs = await _repository.GetAllAsync();
            return logs.Any();
        }
        public async Task UpdateUserLogAsync(ProductLogEntry updatedEntry)
        {
            await _repository.UpdateAsync(updatedEntry);
        }

    }
}
