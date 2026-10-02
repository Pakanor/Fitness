

namespace BackendLogicApi.Interfaces
{
    public interface IProductServiceAPI
    {
         Task<dynamic> GetProductFromApiBarcode(string barcode);
        Task<dynamic> GetProductFromApiName(string productName);
        public class ApiSearchResponse;


    }
}
