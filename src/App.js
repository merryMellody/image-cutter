import "./App.css";
import React, { useLayoutEffect, useRef } from "react";
import { useFilePicker } from "react-sage";
import { useEffect, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

const ColoredRect = ({ height, width, left, top }) => {
  return (
    <Rect
      x={left}
      y={top}
      stroke="white"
      strokeWidth={5}
      dash={[10, 10]}
      width={width}
      height={height}
      shadowBlur={5}
    />
  );
};

function App() {
  const [imageSrc, setImageSrc] = useState("");
  const [imageHeight, setImageHeight] = useState(50);
  const [imageWidth, setImageWidth] = useState(50);
  const [imageLeft, setImageLeft] = useState(0);
  const [imageTop, setImageTop] = useState(0);
  const [cursorLeft, setCursorLeft] = useState(0);
  const [cursorTop, setCursorTop] = useState(0);
  const [startLeft, setStartLeft] = useState(0);
  const [startTop, setStartTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [rects, setRects] = useState([]);

  const imageRef = useRef(null);

  const { files, onClick, HiddenFileInput } = useFilePicker();

  const updateSize = () => {
    if (imageRef.current) {
      setImageHeight(imageRef.current.clientHeight);
      setImageWidth(imageRef.current.clientWidth);
      setImageLeft(imageRef.current.offsetLeft);
      setImageTop(imageRef.current.offsetTop);
    }
  };

  useLayoutEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  });

  useEffect(() => {
    if (files[0]) {
      const newImage = files[0];
      const imageURL = URL.createObjectURL(newImage);
      setImageSrc(imageURL);
    }
  }, [files]);

  return (
    <div className="App">
      <header className="App-header">
        {imageSrc ? (
          <div>
            <img
              src={imageSrc}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
              alt="alt"
              ref={imageRef}
              onLoad={() => updateSize()}
            />
            <p>{`Image: ${imageSrc}`}</p>
          </div>
        ) : (
          <div>
            <button type="button" onClick={onClick}>
              Load Image
            </button>
            <p>No Image Loaded</p>
          </div>
        )}
        <Stage
          width={imageWidth}
          height={imageHeight}
          style={{ position: "absolute", left: 0, top: imageTop }}
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartLeft(e.evt.clientX);
            setStartTop(e.evt.clientY);
          }}
          onMouseUp={(e) => {
            setIsDragging(false);
            const newRect = {
              left: startLeft,
              top: startTop,
              width: e.evt.clientX - imageLeft - startLeft,
              height: e.evt.clientY - imageTop - startTop,
            };
            setRects([...rects, newRect]);
          }}
          onMouseMove={(e) => {
            setCursorLeft(e.evt.clientX);
            setCursorTop(e.evt.clientY);
          }}
        >
          <Layer>
            {isDragging && (
              <ColoredRect
                width={cursorLeft - imageLeft - startLeft}
                height={cursorTop - imageTop - startTop}
                left={startLeft}
                top={startTop}
              />
            )}
            {rects.map((rect, idx) => {
              return (
                <ColoredRect
                  width={rect.width}
                  height={rect.height}
                  left={rect.left}
                  top={rect.top}
                  key={idx}
                />
              );
            })}
          </Layer>
        </Stage>
      </header>
      <HiddenFileInput accept="image/png, image/jpeg, image/jpg" />
    </div>
  );
}

export default App;
