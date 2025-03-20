// import { useState, useRef, useEffect } from "react";
// import * as bodyPix from "@tensorflow-models/body-pix";
// import "@tensorflow/tfjs";

// const Removebg = () => {
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [originalImage, setOriginalImage] = useState(null);
//   const [isremovebg, setremovebg] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     if (selectedImage && isremovebg) {
//       removeBackground();
//     }
//   }, [selectedImage, isremovebg]); // Include isremovebg in dependencies

//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setOriginalImage(reader.result); // Save original image
//         setSelectedImage(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeBackground = async () => {
//     if (!selectedImage) {
//       alert("Please select an image first!");
//       return;
//     }

//     setLoading(true);

//     try {
//       const net = await bodyPix.load();
//       const img = new Image();
//       img.crossOrigin = "anonymous";
//       img.src = selectedImage;

//       img.onload = async () => {
//         const canvas = canvasRef.current;
//         const ctx = canvas.getContext("2d");

//         canvas.width = img.width;
//         canvas.height = img.height;

//         const segmentation = await net.segmentPerson(img, {
//           internalResolution: "medium",
//           segmentationThreshold: 0.46,
//         });

//         ctx.drawImage(img, 0, 0);
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const data = imageData.data;

//         for (let i = 0; i < data.length; i += 4) {
//           if (segmentation.data[i / 4] === 0) {
//             data[i + 3] = 0; // Set alpha to 0 (transparent)
//           }
//         }

//         ctx.putImageData(imageData, 0, 0);
//         const finalImage = canvas.toDataURL("image/png");
//         setSelectedImage(finalImage);
//         setremovebg(true);
//         setLoading(false);
//       };
//     } catch (error) {
//       console.error("Error removing background:", error);
//       setLoading(false);
//     }
//   };

//   const undoremoveBackground = () => {
//     setSelectedImage(originalImage);
//     setremovebg(false);
//   };

//   return (
//     <div>
//       <input type="file" onChange={handleImageUpload} accept="image/*" />

//       {selectedImage && (
//         <div>
//           <img src={selectedImage} alt="Selected" width="300" />
//           {!isremovebg ? (
//             <button
//               onClick={removeBackground}
//               disabled={loading}
//               style={{ backgroundColor: "green" }}
//             >
//               {loading ? "Processing..." : "Remove Background"}
//             </button>
//           ) : (
//             <button
//               onClick={undoremoveBackground}
//               style={{ backgroundColor: "red" }}
//             >
//               Undo Background
//             </button>
//           )}
//         </div>
//       )}

//       {/* Hidden Canvas for Processing */}
//       <canvas ref={canvasRef} style={{ display: "none" }} />
//     </div>
//   );
// };

// export default Removebg;

import { useState, useRef, useEffect } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";

const Removebg = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [useBackend, setUseBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (selectedImage) {
      processImage();
    }
  }, [selectedImage, useBackend]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result);
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (event) => {
    const items = event.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          setOriginalImage(e.target.result);
          setSelectedImage(e.target.result);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleURLUpload = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      setOriginalImage(url);
      setSelectedImage(url);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;
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
          segmentationThreshold: 0.6,
        });

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (segmentation.data[i / 4] === 0) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setProcessedImage(canvas.toDataURL("image/png"));
      };
    } catch (error) {
      console.error("Error processing image:", error);
    }

    setLoading(false);
  };

  const saveImage = () => {
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "processed_image.png";
    link.click();
  };

  return (
    <div onPaste={handlePaste}>
      <input type="file" onChange={handleImageUpload} accept="image/png, image/jpeg" />
      <button onClick={handleURLUpload}>Load from URL</button>
      {/* <label>
        <input
          type="checkbox"
          checked={useBackend}
          onChange={() => setUseBackend(!useBackend)}
        />
        Use Backend Processing
      </label> */}
      {loading && <p>Processing...</p>}

      {originalImage && processedImage && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <h3>Original Image</h3>
            <img src={originalImage} alt="Original" width="300" />
          </div>
          <div style={{ margin: "0 20px", width: "5px", background: "gray", cursor: "ew-resize" }}></div>
          <div>
            <h3>Processed Image</h3>
            <img src={processedImage} alt="Processed" width="300" />
            <button onClick={saveImage}>Download Image</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default Removebg;
