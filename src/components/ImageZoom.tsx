import { useState } from "react";

const ImageZoom = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  if (!src) return <p className="text-sm font-semibold">—</p>;

  return (
    <>
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 object-cover rounded cursor-pointer border"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="w-[90vw] h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};

export default ImageZoom;
