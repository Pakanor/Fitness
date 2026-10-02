using System.Drawing;
using System.IO;
using System.Windows.Media.Imaging;
using ZXing;
using ZXing.Common;
using ZXing.Windows.Compatibility;
using FitnessApp.Interfaces;
using System.Windows;

using FitnessApp.Services;
namespace FitnessApp.Services
{
    public class BarcodeReaderService : IBarcodeService
    {

        private BarcodeReader barcodeReader;
        private CameraService _cameraService;

        public event EventHandler<string> BarcodeDetected; 

        public BarcodeReaderService()
        {
            InitializeBarcodeReader();
            _cameraService = new CameraService();
        }

        public void InitializeBarcodeReader()
        {
            if (barcodeReader == null) // Prevents multiple scnas
            {
                var options = new DecodingOptions
                {
                    TryHarder = true,
                    PossibleFormats = new List<BarcodeFormat>
                {
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.QR_CODE,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.UPC_A
                }
                };

                barcodeReader = new BarcodeReader
                {
                    AutoRotate = true,
                    Options = options
                };

            }
        }

        public void DecodeBarcode(Bitmap bitmap)
        {
            

            if (barcodeReader == null)
            {
                InitializeBarcodeReader();
            }

            try
            {
                var result = barcodeReader.Decode(bitmap);

                if (result != null)
                {
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        Application.Current.MainWindow.Hide();
                    });
                    _cameraService.StopCamera();

                    System.Windows.MessageBox.Show($"Zeskanowano kod: {result.Text}");

                    BarcodeDetected?.Invoke(this, result.Text);
                }
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show($"Zeskanowano kod: {ex.Message}");
            }
        }

        //converting Bitmap to BitmapImage
        public BitmapImage ConvertBitmapToBitmapImage(Bitmap bitmap)
        {
            using (MemoryStream memory = new MemoryStream())
            {
                bitmap.Save(memory, System.Drawing.Imaging.ImageFormat.Bmp);
                memory.Position = 0;

                BitmapImage bitmapImage = new BitmapImage();
                bitmapImage.BeginInit();
                bitmapImage.StreamSource = memory;
                bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                bitmapImage.EndInit();

                return bitmapImage;
            }
        }
    }
}