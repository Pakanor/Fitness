using FitnessApp.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace FitnessApp.Helpers
{

   
    public class UIStateManager : BaseViewModel
    {
        private Visibility _scanVisibility;
        private Visibility _inputVisibility;
        private Visibility _backButtonVisibility;
        private Visibility _startPanelVisibility;

        public Visibility ScanVisibility
        {
            get => _scanVisibility;
            set => SetProperty(ref _scanVisibility, value);
        }

        public Visibility InputVisibility
        {
            get => _inputVisibility;
            set => SetProperty(ref _inputVisibility, value);
        }

        public Visibility BackButtonVisibility
        {
            get => _backButtonVisibility;
            set => SetProperty(ref _backButtonVisibility, value);
        }

        public Visibility StartPanelVisibility
        {
            get => _startPanelVisibility;
            set => SetProperty(ref _startPanelVisibility, value);
        }


        public UIStateManager()
        {
            ScanVisibility = Visibility.Collapsed;
            InputVisibility = Visibility.Collapsed;
            BackButtonVisibility = Visibility.Collapsed; 
            StartPanelVisibility = Visibility.Visible; 
        }

        public void SetScanMode()
        {
            ScanVisibility = Visibility.Visible;
            InputVisibility = Visibility.Collapsed;
            BackButtonVisibility = Visibility.Visible;
            StartPanelVisibility = Visibility.Collapsed; 
        }

        public void SetInputMode()
        {
            ScanVisibility = Visibility.Collapsed;
            InputVisibility = Visibility.Visible;
            BackButtonVisibility = Visibility.Visible;
            StartPanelVisibility = Visibility.Collapsed; 
        }

        public void SetStartMode()
        {
            ScanVisibility = Visibility.Collapsed;
            InputVisibility = Visibility.Collapsed;
            BackButtonVisibility = Visibility.Collapsed;
            StartPanelVisibility = Visibility.Visible;
        }
    }
}