import { CSSProperties } from "react";

import { cx } from "#/helpers/css";
import { useAppDispatch } from "#/store";

import GalleryMedia, { GalleryMediaProps } from "./gallery/GalleryMedia";
import { IMAGE_FAILED, imageFailed, imageLoaded } from "./imageSlice";
import MediaPlaceholder from "./MediaPlaceholder";
import { isLoadedImageData } from "./useImageData";
import useMediaLoadObserver, {
  getTargetDimensions,
} from "./useMediaLoadObserver";

import mediaPlaceholderStyles from "./MediaPlaceholder.module.css";

export type MediaProps = Omit<GalleryMediaProps, "ref"> & {
  defaultAspectRatio?: number;
  mediaClassName?: string;
};

export default function Media({
  src,
  className,
  style: baseStyle,
  defaultAspectRatio,
  mediaClassName,
  ...props
}: MediaProps) {
  const dispatch = useAppDispatch();
  const [mediaRef, imageData] = useMediaLoadObserver(src);

  function buildPlaceholderState() {
    if (imageData === IMAGE_FAILED) return "error";
    if (!imageData) return "loading";

    return "loaded";
  }

  function buildStyle(): CSSProperties {
    if (!imageData || imageData === IMAGE_FAILED) return { opacity: 0 };

    return { aspectRatio: imageData.aspectRatio };
  }

  return (
    <MediaPlaceholder
      className={className}
      style={baseStyle}
      state={buildPlaceholderState()}
      defaultAspectRatio={defaultAspectRatio}
    >
      <GalleryMedia
        {...props}
        src={src}
        className={cx(mediaPlaceholderStyles.media, mediaClassName)}
        style={buildStyle()}
        ref={mediaRef as React.Ref<HTMLImageElement>}
        portalWithMediaId={props.portalWithMediaId}
        onError={() => {
          if (src) dispatch(imageFailed(src));
        }}
        // useMediaLoadObserver fires if image is partially loaded.
        // but sometimes a Safari quirk doesn't fire the resize handler.
        // this catches those edge cases.
        //
        // TLDR Image loading should still work with this function commented out!
        onLoad={(event) => {
          if (!src) return;
          if (isLoadedImageData(imageData)) return;

          const dimensions = getTargetDimensions(
            event.target as HTMLImageElement,
          );
          if (!dimensions) return;
          const { width, height } = dimensions;

          dispatch(imageLoaded({ src, width, height }));
        }}
      />
    </MediaPlaceholder>
  );
}
