import Image from "next/image";
import type { ImageAsset } from "@/content/types";

type Props = {
  image: ImageAsset;
  /** next/image sizes hint for the rendered width. */
  sizes: string;
  priority?: boolean;
};

/**
 * Every screenshot sits in the same 16:10 frame: 1 px line, 6 px radius,
 * cropped from the top left. The apps keep their own styling.
 */
export function ScreenshotFrame({ image, sizes, priority = false }: Props) {
  return (
    <div className="aspect-[16/10] overflow-hidden rounded-image border border-line">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        className="block h-full w-full object-cover object-left-top"
      />
    </div>
  );
}
