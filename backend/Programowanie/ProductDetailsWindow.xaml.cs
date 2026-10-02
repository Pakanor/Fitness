using System.Windows;
using BackendLogicApi.Models;
using FitnessApp.ViewModels;

namespace FitnessApp
{
    public partial class ProductDetailsWindow : Window
    {
        public Product SelectedProduct { get; private set; }
        public int Grams { get; private set; } 
        public bool IsEditMode { get; set; } 
        private MainWindow mainWindow;


        public ProductDetailsWindow(Product product, double grams = 100)
        {
            InitializeComponent();
            mainWindow = new MainWindow();
            if (product == null)
            {
                IsEditMode = false;
                SelectedProduct = new Product();
            }
            else
            {
                IsEditMode = true;
                SelectedProduct = product; 
            }

            DataContext = new ProductDetailsViewModel(SelectedProduct, IsEditMode, grams);


            MessageBox.Show(product?.ProductName ?? "Nowy produkt");
        }
    }
}