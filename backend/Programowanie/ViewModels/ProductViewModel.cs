using System.Collections.ObjectModel;
using BackendLogicApi.Models;
using System.Windows;
using Newtonsoft.Json;
using BackendLogicApi.Services;
namespace FitnessApp.ViewModels
{
    public class ProductViewModel : BaseViewModel
    {
        private readonly ProductServiceAPI _productService;
        private ObservableCollection<Product> _products;
        private Product _selectedProduct;
        private string _errorMessage;
        private string _productName;
       

        public string ProductName
        {
            get => _productName;
            set
            {
                if (_productName != value)
                {
                    _productName = value;
                    OnPropertyChanged(nameof(ProductName)); 
                }
            }
        }
        public Product Product { get; set; }



        public ObservableCollection<Product> Products
        {
            get => _products;
            set
            {
                _products = value;
                OnPropertyChanged(nameof(Products)); 
            }
        }

        public Product SelectedProduct
        {
            get => _selectedProduct;
            set => SetProperty(ref _selectedProduct, value);
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        public ProductViewModel()
        {
            _productService = new ProductServiceAPI();
            Products = new ObservableCollection<Product> { };

        }

        public async Task LoadProductByBarcode(string barcode)
        {
            try
            {
                ErrorMessage = "";
                dynamic apiResponse = await _productService.GetProductFromApiBarcode(barcode);

                string productJson = apiResponse.ToString();
                Product product = JsonConvert.DeserializeObject<Product>(productJson);
                if (product != null)
                {
                    SelectedProduct = product;
                    Product = product;

                    double defaultGrams = 100;
                    var window = new ProductDetailsWindow(product, defaultGrams);
                    window.ShowDialog();

                }
                else
                {
                    ErrorMessage = "Product not found!";
                    MessageBox.Show("Product not found!");
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Error scanning barcode: " + ex.Message;
                MessageBox.Show($"Error scanning barcode: {ex.Message}");
            }
        }

       


        public async Task LoadProductByName(string name)
        {
            try
            {
                ErrorMessage = "";

                var productList = await _productService.GetProductFromApiName(name);

                if (productList != null)
                {

                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        Products.Clear();

                        foreach (var product in productList)
                        {
                            Products.Add(product);

                        }



                        SelectedProduct = Products.FirstOrDefault();
                    });

                }
                else
                {
                    ErrorMessage = "Product not found!";
                    MessageBox.Show("Produkt nie znaleziony!", "Błąd");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Błąd w LoadProductByName:\n{ex.Message}", "Błąd");
            }
        }

    }
}