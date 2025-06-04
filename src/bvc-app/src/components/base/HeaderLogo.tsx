"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeaderLogo() {
  return (
    <>
      <div className="self-start flex flex-row flex-no-wrap justify-between items-center">
        <Link  href="/" className="no-underline absolute bottom-0 bg-white backdrop-blur px-5 py-2.5">
          <Image
            className="max-w-48 pt-0"
            width={158}
            height={56}
            src="https://cdn.prod.website-files.com/66a3bc593897e719dcefcb83/66d8b7a9a35458bda1fdce3e_Logo%20BVC%20Color.svg"
            alt="Bow Valley College"
          />
        </Link>
      </div>
    </>
  );
}
