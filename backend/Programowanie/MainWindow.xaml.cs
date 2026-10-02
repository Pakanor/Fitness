using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using BackendLogicApi.Models;
using FitnessApp.ViewModels;

namespace FitnessApp
{
    public partial class MainWindow : Window
    {
        private MainViewModel _viewModel;

        public MainWindow()
        {
            InitializeComponent();


            _viewModel = new MainViewModel();
            this.DataContext = _viewModel;
            _viewModel.CameraViewModel.SetDispatcher(this.Dispatcher);
            _= _viewModel.LoadProductsAsync();



        }

        private void ProductLogItem_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (sender is ListBoxItem item && item.DataContext is Product product)
            {
                if (DataContext is MainViewModel vm)
                {
                    _viewModel.ProductClickedCommand.Execute(product);
                    e.Handled = true;
                }
            }
        }


        private void ProductListItem_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
           
            if (sender is ListBoxItem item && item.DataContext is Product product)
            {

                if (DataContext is MainViewModel vm)
                {
                    _viewModel.ProductClickedCommand.Execute(product);

                    e.Handled = true;
                   
                }
            }

        }








    }
}