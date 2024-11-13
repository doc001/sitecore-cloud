"use client";

import React from "react";
import RainbowHr from "@/components/ui/rainbowHr";
import "@/styles/banners.css";

const imacStatic = () => {
  return (
    <>
      <section className='bg-[center_top_-20rem] bg-no-repeat bg-[url("https://cdn.prod.website-files.com/66a28fdfe76f2f849d7b00f3/66e4fe8fecfe3a601045b24b_Homepage-1.webp")] h-[80vh]'>
        <div className="w-full h-20 flex flex-row flex-wrap justify-center">
          <div className="flex flex-row sm:w-10/12 w-full justify-between py-40 sm:pl-24 pl-0">
            <div className="text-white">
              <h2 className="htg">Hit the ground</h2>
              <h1 className="pt-6 cta">working.</h1>
              <h3 className="pt-6 cta-2">Graduate career-ready.</h3>
            </div>
          </div>
        </div>
      </section>
      <RainbowHr />
    </>
  );
};

export default imacStatic;
