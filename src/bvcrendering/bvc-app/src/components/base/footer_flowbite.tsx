"use client";

import React from "react";
import {
  Footer,
  FooterBrand,
  FooterCopyright,
  FooterDivider,
  FooterIcon,
  FooterLink,
  FooterLinkGroup,
  FooterTitle,
} from "flowbite-react";
// Import your custom Icon component
import Icon from "./Icon";

function Footer_FlowBite() {
  return (
    <Footer container>
      <div className="w-full">
        <div
        className="mx-auto w-full 
          px-[5%] sm:px-[5%] md:px-[8%] lg:px-[10%]"
        >
        <div className="grid w-full justify-between sm:flex sm:justify-between md:flex md:grid-cols-1">
          <div>
            <FooterBrand
              href="https://flowbite.com"
              src="https://flowbite.com/docs/images/logo.svg"
              alt="Flowbite Logo"
              name="Flowbite"
            />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:mt-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <FooterTitle title="about" />
              <FooterLinkGroup col>
                <FooterLink href="#">Flowbite</FooterLink>
                <FooterLink href="#">Tailwind CSS</FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Follow us" />
              <FooterLinkGroup col>
                <FooterLink href="#">Github</FooterLink>
                <FooterLink href="#">Discord</FooterLink>
              </FooterLinkGroup>
            </div>
            <div>
              <FooterTitle title="Legal" />
              <FooterLinkGroup col>
                <FooterLink href="#">Privacy Policy</FooterLink>
                <FooterLink href="#">Terms &amp; Conditions</FooterLink>
              </FooterLinkGroup>
            </div>
          </div>
        </div>
        <FooterDivider />
        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <FooterCopyright href="#" by="Flowbite™" year={2022} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            {/* Here's where you replace FooterIcon with your custom solution */}
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <Icon name="facebook" size="md" />
              <span className="sr-only">Facebook page</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <Icon name="photo_camera" size="md" />
              <span className="sr-only">Instagram page</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <Icon name="chat" size="md" />
              <span className="sr-only">Twitter page</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <Icon name="code" size="md" />
              <span className="sr-only">GitHub account</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-900">
              <Icon name="palette" size="md" />
              <span className="sr-only">Dribbble account</span>
            </a>
          </div>
        </div>
        </div>
      </div>
    </Footer>
  );
}

export default Footer_FlowBite;