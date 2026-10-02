using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows;
using Newtonsoft.Json;
using BackendLogicApi.Models;
using BackendLogicApi.Interfaces;

namespace BackendLogicApi.Services
{
    public class ProductServiceAPI : IProductServiceAPI
    {
        private readonly HttpClient _client;

        public ProductServiceAPI(HttpClient client)
        {
            _client = client;
        }

        public async Task<dynamic> GetProductFromApiBarcode(string barcode)
        {
            try
            {
                string url = $"https://world.openfoodfacts.org/api/v0/product/{barcode}.json";

                var response = await _client.GetStringAsync(url);

                dynamic apiResponse = JsonConvert.DeserializeObject(response);

                if (apiResponse != null && apiResponse.product != null)
                {
                    return apiResponse.product; 
                }
                else
                {
                    Console.WriteLine("Brak danych produktu.");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Błąd: {ex.Message}"); 
                return null; 
            }
        }

        public async Task<dynamic> GetProductFromApiName(string productName)
        {
            try
            {
                string url = $"https://world.openfoodfacts.org/cgi/search.pl?search_terms={Uri.EscapeDataString(productName)}&search_simple=1&action=process&json=1&lc=pl";


                var response = await _client.GetStringAsync(url);


                var apiResponse = JsonConvert.DeserializeObject<ApiSearchResponse>(response);

                if (apiResponse?.Products != null && apiResponse.Products.Any())

                {
                    var filteredProducts = apiResponse.Products.Where(p =>
                        p.Nutriments != null &&
                        p.Nutriments.Energy != null &&
                        p.Nutriments.Fat != null &&
                        p.Nutriments.Carbs != null &&
                        p.Nutriments.Proteins != null &&
                        p.Nutriments.Salt != null).ToList();

                    return filteredProducts;
                }
                else
                {
                    return new List<Product>();
                }
            }
            catch (Exception ex)
            {
                return null;
            }
        
    }
       

        // for serializing
        public class ApiSearchResponse
        {
            [JsonProperty("products")]
            public List<Product> Products { get; set; }
        }


    }
}
