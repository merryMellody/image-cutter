import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFilePicker } from "react-sage";
import { Stage, Layer, Rect, Image } from "react-konva";
import useImage from "use-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import "./App.css";
import { IRect } from "konva/types/types";

interface RectType {
  height: number;
  width: number;
  left: number;
  top: number;
}

interface ColoredRectProps {
  height: number;
  width: number;
  left: number;
  top: number;
}

interface CroppedImageProps {
  imgSrc: string;
  height: number;
  width: number;
  crop: IRect;
}

const ColoredRect = ({ height, width, left, top }: ColoredRectProps) => {
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

const CroppedImage = ({ imgSrc, width, height, crop }: CroppedImageProps) => {
  const [image] = useImage(imgSrc);

  return <Image image={image} width={width} height={height} crop={crop} />;
};

function App() {
  const [imageSrc, setImageSrc] = useState("");
  const [imageHeight, setImageHeight] = useState(50);
  const [imageWidth, setImageWidth] = useState(50);
  const [naturalImageHeight, setNaturalImageHeight] = useState(50);
  const [naturalImageWidth, setNaturalImageWidth] = useState(50);
  const [widthRatio, setWidthRatio] = useState(1);
  const [heightRatio, setHeightRatio] = useState(1);
  const [imageLeft, setImageLeft] = useState(0);
  const [imageTop, setImageTop] = useState(0);
  const [cursorLeft, setCursorLeft] = useState(0);
  const [cursorTop, setCursorTop] = useState(0);
  const [startLeft, setStartLeft] = useState(0);
  const [startTop, setStartTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [rects, setRects] = useState<Array<RectType>>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [maxHeight, setMaxHeight] = useState(200);

  const imageRef = useRef<HTMLImageElement>(null);

  const { files, onClick, HiddenFileInput } = useFilePicker();

  const zipImagesAndDownload = async () => {
    const zip = new JSZip();
    const folder = zip.folder("cropped-images");

    if (folder) {
      for (let i = 1; i < rects.length + 1; i += 1) {
        const canvas: HTMLCanvasElement | null = document.querySelector(
          `.cropped-image-${i} canvas`
        );
        if (canvas) {
          const imageUrl = canvas.toDataURL("image/png");

          // Fetch the image and parse the response stream as a blob
          const imageBlob = await fetch(imageUrl).then((response) =>
            response.blob()
          );

          // create a new file from the blob object
          // @ts-ignore
          const imageFile = new File([imageBlob], `cropped-image-${i}.jpg`);

          folder.file(`cropped-image-${i}.jpg`, imageFile);
        }
      }

      folder
        .generateAsync({ type: "blob" })
        .then((content) => saveAs(content, "cropped-images.zip"));
    }
  };

  const updateSize = () => {
    if (imageRef.current) {
      setImageHeight(imageRef.current.clientHeight);
      setImageWidth(imageRef.current.clientWidth);
      setNaturalImageHeight(imageRef.current.naturalHeight);
      setNaturalImageWidth(imageRef.current.naturalWidth);
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
    if (files && files[0]) {
      const newImage = files[0];
      const imageURL = URL.createObjectURL(newImage);
      setImageSrc(imageURL);
    }
  }, [files]);

  useEffect(() => {
    const newWidthRatio = naturalImageWidth / imageWidth;
    const newHeightRatio = naturalImageHeight / imageHeight;

    setWidthRatio(newWidthRatio);
    setHeightRatio(newHeightRatio);
  }, [imageWidth, imageHeight, naturalImageWidth, naturalImageHeight]);

  useEffect(() => {
    const maxHeight = rects.reduce((acc, val) => {
      if (val.height > acc) {
        return val.height + 15;
      }

      return 200;
    }, 200);

    setMaxHeight(maxHeight);
  }, [rects]);

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
          style={{
            position: "absolute",
            left: imageLeft,
            top: imageTop,
            cursor: "crosshair",
          }}
          onMouseDown={(e) => {
            e.evt.preventDefault();
            setIsDragging(true);
            setStartLeft(e.evt.pageX);
            setStartTop(e.evt.pageY);
          }}
          onMouseUp={(e) => {
            e.evt.preventDefault();
            setIsDragging(false);
            const newWidth = e.evt.pageX - startLeft;
            const newHeight = e.evt.pageY - startTop;

            if (newWidth > 10 && newHeight > 10) {
              const newRect = {
                left: startLeft - imageLeft,
                top: startTop - imageTop,
                width: newWidth,
                height: newHeight,
              };
              setRects([...rects, newRect]);
            }
          }}
          onMouseMove={(e) => {
            e.evt.preventDefault();
            setCursorLeft(e.evt.pageX);
            setCursorTop(e.evt.pageY);
          }}
        >
          <Layer>
            {isDragging && (
              <ColoredRect
                width={cursorLeft - startLeft}
                height={cursorTop - startTop}
                left={startLeft - imageLeft}
                top={startTop - imageTop}
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
        {rects.map((rect, idx) => (
          <button
            type="button"
            style={{
              position: "absolute",
              left: rect.left + imageLeft,
              top: rect.top + imageTop,
            }}
            onClick={() => {
              const newRects = rects;
              newRects.splice(idx, 1);
              setRects(newRects);
            }}
          >
            X
          </button>
        ))}
        {rects.length > 0 && (
          <div
            id="result-area"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "flex",
              flexDirection: "row",
              border: "5px solid white",
              borderRadius: "5px",
              height: showDrawer ? `${maxHeight}px` : "200px",
              backgroundColor: "grey",
              maxWidth: "90%",
            }}
          >
            <div
              id="image-section"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                overflow: "scroll",
              }}
            >
              {imageSrc !== "" &&
                showDrawer &&
                rects.map((rect, idx) => (
                  <div>
                    <Stage
                      className={`cropped-image-${idx + 1}`}
                      width={rect.width}
                      height={rect.height}
                      onClick={() => {
                        const canvas: HTMLCanvasElement | null = document.querySelector(
                          `.cropped-image-${idx + 1} canvas`
                        );
                        if (canvas) {
                          const uri = canvas.toDataURL("image/png");
                          const link = document.createElement("a");
                          link.download = `cropped-image-${idx + 1}`;
                          link.href = uri;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      style={{ margin: "8px" }}
                    >
                      <Layer>
                        <CroppedImage
                          imgSrc={imageSrc}
                          width={rect.width}
                          height={rect.height}
                          crop={{
                            x: widthRatio * rect.left,
                            y: heightRatio * rect.top,
                            width: widthRatio * rect.width,
                            height: heightRatio * rect.height,
                          }}
                        />
                      </Layer>
                    </Stage>
                  </div>
                ))}
              {showDrawer && (
                <button
                  type="button"
                  style={{ height: "20%", marginRight: "8px" }}
                  onClick={() => {
                    zipImagesAndDownload();
                  }}
                >
                  Download All
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowDrawer(!showDrawer);
              }}
              style={{ height: "100%" }}
            >
              {showDrawer ? "<" : ">"}
            </button>
          </div>
        )}
      </header>
      <HiddenFileInput accept="image/png, image/jpeg, image/jpg" />
    </div>
  );
}

export default App;
