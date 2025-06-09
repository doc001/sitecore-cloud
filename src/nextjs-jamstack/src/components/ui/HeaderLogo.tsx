"use client";

import React from "react";
import Image from "next/image";

export default function HeaderLogo() {
  return (
    <>
      <div className="self-start flex flex-row flex-no-wrap justify-between items-center">
        <a className="no-underline absolute bottom-0" href="./">
          <Image
            className="max-w-48 pt-0"
            width={208}
            height={74}
            src="https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66a3d2e228e3e933f5ed0db9_logo-white-1.png"
            alt="Bow Valley College"
          />
        </a>
      </div>
    </>
  );
}
