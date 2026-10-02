using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;


namespace BackendLogicApi.Models
{
    

    public class Product
    {

        [JsonIgnore]
        public int Id { get; set; }
        [JsonProperty("product_name")]
        public string ProductName { get; set; }

        [JsonProperty("brands")]
        public string Brands { get; set; }

        [JsonProperty("nutriments")]
        public Nutriments Nutriments { get; set; }
    }

    public class Nutriments
    {
        [JsonProperty("energy")]
        public double Energy { get; set; }

        [JsonProperty("energy_unit")]
        public string EnergyUnit { get; set; }

        [JsonProperty("fat")]
        public double Fat { get; set; }

        [JsonProperty("carbohydrates")]
        public double Carbs { get; set; }

        [JsonProperty("proteins")]
        public double Proteins { get; set; }

        [JsonProperty("salt")]
        public double Salt { get; set; }
    }


    public class ProductLogEntry
{
    public int Id { get; set; }

    public string ProductName { get; set; }
    public string Brands { get; set; }

    public double Grams { get; set; }

    public double Energy { get; set; }
    public double Fat { get; set; }
    public double Sugars { get; set; }
    public double Proteins { get; set; }
    public double Salt { get; set; }
    public string EnergyUnit { get; set; }

    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    public int? UserId { get; set; }

    public User? User { get; set; }
}
    public class CalculationRequest
    {
        public Product Product { get; set; }
        public double Grams { get; set; }
    }

    public class AddLogRequest
    {
        public Product Product { get; set; }
        public double Grams { get; set; }
    }


   
}
