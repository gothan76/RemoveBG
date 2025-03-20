import { useState, useRef, useEffect } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";

const Removebg = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isremovebg, setremovebg] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (selectedImage && isremovebg) {
      removeBackground();
    }
  }, [selectedImage, isremovebg]); // Include isremovebg in dependencies

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result); // Save original image
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = async () => {
    if (!selectedImage) {
      alert("Please select an image first!");
      return;
    }

    setLoading(true);

    try {
      const net = await bodyPix.load();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedImage;

      img.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        const segmentation = await net.segmentPerson(img, {
          internalResolution: "medium",
          segmentationThreshold: 0.46,
        });

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (segmentation.data[i / 4] === 0) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const finalImage = canvas.toDataURL("image/png");
        setSelectedImage(finalImage);
        setremovebg(true);
        setLoading(false);
      };
    } catch (error) {
      console.error("Error removing background:", error);
      setLoading(false);
    }
  };

  const undoremoveBackground = () => {
    setSelectedImage(originalImage);
    setremovebg(false);
  };

  return (
    <div>
      <input type="file" onChange={handleImageUpload} accept="image/*" />

      {selectedImage && (
        <div>
          <img src={selectedImage} alt="Selected" width="300" />
          {!isremovebg ? (
            <button
              onClick={removeBackground}
              disabled={loading}
              style={{ backgroundColor: "green" }}
            >
              {loading ? "Processing..." : "Remove Background"}
            </button>
          ) : (
            <button
              onClick={undoremoveBackground}
              style={{ backgroundColor: "red" }}
            >
              Undo Background
            </button>
          )}
        </div>
      )}

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Removebg;
