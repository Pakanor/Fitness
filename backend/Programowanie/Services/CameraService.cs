using AForge.Video.DirectShow;
using AForge.Video;
using FitnessApp.Interfaces;
using System.Drawing.Imaging;
using System.Drawing;

namespace FitnessApp.Services
{
    public class CameraService : ICameraService
    {
        private FilterInfoCollection videoDevices;
        private VideoCaptureDevice videoSource;

        public event EventHandler<Bitmap> FrameReceived;

        public void StartCamera()
        {
            try
            {
                videoDevices = new FilterInfoCollection(FilterCategory.VideoInputDevice);
                if (videoDevices.Count == 0)
                {
                    throw new Exception("Brak dostępnych kamer.");
                }

                videoSource = new VideoCaptureDevice(videoDevices[0].MonikerString);
                videoSource.NewFrame += Video_NewFrame;
                videoSource.Start();
            }
            catch (Exception ex)
            {
                throw new Exception("Błąd inicjalizacji kamery: " + ex.Message);
            }
        }

        public void StopCamera()
        {
            if (videoSource != null && videoSource.IsRunning)
            {
                videoSource.SignalToStop(); 
                videoSource = null;
            }
        }

        public void ProcessFrame(Bitmap frame)
        {
            Bitmap grayscaleBitmap = ConvertToGrayscale(frame);

            FrameReceived?.Invoke(this, grayscaleBitmap);
        }

        private void Video_NewFrame(object sender, NewFrameEventArgs eventArgs)
        {
            try
            {
                using (Bitmap bitmap = (Bitmap)eventArgs.Frame.Clone())
                {
                    ProcessFrame(bitmap);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Błąd przetwarzania klatki: " + ex.Message);
            }
        }

        private Bitmap ConvertToGrayscale(Bitmap original)
        {
            Bitmap grayscaleBitmap = new Bitmap(original.Width, original.Height);
            using (Graphics g = Graphics.FromImage(grayscaleBitmap))
            {
                ColorMatrix colorMatrix = new ColorMatrix(new float[][]
                {
                new float[] {0.3f, 0.3f, 0.3f, 0, 0},
                new float[] {0.59f, 0.59f, 0.59f, 0, 0},
                new float[] {0.11f, 0.11f, 0.11f, 0, 0},
                new float[] {0, 0, 0, 1, 0},
                new float[] {0, 0, 0, 0, 1}
                });

                using (ImageAttributes attributes = new ImageAttributes())
                {
                    attributes.SetColorMatrix(colorMatrix);
                    g.DrawImage(original, new Rectangle(0, 0, original.Width, original.Height), 0, 0, original.Width, original.Height, GraphicsUnit.Pixel, attributes);
                }
            }
            return grayscaleBitmap;
        }
    }
}