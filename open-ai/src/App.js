import React, { useRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import * as bodyPix from "@tensorflow-models/body-pix";
import {saveAs} from 'file-saver';

const App = () => {
  const imageRef = useRef(null);
  const [croppedImage, setCroppedImage] = useState();
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [isDraggable,setIsDraggable] = useState(true);
  const [framePosition, setFramePosition] = useState({ x: 0, y: 0 });
  const frameSize = { width: 400, height: 400 };

  const loadBodyPixModel = async () => {
    const net = await bodyPix.load();
    setIsModelLoaded(true);
    return net;
  };

  const captureImage = async () => {
    
    setIsDraggable(!isDraggable);
    const net = await loadBodyPixModel();
  
    const image = imageRef.current;
    const segmentation = await net.segmentPerson(image);
  
    const boundingBox = calculateBoundingBox(segmentation);
  
    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");
  
    croppedCanvas.width = frameSize.width;
    croppedCanvas.height = frameSize.height;
    if (boundingBox.left < 0) {
      croppedCtx.drawImage(
        image,
        boundingBox.left + 20,
        boundingBox.top,
        frameSize.width + 60,
        frameSize.height - 100,
        0,
        0,
        frameSize.width,
        frameSize.height
      );
    } else {
      croppedCtx.drawImage(
        image,
        boundingBox.left + 60,
        boundingBox.top,
        frameSize.width + 150,
        frameSize.height - 100,
        0,
        0,
        frameSize.width,
        frameSize.height
      );
    }
  
    const base64Image = croppedCanvas.toDataURL()
  console.log(base64Image)
    // Now, you send base64Image to the backend instead of croppedCanvas.toDataURL()
    const response = await fetch("http://192.168.0.112:5000/api/v1/dalle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ croppedImage: base64Image }),
    });
    const final = await response.json();
    setCroppedImage(final.imgData[0].url);
  };
  
  const calculateBoundingBox = (segmentation) => {
    const { data, width, height } = segmentation;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 0) {
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    return {
      left: framePosition.x + minX,
      top: framePosition.y + minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const handleDrag = (e, ui) => {
    setFramePosition({ x: ui.x, y: ui.y });
  };

  const showFrameAndCapture = () => {
    setShowFrame(true);
  };

  useEffect(() => {
    if (!isModelLoaded) {
      loadBodyPixModel();
    }
  }, [isModelLoaded]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div>
        <img id="original" style={{ width: '400px', height: '400px' }} ref={imageRef} src={require('./cat.png')} alt="image" />
      </div>
      {showFrame && (
        <Draggable
          defaultPosition={{ x: 0, y: 0 }}
          onDrag={handleDrag}
          disabled={!isDraggable}
        >
          <div
            style={{
              position: "absolute",
              border:'2px solid red',
              width: frameSize.width + "px",
              height: frameSize.height + "px",
              transform: `translate(${framePosition.x}px, ${framePosition.y}px)`,
            }}
          >
            {croppedImage && 
           <img style={{height:'100%'}} src={croppedImage} alt="croppedImage" /> 
            }
          </div>
        </Draggable>
      )}
      <button onClick={showFrameAndCapture}>
        crop
      </button>
      {showFrame && (
        <>
        <button onClick={captureImage} disabled={!isModelLoaded}>
          Generate
        </button>
        <button>download</button>
        </>
      )}
      
    </div>
  );
};

export default App;
