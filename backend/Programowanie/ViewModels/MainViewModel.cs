using FitnessApp.Helpers;
using FitnessApp.Interfaces;
using BackendLogicApi.Models;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Input;
using FitnessApp.Services;

namespace FitnessApp.ViewModels
{
    public class MainViewModel : BaseViewModel
    {
        private readonly CameraViewModel _cameraViewModel;
        private bool _userClicked = false;
        private readonly ApiClient _apiClient = new ApiClient("http://localhost:5142");

        private readonly ProductViewModel _productViewModel;
        private readonly UIStateManager _uiStateManager;
        private readonly Debouncer _debouncer = new Debouncer(500);

        

        public string EmptyMessage { get; set; }
        public CameraViewModel CameraViewModel => _cameraViewModel;
        public ProductViewModel ProductViewModel => _productViewModel;
        public UIStateManager UIStateManager => _uiStateManager;
        public ObservableCollection<ProductLogEntry> ProductLogs { get; set; } = new();





        private string _searchText;
        public string SearchText
        {
            get => _searchText;
            set
            {
                if (_searchText != value)
                {
                    _searchText = value;
                    OnPropertyChanged(nameof(SearchText));
                    DebouncedSearch(_searchText);
                }
            }
        }


        private bool _isLoading;
        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }


        private Product _selectedProduct;
        public Product SelectedProduct
        {
            get => _selectedProduct;
            set
            {
                if (_selectedProduct != value)
                {
                    _selectedProduct = value;
                    OnPropertyChanged(nameof(SelectedProduct));

                    if (_userClicked && _selectedProduct != null)
                    {
                        ShowProductDetails(_selectedProduct);
                    }
                }
            }
        }

        public ICommand StartScanningCommand { get; }
        public ICommand AddProductCommand { get; }

        public ICommand BackToStartCommand { get; }
        public ICommand DeleteProductLogCommand { get; }
        public ICommand EditProductLogCommand { get; }
        public ICommand ProductClickedCommand => new RelayCommand<Product>(OnProductClicked);




        public MainViewModel()
        {

           
            ICameraService cameraService = new CameraService();
            BarcodeReaderService barcodeReaderService = new BarcodeReaderService();

            _cameraViewModel = new CameraViewModel(cameraService, barcodeReaderService);
            _productViewModel = new ProductViewModel();
            _uiStateManager = new UIStateManager();
            DeleteProductLogCommand = new RelayCommand<ProductLogEntry>(DeleteProductLog);
            EditProductLogCommand = new RelayCommand<ProductLogEntry>(EditProductLog);
            _cameraViewModel.BarcodeDetected += OnBarcodeDetected;

            StartScanningCommand = new RelayCommand(StartScanning);
            AddProductCommand = new RelayCommand(AddProduct);
            BackToStartCommand = new RelayCommand(BackToStart);

        }

        private void OnProductClicked(Product clickedProduct)
        {

            if (clickedProduct == SelectedProduct)
            {
                SelectedProduct = null;
            }
            else
            {
                _userClicked = true;
                SelectedProduct = clickedProduct;
                

            }

        }
        private void ShowProductDetails(Product product)
        {
            var detailsWindow = new ProductDetailsWindow(product);
            if (detailsWindow.ShowDialog() == true)
            {

                MessageBox.Show($"eee: {product.Brands}, Ilość: {detailsWindow.Grams}g");
            }
            _userClicked = false;
            SelectedProduct = null;
        }

        private async void OnBarcodeDetected(object sender, string barcode)
        {
           await _productViewModel.LoadProductByBarcode(barcode);
        }

        private async void DeleteProductLog(ProductLogEntry log)
        {
            try
            {
                await _apiClient.DeleteAsync($"api/productsoperation/delete/{log.Id}");
                ProductLogs.Remove(log);
            }
            catch (Exception ex)
            {
                MessageBox.Show("unable to delete");
            }
        }

        private void DebouncedSearch(string text)
        {
            _debouncer.Debounce(() =>
            {
                Application.Current.Dispatcher.Invoke(async () =>
                {
                    if (text.Trim().Length > 3)
                    {
                        await _productViewModel.LoadProductByName(text.Trim());
                    }
                });
            });
        }
        private async void EditProductLog(ProductLogEntry selectedEntry)
        {
            //logic for clicking the edit button

            if (selectedEntry == null)
                return;

            var product = new Product
            {
                Id = selectedEntry.Id,
                ProductName = selectedEntry.ProductName,
                Brands = selectedEntry.Brands,
                Nutriments = new Nutriments
                {
                    Energy = selectedEntry.Energy,
                    Fat = selectedEntry.Fat,
                    Carbs = selectedEntry.Sugars,
                    Proteins = selectedEntry.Proteins,
                    Salt = selectedEntry.Salt,
                    EnergyUnit = selectedEntry.EnergyUnit
                }
            };

            var window = new ProductDetailsWindow(product, selectedEntry.Grams);
            Application.Current.MainWindow.Close();
            if (window.ShowDialog() == true)
            {

                selectedEntry.Grams = window.Grams;
                selectedEntry.Energy = product.Nutriments.Energy;
                selectedEntry.Fat = product.Nutriments.Fat;
                selectedEntry.Sugars = product.Nutriments.Carbs;
                selectedEntry.Proteins = product.Nutriments.Proteins;
                selectedEntry.Salt = product.Nutriments.Salt;
                selectedEntry.EnergyUnit = product.Nutriments.EnergyUnit;
            }
        }

      



        public void StartScanning()
        {
            CameraViewModel.StartCamera();
            UIStateManager.SetScanMode(); 

        }

        public void StopScanning()
        {
            CameraViewModel.StopCamera();
        }
        public void AddProduct()
        {
            CameraViewModel.StopCamera();
            UIStateManager.SetInputMode(); 

        }
        public void BackToStart()
        {
            CameraViewModel.StopCamera();
            UIStateManager.SetStartMode();
            LoadProductsAsync();
            _productViewModel.Products.Clear();
            SearchText = string.Empty;



        }

        public async Task LoadProductsAsync()
        {
            IsLoading = true;
            EmptyMessage = string.Empty;

            var logs = await _apiClient.GetAsync<List<ProductLogEntry>>("/api/productsoperation/recent");

            ProductLogs.Clear();

            if (logs.Any())
            {
                foreach (var log in logs)
                    ProductLogs.Add(log);
            }
            else
            {
                EmptyMessage = "Brak zapisanych produktów.";
            }

            IsLoading = false;
        }



    }

}